<?php
// api/keepers/liquidate.php

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
if (!isset($data['customer_id']) || !isset($data['gold_type']) || !isset($data['total_grams_sold']) || !isset($data['total_payout_ghs'])) {
    sendResponse('error', 'Missing required fields: customer_id, gold_type, total_grams_sold, total_payout_ghs', [], 400);
}

$customerId = (int)$data['customer_id'];
$goldType = strtolower($data['gold_type']);
$totalGramsSold = (float)$data['total_grams_sold'];
$totalPayoutGhs = (float)$data['total_payout_ghs'];

if ($customerId <= 0 || $totalGramsSold <= 0 || $totalPayoutGhs <= 0) {
    sendResponse('error', 'Invalid numeric values provided', [], 400);
}

if ($goldType !== 'balls' && $goldType !== 'refined') {
    sendResponse('error', 'Invalid gold_type. Must be balls or refined', [], 400);
}

try {
    // 0. Begin the database transaction
    $pdo->beginTransaction();

    // 1. UPDATE gold_vault records
    // Fetch keeper's current hold records in FIFO order and lock them for update
    $stmt = $pdo->prepare("SELECT id, weight_grams FROM gold_vault WHERE customer_id = ? AND gold_type = ? AND ownership_status = 'keeper_held' ORDER BY id ASC FOR UPDATE");
    $stmt->execute([$customerId, $goldType]);
    $vaultRecords = $stmt->fetchAll();

    $remainingToSell = $totalGramsSold;

    foreach ($vaultRecords as $row) {
        if ($remainingToSell <= 0.0001) break; // Finished fulfilling the sell amount

        $recordId = $row['id'];
        $recordGrams = (float)$row['weight_grams'];

        if ($recordGrams <= $remainingToSell) {
            // Full record converted to company ownership
            $updateStmt = $pdo->prepare("UPDATE gold_vault SET ownership_status = 'company_owned' WHERE id = ?");
            $updateStmt->execute([$recordId]);
            
            $remainingToSell -= $recordGrams;
        } else {
            // Partial conversion: subtract from keeper's record
            $newKeeperGrams = $recordGrams - $remainingToSell;
            $updateStmt = $pdo->prepare("UPDATE gold_vault SET weight_grams = ? WHERE id = ?");
            $updateStmt->execute([$newKeeperGrams, $recordId]);

            // Insert new company_owned record for the converted amount
            $insertStmt = $pdo->prepare("INSERT INTO gold_vault (gold_type, ownership_status, weight_grams, current_location, customer_id) VALUES (?, 'company_owned', ?, 'office_vault', ?)");
            $insertStmt->execute([$goldType, $remainingToSell, $customerId]);

            $remainingToSell = 0;
            break; // Done
        }
    }

    // Check if the keeper actually had enough gold to sell
    if ($remainingToSell > 0.0001) {
        throw new Exception("Insufficient keeper balance. Trying to sell {$totalGramsSold}g but only found " . ($totalGramsSold - $remainingToSell) . "g.");
    }

    // 2. INSERT a record into gold_purchases
    $insertPurchaseStmt = $pdo->prepare("INSERT INTO gold_purchases (customer_id, gold_type, weight_grams, total_paid_ghs, origin) VALUES (?, ?, ?, ?, 'from_keeper')");
    $insertPurchaseStmt->execute([$customerId, $goldType, $totalGramsSold, $totalPayoutGhs]);
    $purchaseId = $pdo->lastInsertId();

    // 3. INSERT a record into capital_ledger
    // Get last running balance securely
    $balanceStmt = $pdo->query("SELECT running_balance FROM capital_ledger ORDER BY id DESC LIMIT 1 FOR UPDATE");
    $lastLedger = $balanceStmt->fetch();
    $currentBalance = $lastLedger ? (float)$lastLedger['running_balance'] : 0.0;
    
    // Negative deduction logic
    $deductionAmount = -1 * abs($totalPayoutGhs);
    $newBalance = $currentBalance + $deductionAmount;

    $insertLedgerStmt = $pdo->prepare("INSERT INTO capital_ledger (transaction_type, amount_ghs, running_balance, reference_id) VALUES ('gold_purchase', ?, ?, ?)");
    $insertLedgerStmt->execute([$deductionAmount, $newBalance, $purchaseId]);

    
    log_activity($pdo, $current_user_id ?? null, 'LIQUIDATE_KEEPER', 'gold_purchases', $purchaseId, null, ['grams_liquidated' => $totalGramsSold, 'payout' => $totalPayoutGhs]);
    // 4. Commit Transaction if everything succeeds
    $pdo->commit();

    sendResponse('success', 'Keeper gold successfully liquidated', [
        'transaction_id' => 'TXN-' . $purchaseId,
        'grams_liquidated' => $totalGramsSold,
        'amount_deducted_ghs' => abs($deductionAmount),
        'vault_status' => 'Updated to company_owned'
    ], 200);

} catch (\Exception $e) {
    // 5. Roll back the entire transaction if any step fails
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    // Pass the specific error message along in the response
    sendResponse('error', 'Liquidation failed: ' . $e->getMessage(), [], 500);
}
