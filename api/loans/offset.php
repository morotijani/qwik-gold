<?php
// api/loans/offset.php

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

// Validate inputs
$requiredFields = ['loan_id', 'customer_id', 'gold_type', 'weight_grams', 'gold_value_ghs'];
foreach ($requiredFields as $field) {
    if (!isset($data[$field])) {
        sendResponse('error', "Missing required field: {$field}", [], 400);
    }
}

$loanId = (int)$data['loan_id'];
$customerId = (int)$data['customer_id'];
$goldType = strtolower($data['gold_type']);
$weightGrams = (float)$data['weight_grams'];
$goldValueGhs = (float)$data['gold_value_ghs'];

if ($loanId <= 0 || $customerId <= 0 || $weightGrams <= 0 || $goldValueGhs <= 0) {
    sendResponse('error', 'Invalid numeric values provided', [], 400);
}

if ($goldType !== 'balls' && $goldType !== 'refined') {
    sendResponse('error', 'Invalid gold_type. Must be balls or refined', [], 400);
}

try {
    // 0. Begin the transaction
    $pdo->beginTransaction();

    // 1. SELECT the principal_amount from loans and lock the row
    $stmt = $pdo->prepare("SELECT principal_amount, status FROM loans WHERE id = ? FOR UPDATE");
    $stmt->execute([$loanId]);
    $loan = $stmt->fetch();

    if (!$loan) {
        throw new Exception("Loan not found");
    }

    if ($loan['status'] !== 'active') {
        throw new Exception("This loan is already settled");
    }

    $principalAmount = (float)$loan['principal_amount'];
    $changeDue = 0.0;
    $newStatus = 'active';

    // Determine comment
    $userComment = isset($data['comment']) && !empty(trim($data['comment'])) ? trim($data['comment']) : null;

    // 2 & 3. Compare gold value and handle full settlement
    if ($goldValueGhs >= $principalAmount) {
        $newStatus = 'settled';
        
        // Update loan status to 'settled' (zeroing out the principal is optional but good practice)
        $updateStmt = $pdo->prepare("UPDATE loans SET status = 'settled', principal_amount = 0, settlement_note = 'Settled via gold offset' WHERE id = ?");
        $updateStmt->execute([$loanId]);

        // Calculate the change due to the customer
        $changeDue = $goldValueGhs - $principalAmount;

        // If we owe them change, touch the capital ledger
        if ($changeDue > 0) {
            $balanceStmt = $pdo->query("SELECT running_balance FROM capital_ledger ORDER BY id DESC LIMIT 1 FOR UPDATE");
            $lastLedger = $balanceStmt->fetch();
            $currentBalance = $lastLedger ? (float)$lastLedger['running_balance'] : 0.0;
            
            $deduction = -1 * abs($changeDue);
            $newBalance = $currentBalance + $deduction;

            // Using 'loan_repaid' as the closest semantic transaction_type from schema
            $insertLedgerStmt = $pdo->prepare("INSERT INTO capital_ledger (transaction_type, amount_ghs, running_balance, reference_id) VALUES ('loan_repaid', ?, ?, ?)");
            $insertLedgerStmt->execute([$deduction, $newBalance, $loanId]);
        }
        
        $message = "Loan settled with gold offset";
        
    } else {
        // 4. Handle partial offset
        $newPrincipal = $principalAmount - $goldValueGhs;
        
        if ($userComment) {
            $updateStmt = $pdo->prepare("UPDATE loans SET principal_amount = ?, settlement_note = ? WHERE id = ?");
            $updateStmt->execute([$newPrincipal, $userComment, $loanId]);
        } else {
            $updateStmt = $pdo->prepare("UPDATE loans SET principal_amount = ? WHERE id = ?");
            $updateStmt->execute([$newPrincipal, $loanId]);
        }
        
        $message = "Loan partially offset with gold";
    }

    // 5. IN BOTH CASES: Insert gold into vault & gold_purchases
    // Insert into gold_vault as company owned (customer_id is NULL for company owned gold per schema)
    $insertVaultStmt = $pdo->prepare("INSERT INTO gold_vault (gold_type, ownership_status, weight_grams, current_location, customer_id) VALUES (?, 'company_owned', ?, 'office_vault', NULL)");
    $insertVaultStmt->execute([$goldType, $weightGrams]);

    // Insert purchase record with origin 'loan_offset'
    $insertPurchaseStmt = $pdo->prepare("INSERT INTO gold_purchases (customer_id, gold_type, weight_grams, total_paid_ghs, origin) VALUES (?, ?, ?, ?, 'loan_offset')");
    $insertPurchaseStmt->execute([$customerId, $goldType, $weightGrams, $goldValueGhs]);

    
    log_activity($pdo, $current_user_id ?? null, 'OFFSET_LOAN_GOLD', 'loans', $loanId, ['old_principal' => $currentPrincipal], ['new_principal' => $newPrincipal]);
    // Commit Transaction
    $pdo->commit();

    sendResponse('success', $message, [
        'loan_id' => $loanId,
        'new_loan_status' => $newStatus,
        'gold_purchased_grams' => $weightGrams,
        'gold_value_ghs' => $goldValueGhs,
        'change_due_to_customer_ghs' => $changeDue,
        'vault_status' => 'Gold added to company vault'
    ], 200);

} catch (\Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    sendResponse('error', 'Loan offset failed: ' . $e->getMessage(), [], 500);
}
