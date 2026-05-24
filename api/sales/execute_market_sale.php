<?php
// api/sales/execute_market_sale.php

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
if (!isset($data['actual_revenue_ghs'])) {
    sendResponse('error', 'Missing required field: actual_revenue_ghs', [], 400);
}

$actualRevenueGhs = (float)$data['actual_revenue_ghs'];

if ($actualRevenueGhs <= 0) {
    sendResponse('error', 'actual_revenue_ghs must be greater than zero', [], 400);
}

try {
    // 0. Begin the database transaction
    $pdo->beginTransaction();

    // 1. SELECT SUM(weight_grams) for company_owned gold that is currently in the office
    $sumStmt = $pdo->query("SELECT SUM(weight_grams) as total_grams FROM gold_vault WHERE ownership_status = 'company_owned' AND current_location = 'office_vault' FOR UPDATE");
    $sumResult = $sumStmt->fetch();
    $gramsCleared = $sumResult ? (float)$sumResult['total_grams'] : 0.0;

    if ($gramsCleared <= 0) {
        throw new Exception("No company_owned gold found in the office vault to sell.");
    }

    // 2. UPDATE all these records, changing their location status to 'sold_main_market'
    $updateStmt = $pdo->prepare("UPDATE gold_vault SET current_location = 'sold_main_market' WHERE ownership_status = 'company_owned' AND current_location = 'office_vault'");
    $updateStmt->execute();

    // 3. INSERT a new record into capital_ledger
    // Securely fetch the latest running balance
    $balanceStmt = $pdo->query("SELECT running_balance FROM capital_ledger ORDER BY id DESC LIMIT 1 FOR UPDATE");
    $lastLedger = $balanceStmt->fetch();
    $currentBalance = $lastLedger ? (float)$lastLedger['running_balance'] : 0.0;
    
    // Calculate the injection (positive value)
    $newBalance = $currentBalance + $actualRevenueGhs;

    // Use transaction_type 'out_sale_revenue'
    $insertLedgerStmt = $pdo->prepare("INSERT INTO capital_ledger (transaction_type, amount_ghs, running_balance, reference_id) VALUES ('out_sale_revenue', ?, ?, NULL)");
    $insertLedgerStmt->execute([$actualRevenueGhs, $newBalance]);

    // 4. Commit Transaction
    $pdo->commit();

    sendResponse('success', 'Market sale executed successfully', [
        'grams_cleared' => round($gramsCleared, 4),
        'capital_injected_ghs' => $actualRevenueGhs,
        'vault_status' => 'Inventory marked as sold_main_market',
        'ledger_status' => 'Revenue added to active capital'
    ], 200);

} catch (\Exception $e) {
    // Roll back the entire transaction if any step fails
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    // Output error response
    sendResponse('error', 'Failed to execute market sale: ' . $e->getMessage(), [], 500);
}
