<?php
// api/sales/initiate_sale.php

require_once '../../config/headers.php';
require_once '../../config/database.php';
require_once '../middleware/auth.php';
require_once '../helpers/logger.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse('error', 'Method not allowed', [], 405);
}

$jsonInput = file_get_contents('php://input');
$data = json_decode($jsonInput, true);

if (!isset($data['gold_type']) || !isset($data['estimated_local_price'])) {
    sendResponse('error', 'Missing required fields', [], 400);
}

$goldType = $data['gold_type']; // 'refined' or 'balls'
$estimatedPrice = (float)$data['estimated_local_price'];

if ($estimatedPrice <= 0) {
    sendResponse('error', 'Estimated price must be greater than zero', [], 400);
}
if (!in_array($goldType, ['refined', 'balls'])) {
    sendResponse('error', 'Invalid gold type', [], 400);
}

try {
    $pdo->beginTransaction();

    // 1. Fetch all company_owned gold in office_vault for the chosen type
    $sumStmt = $pdo->prepare("
        SELECT 
            SUM(weight_grams) as total_grams,
            SUM(volume) as total_volume,
            SUM(total_blades) as total_blades
        FROM gold_vault 
        WHERE ownership_status = 'company_owned' 
        AND current_location = 'office_vault' 
        AND gold_type = ?
        FOR UPDATE
    ");
    $sumStmt->execute([$goldType]);
    $item = $sumStmt->fetch();

    $overallGrams = (float)$item['total_grams'];
    $overallVolume = (float)$item['total_volume'];
    $overallBlades = (float)$item['total_blades'];

    if ($overallGrams <= 0 && $overallBlades <= 0) {
        throw new Exception("No company_owned $goldType gold found in the office vault to sell.");
    }
    
    // Override with user-provided estimates if present
    if (isset($data['total_grams']) && (float)$data['total_grams'] > 0) {
        $overallGrams = (float)$data['total_grams'];
    }
    if ($goldType === 'refined' && isset($data['total_volume']) && (float)$data['total_volume'] > 0) {
        $overallVolume = (float)$data['total_volume'];
    }
    if ($goldType === 'balls' && isset($data['total_blades']) && (float)$data['total_blades'] > 0) {
        $overallBlades = (float)$data['total_blades'];
    }

    $estimatedCash = 0.0;
    if ($goldType === 'balls') {
        $estimatedCash = $overallBlades * $estimatedPrice;
    } else if ($goldType === 'refined') {
        if ($overallVolume > 0) {
            $density = $overallGrams / $overallVolume;
            // Prevent division by zero or invalid negative karat
            $karat = 0;
            if ($density > 0) {
                $karat = (($density - 10.51) * 52.838) / $density;
            }
            $pounds = $overallGrams / 7.75;
            $estimatedCash = ($karat * $estimatedPrice / 23) * $pounds;
        }
    }

    $saleUid = 'SALE-' . strtoupper(uniqid());

    // 2. Insert into market_sales as pending
    $insertSaleStmt = $pdo->prepare("
        INSERT INTO market_sales 
        (sale_uid, gold_type, total_grams, total_volume, total_blades, estimated_local_price, estimated_cash, status, notes, handler_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    ");
    $insertSaleStmt->execute([
        $saleUid, 
        $goldType, 
        $overallGrams, 
        $overallVolume, 
        $overallBlades, 
        $estimatedPrice,
        $estimatedCash, 
        $data['notes'] ?? '',
        $current_user_id ?? null
    ]);
    $marketSaleId = $pdo->lastInsertId();

    // 3. Update gold_vault records to tie them to this sale and remove from office_vault
    $updateStmt = $pdo->prepare("
        UPDATE gold_vault 
        SET current_location = 'sold_main_market', sale_id = ? 
        WHERE ownership_status = 'company_owned' 
        AND current_location = 'office_vault'
        AND gold_type = ?
    ");
    $updateStmt->execute([$marketSaleId, $goldType]);

    log_activity($pdo, $current_user_id ?? null, 'INITIATE_SALE', 'market_sales', $marketSaleId, null, ['gold_type' => $goldType, 'estimated_cash' => $estimatedCash]);

    $pdo->commit();

    sendResponse('success', 'Market sale initiated successfully', [
        'sale_id' => $marketSaleId,
        'estimated_cash' => $estimatedCash
    ], 200);

} catch (\Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    sendResponse('error', 'Failed to initiate market sale: ' . $e->getMessage(), [], 500);
}
