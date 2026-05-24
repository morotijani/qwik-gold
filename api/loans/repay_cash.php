<?php
// api/loans/repay_cash.php

require_once '../../config/headers.php';
require_once '../../config/database.php';

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
    
    // Mathematically cap the payment to the current principal.
    // If a customer hands over 500 GHS for a 400 GHS debt, the office hands them back 100 GHS physical change,
    // so the ledger should only record an injection of exactly 400 GHS to close the loan.
    $actualPayment = min($amountPaidGhs, $currentPrincipal);
    $newPrincipal = $currentPrincipal - $actualPayment;
    $newStatus = 'active';
    
    // UPDATE loans table
    if ($newPrincipal <= 0.0001) { // Floating point safety for zero
        $newStatus = 'settled';
        $newPrincipal = 0.0;
        $updateStmt = $pdo->prepare("UPDATE loans SET principal_amount = 0, status = 'settled', settlement_note = 'Settled via cash repayment' WHERE id = ?");
        $updateStmt->execute([$loanId]);
    } else {
        $updateStmt = $pdo->prepare("UPDATE loans SET principal_amount = ? WHERE id = ?");
        $updateStmt->execute([$newPrincipal, $loanId]);
    }

    // 2. INSERT into capital_ledger
    // Securely fetch the latest running balance
    $balanceStmt = $pdo->query("SELECT running_balance FROM capital_ledger ORDER BY id DESC LIMIT 1 FOR UPDATE");
    $lastLedger = $balanceStmt->fetch();
    $currentBalance = $lastLedger ? (float)$lastLedger['running_balance'] : 0.0;
    
    // Positive cash injection
    $newBalance = $currentBalance + $actualPayment;

    $insertLedgerStmt = $pdo->prepare("INSERT INTO capital_ledger (transaction_type, amount_ghs, running_balance, reference_id) VALUES ('loan_repaid', ?, ?, ?)");
    $insertLedgerStmt->execute([$actualPayment, $newBalance, $loanId]);

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
    sendResponse('error', 'Repayment failed: ' . $e->getMessage(), [], 500);
}
