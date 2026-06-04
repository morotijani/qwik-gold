<?php
// api/sales/execute_market_sale.php

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

    // 1. SELECT and calculate totals for company_owned gold that is currently in the office
    $sumStmt = $pdo->query("
        SELECT 
            gold_type,
            SUM(weight_grams) as total_grams,
            SUM(volume) as total_volume,
            SUM(total_blades) as total_blades
        FROM gold_vault 
        WHERE ownership_status = 'company_owned' 
        AND current_location = 'office_vault' 
        GROUP BY gold_type
        FOR UPDATE
    ");
    $items = $sumStmt->fetchAll();

    $overallGrams = 0.0;
    $overallVolume = 0.0;
    $overallBlades = 0.0;
    $hasRefined = false;
    $hasBalls = false;

    foreach ($items as $item) {
        $overallGrams += (float)$item['total_grams'];
        $overallVolume += (float)$item['total_volume'];
        $overallBlades += (float)$item['total_blades'];
        if ($item['gold_type'] === 'refined') $hasRefined = true;
        if ($item['gold_type'] === 'balls') $hasBalls = true;
    }

    if ($overallGrams <= 0) {
        throw new Exception("No company_owned gold found in the office vault to sell.");
    }

    $mixedType = ($hasRefined && $hasBalls) ? 'mixed' : ($hasRefined ? 'refined' : 'balls');

    // Currently we don't have a global system price table, so we rely on the frontend to pass estimated_revenue_ghs, or we just set it to 0 if not provided
    $estimatedCash = isset($data['estimated_revenue_ghs']) ? (float)$data['estimated_revenue_ghs'] : 0.0;
    $localPrice = isset($data['local_price']) ? (float)$data['local_price'] : 0.0;

    $saleUid = 'SALE-' . strtoupper(uniqid());

    // 1.5 INSERT into market_sales
    $insertSaleStmt = $pdo->prepare("
        INSERT INTO market_sales 
        (sale_uid, gold_type, total_grams, total_volume, total_blades, estimated_cash, actual_cash, notes) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $insertSaleStmt->execute([
        $saleUid, 
        $mixedType, 
        $overallGrams, 
        $overallVolume, 
        $overallBlades, 
        $estimatedCash, 
        $actualRevenueGhs, 
        $data['notes'] ?? ''
    ]);
    $marketSaleId = $pdo->lastInsertId();

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
    $insertLedgerStmt = $pdo->prepare("INSERT INTO capital_ledger (transaction_type, amount_ghs, running_balance, reference_id) VALUES ('out_sale_revenue', ?, ?, ?)");
    $insertLedgerStmt->execute([$actualRevenueGhs, $newBalance, $marketSaleId]);

    log_activity($pdo, $current_user_id ?? null, 'MARKET_SALE', 'capital_ledger', $marketSaleId, null, ['actual_revenue' => $actualRevenueGhs]);
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
