<?php
// api/purchases/create.php

require_once '../../config/headers.php';
require_once '../../config/database.php';
require_once '../helpers/logger.php';
require_once '../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse('error', 'Method not allowed. Use POST.', [], 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    sendResponse('error', 'Invalid JSON payload', [], 400);
}

$goldType = $input['gold_type'] ?? null;
$weightGrams = isset($input['weight_grams']) ? (float)$input['weight_grams'] : 0.0;
$totalPaid = isset($input['total_paid_ghs']) ? (float)$input['total_paid_ghs'] : 0.0;
$notes = isset($input['notes']) ? trim($input['notes']) : null;
$customerId = !empty($input['customer_id']) ? (int)$input['customer_id'] : null;

// Validation
if ($goldType !== 'balls' && $goldType !== 'refined') {
    sendResponse('error', 'Invalid gold type', [], 400);
}
if ($weightGrams <= 0) {
    sendResponse('error', 'Weight must be greater than zero', [], 400);
}
if ($totalPaid <= 0) {
    sendResponse('error', 'Amount paid must be greater than zero', [], 400);
}

try {
    $pdo->beginTransaction();

    // 1. Insert into gold_vault
    $vaultStmt = $pdo->prepare("INSERT INTO gold_vault (gold_type, ownership_status, weight_grams, current_location, customer_id) VALUES (?, 'company_owned', ?, 'office_vault', ?)");
    $vaultStmt->execute([$goldType, $weightGrams, $customerId]);
    
    $txnRef = 'PUR-' . strtoupper(substr(uniqid(), -6)) . rand(100, 999);

    // 2. Insert into gold_purchases
    $purchaseStmt = $pdo->prepare("INSERT INTO gold_purchases (transaction_ref, customer_id, gold_type, weight_grams, total_paid_ghs, origin, notes) VALUES (?, ?, ?, ?, ?, 'walk_in', ?)");
    $purchaseStmt->execute([$txnRef, $customerId, $goldType, $weightGrams, $totalPaid, $notes]);
    $purchaseId = $pdo->lastInsertId();

    // 3. Deduct from capital_ledger
    $balanceStmt = $pdo->query("SELECT running_balance FROM capital_ledger ORDER BY id DESC LIMIT 1 FOR UPDATE");
    $lastLedger = $balanceStmt->fetch();
    $currentBalance = $lastLedger ? (float)$lastLedger['running_balance'] : 0.0;
    
    $deductionAmount = -1 * abs($totalPaid);
    $newBalance = $currentBalance + $deductionAmount;

    $ledgerStmt = $pdo->prepare("INSERT INTO capital_ledger (transaction_type, amount_ghs, running_balance, reference_id) VALUES ('gold_purchase', ?, ?, ?)");
    $ledgerStmt->execute([$deductionAmount, $newBalance, $purchaseId]);

    // 4. Log the transaction
    log_activity($pdo, $current_user_id ?? null, 'WALK_IN_PURCHASE', 'gold_purchases', $purchaseId, null, [
        'gold_type' => $goldType,
        'weight' => $weightGrams,
        'payout' => $totalPaid,
        'customer' => $customerId,
        'notes' => $notes
    ]);

    $pdo->commit();

    sendResponse('success', 'Walk-in purchase successfully completed', [
        'transaction_id' => $txnRef,
        'grams_added' => $weightGrams,
        'capital_deducted' => abs($deductionAmount)
    ], 201);

} catch (Exception $e) {
    $pdo->rollBack();
    sendResponse('error', 'Transaction failed: ' . $e->getMessage(), [], 500);
}
