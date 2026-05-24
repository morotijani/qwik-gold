<?php
// api/sales/create.php

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
if (!isset($data['gold_type']) || !isset($data['weight_grams']) || !isset($data['total_paid_ghs'])) {
    sendResponse('error', 'Missing required fields: gold_type, weight_grams, total_paid_ghs', [], 400);
}

// customer_id is optional for anonymous walk-ins
$customerId = isset($data['customer_id']) && $data['customer_id'] !== '' ? (int)$data['customer_id'] : null;
$goldType = strtolower($data['gold_type']);
$weightGrams = (float)$data['weight_grams'];
$totalPaidGhs = (float)$data['total_paid_ghs'];

if ($weightGrams <= 0 || $totalPaidGhs <= 0) {
    sendResponse('error', 'Weight and total paid must be greater than zero', [], 400);
}

if ($goldType !== 'balls' && $goldType !== 'refined') {
    sendResponse('error', 'Invalid gold_type. Must be balls or refined', [], 400);
}

if ($customerId !== null && $customerId <= 0) {
    sendResponse('error', 'Invalid customer_id', [], 400);
}

try {
    // 0. Begin the transaction
    $pdo->beginTransaction();

    // 1. INSERT into gold_vault with ownership 'company_owned'
    $insertVaultStmt = $pdo->prepare("INSERT INTO gold_vault (gold_type, ownership_status, weight_grams, current_location, customer_id) VALUES (?, 'company_owned', ?, 'office_vault', ?)");
    $insertVaultStmt->execute([$goldType, $weightGrams, $customerId]);
    $vaultId = $pdo->lastInsertId();

    // 2. INSERT into gold_purchases with origin 'walk_in'
    $insertPurchaseStmt = $pdo->prepare("INSERT INTO gold_purchases (customer_id, gold_type, weight_grams, total_paid_ghs, origin) VALUES (?, ?, ?, ?, 'walk_in')");
    $insertPurchaseStmt->execute([$customerId, $goldType, $weightGrams, $totalPaidGhs]);
    $purchaseId = $pdo->lastInsertId();

    // 3. INSERT into capital_ledger to deduct the cash
    // Fetch running balance securely
    $balanceStmt = $pdo->query("SELECT running_balance FROM capital_ledger ORDER BY id DESC LIMIT 1 FOR UPDATE");
    $lastLedger = $balanceStmt->fetch();
    $currentBalance = $lastLedger ? (float)$lastLedger['running_balance'] : 0.0;
    
    // Negative deduction
    $deductionAmount = -1 * abs($totalPaidGhs);
    $newBalance = $currentBalance + $deductionAmount;

    $insertLedgerStmt = $pdo->prepare("INSERT INTO capital_ledger (transaction_type, amount_ghs, running_balance, reference_id) VALUES ('gold_purchase', ?, ?, ?)");
    $insertLedgerStmt->execute([$deductionAmount, $newBalance, $purchaseId]);

    // 4. Commit Transaction
    $pdo->commit();

    sendResponse('success', 'Walk-in gold purchase recorded successfully', [
        'purchase_id' => $purchaseId,
        'vault_id' => $vaultId,
        'customer_id' => $customerId,
        'gold_type' => $goldType,
        'weight_grams' => $weightGrams,
        'capital_deducted_ghs' => abs($deductionAmount),
        'new_capital_balance' => $newBalance
    ], 201);

} catch (\Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    // Handle foreign key constraint for customer_id
    if ($e instanceof \PDOException && $e->getCode() == 23000) {
         sendResponse('error', 'Invalid customer_id: Customer does not exist.', [], 400);
    }
    
    sendResponse('error', 'Failed to record purchase: ' . $e->getMessage(), [], 500);
}
