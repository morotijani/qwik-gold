<?php
// api/sales/complete_sale.php

require_once '../../config/headers.php';
require_once '../../config/database.php';
require_once '../middleware/auth.php';
require_once '../helpers/logger.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse('error', 'Method not allowed', [], 405);
}

$jsonInput = file_get_contents('php://input');
$data = json_decode($jsonInput, true);

if (!isset($data['sale_id']) || !isset($data['actual_local_price']) || !isset($data['actual_grams'])) {
    sendResponse('error', 'Missing required fields', [], 400);
}

$saleId = (int)$data['sale_id'];
$actualPrice = (float)$data['actual_local_price'];
$actualGrams = (float)$data['actual_grams'];
$actualVolume = isset($data['actual_volume']) ? (float)$data['actual_volume'] : 0.0;
$actualBlades = isset($data['actual_blades']) ? (float)$data['actual_blades'] : 0.0;

if ($actualPrice <= 0) {
    sendResponse('error', 'Actual price must be greater than zero', [], 400);
}

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("SELECT * FROM market_sales WHERE id = ? AND status = 'pending' FOR UPDATE");
    $stmt->execute([$saleId]);
    $sale = $stmt->fetch();

    if (!$sale) {
        throw new Exception("Sale not found or already completed.");
    }

    $goldType = $sale['gold_type'];
    $actualCash = 0.0;

    if ($goldType === 'balls') {
        $actualCash = $actualBlades * $actualPrice;
    } else if ($goldType === 'refined') {
        if ($actualVolume > 0) {
            $density = $actualGrams / $actualVolume;
            $karat = 0;
            if ($density > 0) {
                $karat = (($density - 10.51) * 52.838) / $density;
            }
            $pounds = $actualGrams / 7.75;
            $actualCash = ($karat * $actualPrice / 23) * $pounds;
        }
    }

    // 1. Update market_sales
    $updateSale = $pdo->prepare("
        UPDATE market_sales 
        SET status = 'completed', 
            actual_local_price = ?, 
            actual_grams_market = ?, 
            actual_volume_market = ?, 
            actual_blades_market = ?, 
            actual_cash = ? 
        WHERE id = ?
    ");
    $updateSale->execute([$actualPrice, $actualGrams, $actualVolume, $actualBlades, $actualCash, $saleId]);

    // 2. Inject into capital_ledger
    $balanceStmt = $pdo->query("SELECT running_balance FROM capital_ledger ORDER BY id DESC LIMIT 1 FOR UPDATE");
    $lastLedger = $balanceStmt->fetch();
    $currentBalance = $lastLedger ? (float)$lastLedger['running_balance'] : 0.0;
    
    $newBalance = $currentBalance + $actualCash;

    $insertLedger = $pdo->prepare("INSERT INTO capital_ledger (transaction_type, amount_ghs, running_balance, reference_id) VALUES ('out_sale_revenue', ?, ?, ?)");
    $insertLedger->execute([$actualCash, $newBalance, $saleId]);

    log_activity($pdo, $current_user_id ?? null, 'COMPLETE_SALE', 'market_sales', $saleId, ['old_status' => 'pending'], ['new_status' => 'completed', 'actual_cash' => $actualCash]);

    $pdo->commit();

    sendResponse('success', 'Sale completed successfully', [
        'actual_cash' => $actualCash
    ], 200);

} catch (\Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    sendResponse('error', 'Failed to complete sale: ' . $e->getMessage(), [], 500);
}
