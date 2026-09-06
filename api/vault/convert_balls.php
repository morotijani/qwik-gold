<?php
// api/vault/convert_balls.php

require_once '../../config/headers.php';
require_once '../../config/database.php';
require_once '../middleware/auth.php';
require_once '../helpers/logger.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse('error', 'Method not allowed', [], 405);
}

$jsonInput = file_get_contents('php://input');
$data = json_decode($jsonInput, true);

// Validate inputs
$requiredFields = ['balls_grams', 'balls_blades', 'refined_grams', 'refined_volume', 'local_price'];
foreach ($requiredFields as $field) {
    if (!isset($data[$field])) {
        sendResponse('error', "Missing required field: $field", [], 400);
    }
}

$ballsGrams = (float)$data['balls_grams'];
$ballsBlades = (float)$data['balls_blades'];
$refinedGrams = (float)$data['refined_grams'];
$refinedVolume = (float)$data['refined_volume'];
$localPrice = (float)$data['local_price'];
$sourceLocation = isset($data['source_location']) && $data['source_location'] === 'on_hold' ? 'on_hold' : 'office_vault';

if ($refinedGrams <= 0 || $refinedVolume <= 0 || $localPrice <= 0) {
    sendResponse('error', 'Values must be greater than zero', [], 400);
}

try {
    $pdo->beginTransaction();

    // 1. Fetch all company_owned balls in the chosen location
    $sumStmt = $pdo->prepare("
        SELECT 
            SUM(weight_grams) as total_grams,
            SUM(total_blades) as total_blades,
            SUM(guessed_value_ghs) as total_cost_basis
        FROM gold_vault 
        WHERE ownership_status = 'company_owned' 
        AND current_location = ? 
        AND gold_type = 'balls'
        FOR UPDATE
    ");
    $sumStmt->execute([$sourceLocation]);
    $item = $sumStmt->fetch();

    $overallGrams = (float)$item['total_grams'];
    $overallBlades = (float)$item['total_blades'];
    $totalCostBasis = (float)$item['total_cost_basis'];

    if ($overallGrams <= 0 && $overallBlades <= 0) {
        throw new Exception("No company_owned balls found in the $sourceLocation to convert.");
    }
    
    // Override with user-provided estimates if present
    if ($ballsGrams > 0) $overallGrams = $ballsGrams;
    if ($ballsBlades > 0) $overallBlades = $ballsBlades;

    // Calculate refined cash value
    $density = floor(($refinedGrams / $refinedVolume) * 100) / 100;
    $karat = 0;
    if ($density > 0) {
        $karat = floor(((($density - 10.51) * 52.838) / $density) * 100) / 100;
    }
    $pounds = floor(($refinedGrams / 7.75) * 100) / 100;
    $estimatedCash = floor(($karat * $localPrice / 23) * $pounds);
    
    $netProfit = $estimatedCash - $totalCostBasis;
    $saleUid = 'CNV-' . strtoupper(uniqid());

    // 2. Insert into market_sales as completed conversion
    $insertSaleStmt = $pdo->prepare("
        INSERT INTO market_sales 
        (sale_uid, gold_type, total_grams, total_blades, actual_grams_market, actual_volume_market, actual_local_price, actual_cash, estimated_cash, net_profit_ghs, status, notes, handler_id, is_merged) 
        VALUES (?, 'balls', ?, ?, ?, ?, ?, ?, ?, ?, 'completed', 'Converted to Refined Gold', ?, 1)
    ");
    $insertSaleStmt->execute([
        $saleUid, 
        $overallGrams, 
        $overallBlades, 
        $refinedGrams,
        $refinedVolume,
        $localPrice,
        $estimatedCash, // Using actual_cash to store cash value, even though no physical cash is moving
        $estimatedCash, 
        $netProfit,
        $current_user_id ?? 1
    ]);
    $marketSaleId = $pdo->lastInsertId();

    // 3. Update old balls records in gold_vault to 'converted'
    $updateStmt = $pdo->prepare("
        UPDATE gold_vault 
        SET current_location = 'converted', sale_id = ? 
        WHERE ownership_status = 'company_owned' 
        AND current_location = ?
        AND gold_type = 'balls'
    ");
    $updateStmt->execute([$marketSaleId, $sourceLocation]);

    // 4. Create new refined gold record in gold_vault with carried over cost basis
    $insertRefinedStmt = $pdo->prepare("
        INSERT INTO gold_vault 
        (gold_type, ownership_status, weight_grams, volume, current_location, guessed_value_ghs) 
        VALUES ('refined', 'company_owned', ?, ?, 'office_vault', ?)
    ");
    $insertRefinedStmt->execute([
        $refinedGrams,
        $refinedVolume,
        $totalCostBasis // Transfer the cost basis so it's not double-counted later
    ]);

    // 5. Log activity
    log_activity($pdo, $current_user_id ?? 1, 'CONVERT_BALLS', 'market_sales', $marketSaleId, 
        ['grams' => $overallGrams, 'blades' => $overallBlades], 
        ['new_refined_grams' => $refinedGrams, 'new_refined_volume' => $refinedVolume]
    );

    $pdo->commit();

    sendResponse('success', 'Gold Balls successfully converted to Refined Gold', [
        'sale_id' => $marketSaleId,
        'estimated_cash' => $estimatedCash
    ], 200);

} catch (\Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("System Error (Convert Balls): " . $e->getMessage());
    sendResponse('error', $e->getMessage(), [], 500);
}
