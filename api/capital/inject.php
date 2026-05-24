<?php
// api/capital/inject.php

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
if (!isset($data['source_description']) || !isset($data['amount_ghs'])) {
    sendResponse('error', 'Missing required fields: source_description, amount_ghs', [], 400);
}

$sourceDescription = trim($data['source_description']);
$amountGhs = (float)$data['amount_ghs'];

if (empty($sourceDescription)) {
    sendResponse('error', 'Source description cannot be empty', [], 400);
}

if ($amountGhs <= 0) {
    sendResponse('error', 'Injection amount must be greater than zero', [], 400);
}

try {
    // 0. Begin the database transaction
    $pdo->beginTransaction();

    // 1. Fetch the most recent running balance securely
    $balanceStmt = $pdo->query("SELECT running_balance FROM capital_ledger ORDER BY id DESC LIMIT 1 FOR UPDATE");
    $lastLedger = $balanceStmt->fetch();
    $currentBalance = $lastLedger ? (float)$lastLedger['running_balance'] : 0.0;
    
    // 2. Positive cash injection
    $newBalance = $currentBalance + $amountGhs;

    // 3. INSERT into capital_ledger
    $insertLedgerStmt = $pdo->prepare("INSERT INTO capital_ledger (transaction_type, amount_ghs, running_balance, description) VALUES ('external_capital_in', ?, ?, ?)");
    $insertLedgerStmt->execute([$amountGhs, $newBalance, $sourceDescription]);

    
    log_activity($pdo, $current_user_id ?? null, 'INJECT_CAPITAL', 'capital_ledger', 1, null, ['amount' => $amountGhs, 'source' => $sourceDescription]);
    // 4. Commit Transaction
    $pdo->commit();

    sendResponse('success', 'External capital injected successfully', [
        'source_description' => $sourceDescription,
        'capital_injected_ghs' => $amountGhs,
        'new_capital_balance' => $newBalance
    ], 201);

} catch (\Exception $e) {
    // Roll back if any error occurs
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    sendResponse('error', 'Capital injection failed: ' . $e->getMessage(), [], 500);
}
