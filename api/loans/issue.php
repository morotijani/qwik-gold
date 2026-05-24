<?php
// api/loans/issue.php

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
if (!isset($data['customer_id']) || !isset($data['principal_amount_ghs'])) {
    sendResponse('error', 'Missing required fields: customer_id, principal_amount_ghs', [], 400);
}

$customerId = (int)$data['customer_id'];
$principalAmount = (float)$data['principal_amount_ghs'];

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

    // 3. Commit Transaction if successful
    $pdo->commit();

    sendResponse('success', 'Loan successfully issued', [
        'loan_id' => $loanId,
        'customer_id' => $customerId,
        'principal_amount_ghs' => $principalAmount,
        'capital_deducted' => abs($deductionAmount)
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
