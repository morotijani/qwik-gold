<?php
// api/loans/repay_cash.php

require_once '../../config/headers.php';
require_once '../../config/database.php';
require_once '../middleware/auth.php';
require_once '../helpers/logger.php';


// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse('error', 'Method not allowed', [], 405);
}

// Get the JSON payload
$jsonInput = file_get_contents('php://input');
$data = json_decode($jsonInput, true);

if (!$data) {
    sendResponse('error', 'Invalid JSON payload', [], 400);
}

// Validate base required fields
if (!isset($data['loan_id']) || !isset($data['amount_paid_ghs'])) {
    sendResponse('error', 'Missing required fields: loan_id, amount_paid_ghs', [], 400);
}

$loanId = (int)$data['loan_id'];
$amountPaidGhs = (float)$data['amount_paid_ghs'];

if ($loanId <= 0 || $amountPaidGhs <= 0) {
    sendResponse('error', 'Invalid numeric values provided', [], 400);
}

try {
    // 0. Begin the database transaction
    $pdo->beginTransaction();

    // 1. SELECT the current loan state and lock it
    $stmt = $pdo->prepare("SELECT principal_amount, status FROM loans WHERE id = ? FOR UPDATE");
    $stmt->execute([$loanId]);
    $loan = $stmt->fetch();

    if (!$loan) {
        throw new Exception("Loan not found.");
    }

    if ($loan['status'] !== 'active') {
        throw new Exception("This loan is already fully settled.");
    }

    $currentPrincipal = (float)$loan['principal_amount'];
    
    // Server-side validation
    if ($amountPaidGhs > $currentPrincipal) {
        throw new Exception("Amount paid cannot exceed the outstanding principal balance ({$currentPrincipal} GHS).");
    }
    
    $actualPayment = $amountPaidGhs;
    $newPrincipal = $currentPrincipal - $actualPayment;
    $newStatus = 'active';
    
    // Determine comment
    $userComment = isset($data['comment']) && !empty(trim($data['comment'])) ? trim($data['comment']) : null;
    
    // UPDATE loans table
    if ($newPrincipal <= 0.0001) { // Floating point safety for zero
        $newStatus = 'settled';
        $newPrincipal = 0.0;
        // Default note for full settlement
        $updateStmt = $pdo->prepare("UPDATE loans SET principal_amount = 0, status = 'settled', settlement_note = 'Settled via cash repayment' WHERE id = ?");
        $updateStmt->execute([$loanId]);
    } else {
        if ($userComment) {
            $updateStmt = $pdo->prepare("UPDATE loans SET principal_amount = ?, settlement_note = ? WHERE id = ?");
            $updateStmt->execute([$newPrincipal, $userComment, $loanId]);
        } else {
            $updateStmt = $pdo->prepare("UPDATE loans SET principal_amount = ? WHERE id = ?");
            $updateStmt->execute([$newPrincipal, $loanId]);
        }
    }

    // 1b. Insert into loan_settlements
    $settlementStmt = $pdo->prepare("
        INSERT INTO loan_settlements 
        (loan_id, settlement_type, amount_paid, principal_before, principal_after, processed_by, notes)
        VALUES (?, 'cash', ?, ?, ?, ?, ?)
    ");
    $settlementStmt->execute([
        $loanId, $actualPayment, $currentPrincipal, $newPrincipal, $current_user_id, $userComment
    ]);

    // 2. INSERT into capital_ledger
    // Securely fetch the latest running balance
    $balanceStmt = $pdo->query("SELECT running_balance FROM capital_ledger ORDER BY id DESC LIMIT 1 FOR UPDATE");
    $lastLedger = $balanceStmt->fetch();
    $currentBalance = $lastLedger ? (float)$lastLedger['running_balance'] : 0.0;
    
    // Positive cash injection
    $newBalance = $currentBalance + $actualPayment;

    $insertLedgerStmt = $pdo->prepare("INSERT INTO capital_ledger (transaction_type, amount_ghs, running_balance, reference_id) VALUES ('loan_repaid', ?, ?, ?)");
    $insertLedgerStmt->execute([$actualPayment, $newBalance, $loanId]);

    
    log_activity($pdo, $current_user_id ?? null, 'REPAY_LOAN_CASH', 'loans', $loanId, ['old_principal' => $currentPrincipal], ['new_principal' => $newPrincipal, 'status' => $newStatus]);
    // 3. Commit Transaction
    $pdo->commit();

    sendResponse('success', 'Cash repayment processed successfully', [
        'loan_id' => $loanId,
        'payment_applied_ghs' => $actualPayment,
        'new_principal_balance' => $newPrincipal,
        'loan_status' => $newStatus,
        'capital_injected_ghs' => $actualPayment,
        'new_capital_balance' => $newBalance
    ], 200);

} catch (\Exception $e) {
    // Roll back the entire transaction if any step fails
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("System Error: " . $e->getMessage());
    sendResponse('error', 'A system error occurred while processing your request.', [], 500);
}
