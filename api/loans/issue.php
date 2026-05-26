<?php
// api/loans/issue.php

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
if (!isset($data['customer_id']) || !isset($data['principal_amount'])) {
    sendResponse('error', 'Missing required fields: customer_id, principal_amount', [], 400);
}

$customerId = (int)$data['customer_id'];
$principalAmount = (float)$data['principal_amount'];
$hasCollateral = isset($data['has_collateral']) ? (bool)$data['has_collateral'] : false;

$goldType = null;
$weightGrams = 0.0;

if ($hasCollateral) {
    if (!isset($data['gold_type']) || !isset($data['weight_grams'])) {
        sendResponse('error', 'Missing collateral fields: gold_type, weight_grams', [], 400);
    }
    $goldType = strtolower($data['gold_type']);
    $weightGrams = (float)$data['weight_grams'];
    
    if ($goldType !== 'balls' && $goldType !== 'refined') {
        sendResponse('error', 'Invalid gold_type for collateral', [], 400);
    }
    if ($weightGrams <= 0) {
        sendResponse('error', 'Invalid weight_grams for collateral', [], 400);
    }
}

if ($customerId <= 0 || $principalAmount <= 0) {
    sendResponse('error', 'Invalid numeric values provided', [], 400);
}

try {
    // 0. Begin the database transaction
    $pdo->beginTransaction();

    // 1. INSERT a new record into the loans table
    $stmt = $pdo->prepare("INSERT INTO loans (customer_id, principal_amount, status) VALUES (?, ?, 'active')");
    $stmt->execute([$customerId, $principalAmount]);
    $loanId = $pdo->lastInsertId();

    // 1b. If collateral is provided, add it to gold_vault
    if ($hasCollateral) {
        $insertVaultStmt = $pdo->prepare("INSERT INTO gold_vault (gold_type, ownership_status, weight_grams, current_location, customer_id) VALUES (?, 'keeper_held', ?, 'office_vault', ?)");
        $insertVaultStmt->execute([$goldType, $weightGrams, $customerId]);
    }

    // 2. INSERT a record into the capital_ledger table
    // Securely lock and fetch the most recent running balance
    $balanceStmt = $pdo->query("SELECT running_balance FROM capital_ledger ORDER BY id DESC LIMIT 1 FOR UPDATE");
    $lastLedger = $balanceStmt->fetch();
    $currentBalance = $lastLedger ? (float)$lastLedger['running_balance'] : 0.0;
    
    // Calculate the deduction
    $deductionAmount = -1 * abs($principalAmount);
    $newBalance = $currentBalance + $deductionAmount;

    $insertLedgerStmt = $pdo->prepare("INSERT INTO capital_ledger (transaction_type, amount_ghs, running_balance, reference_id) VALUES ('loan_issued', ?, ?, ?)");
    $insertLedgerStmt->execute([$deductionAmount, $newBalance, $loanId]);

    
    log_activity($pdo, $current_user_id ?? null, 'ISSUE_LOAN', 'loans', $loanId, null, [
        'principal' => $principalAmount, 
        'customer_id' => $customerId,
        'collateral_grams' => $weightGrams
    ]);
    
    // 3. Commit Transaction if successful
    $pdo->commit();

    sendResponse('success', 'Loan successfully issued', [
        'loan_id' => $loanId,
        'customer_id' => $customerId,
        'principal_amount_ghs' => $principalAmount,
        'capital_deducted' => abs($deductionAmount),
        'collateral_recorded' => $hasCollateral
    ], 201);

} catch (\Exception $e) {
    // Roll back the entire transaction if any step fails
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    // Gracefully handle foreign key failure (customer doesn't exist)
    if ($e instanceof \PDOException && $e->getCode() == 23000) {
         sendResponse('error', 'Invalid customer_id: Customer does not exist.', [], 400);
    }
    
    // Output error response
    sendResponse('error', 'Failed to issue loan: ' . $e->getMessage(), [], 500);
}
