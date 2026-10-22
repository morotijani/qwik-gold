<?php
// api/vault/convert_balls.php

require_once '../../config/headers.php';
require_once '../../config/database.php';
require_once '../middleware/auth.php';
require_once '../helpers/logger.php';
require_once '../helpers/settings.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse('error', 'Method not allowed', [], 405);
}

$jsonInput = file_get_contents('php://input');
$data = json_decode($jsonInput, true);

if (!$data) {
    sendResponse('error', 'Invalid JSON input', [], 400);
}

// Support both naming schemes: balls_grams / balls_grams_used, refined_grams / refined_grams_produced
$ballsGrams = isset($data['balls_grams']) ? (float)$data['balls_grams'] : (isset($data['balls_grams_used']) ? (float)$data['balls_grams_used'] : 0.0);
$refinedGrams = isset($data['refined_grams']) ? (float)$data['refined_grams'] : (isset($data['refined_grams_produced']) ? (float)$data['refined_grams_produced'] : 0.0);
$refinedVolume = isset($data['refined_volume']) ? (float)$data['refined_volume'] : 0.0;
$ballsBlades = isset($data['balls_blades']) ? (float)$data['balls_blades'] : (isset($data['total_blades']) ? (float)$data['total_blades'] : 0.0);

$customerId = isset($data['customer_id']) && (int)$data['customer_id'] > 0 ? (int)$data['customer_id'] : null;
$ownershipStatus = isset($data['ownership_status']) && $data['ownership_status'] === 'keeper_held' 
    ? 'keeper_held' 
    : ($customerId ? 'keeper_held' : 'company_owned');

$sourceLocation = isset($data['source_location']) && $data['source_location'] === 'on_hold' ? 'on_hold' : 'office_vault';

// Basic sanity checks
if ($ballsGrams <= 0) {
    sendResponse('error', 'Missing or invalid required field: balls_grams', [], 400);
}
if ($refinedGrams <= 0) {
    sendResponse('error', 'Missing or invalid required field: refined_grams', [], 400);
}
if ($refinedVolume <= 0) {
    sendResponse('error', 'Missing or invalid required field: refined_volume', [], 400);
}

try {
    $pdo->beginTransaction();

    // =========================================================================
    // CASE 1: KEEPER-HELD GOLD BALLS (Safe-Keep Smelting / Conversion)
    // =========================================================================
    if ($ownershipStatus === 'keeper_held') {
        if (!$customerId) {
            sendResponse('error', 'Customer ID is required for keeper gold conversion', [], 400);
        }

        // Verify customer exists
        $custStmt = $pdo->prepare("SELECT id, name FROM customers WHERE id = ?");
        $custStmt->execute([$customerId]);
        $customer = $custStmt->fetch();
        if (!$customer) {
            sendResponse('error', 'Customer not found', [], 404);
        }

        // Check active collateral locked on loans
        $collateralStmt = $pdo->prepare("
            SELECT SUM(collateral_weight) as total_collateral 
            FROM loans 
            WHERE customer_id = ? AND collateral_gold_type = 'balls' AND status = 'active'
        ");
        $collateralStmt->execute([$customerId]);
        $activeCollateral = (float)($collateralStmt->fetchColumn() ?: 0.0);

        // Check total available safe keep balls in current location
        $totalKeeperStmt = $pdo->prepare("
            SELECT SUM(weight_grams) as total_balls, SUM(total_blades) as total_blades 
            FROM gold_vault 
            WHERE customer_id = ? AND gold_type = 'balls' AND ownership_status = 'keeper_held' AND current_location = ?
        ");
        $totalKeeperStmt->execute([$customerId, $sourceLocation]);
        $keeperTotals = $totalKeeperStmt->fetch();
        $totalBalls = $keeperTotals ? (float)$keeperTotals['total_balls'] : 0.0;

        $availableSafeKeep = max(0, $totalBalls - $activeCollateral);
        if ($ballsGrams > $availableSafeKeep + 0.0001) {
            throw new Exception("Insufficient Safe Keep balls balance. Requested: {$ballsGrams}g, Available: {$availableSafeKeep}g (locked collateral: {$activeCollateral}g).");
        }

        // Fetch keeper's balls records in FIFO order and lock
        $stmt = $pdo->prepare("
            SELECT id, weight_grams, total_blades 
            FROM gold_vault 
            WHERE customer_id = ? AND gold_type = 'balls' AND ownership_status = 'keeper_held' AND current_location = ? 
            ORDER BY id ASC FOR UPDATE
        ");
        $stmt->execute([$customerId, $sourceLocation]);
        $vaultRecords = $stmt->fetchAll();

        $remainingToConvert = $ballsGrams;
        $firstParentBallId = null;

        foreach ($vaultRecords as $row) {
            if ($remainingToConvert <= 0.0001) break;

            $recordId = (int)$row['id'];
            $recordGrams = (float)$row['weight_grams'];
            $recordBlades = (float)($row['total_blades'] ?? 0.0);

            if (!$firstParentBallId) {
                $firstParentBallId = $recordId;
            }

            if ($recordGrams <= $remainingToConvert + 0.0001) {
                // Entire record converted
                $updateStmt = $pdo->prepare("UPDATE gold_vault SET current_location = 'converted' WHERE id = ?");
                $updateStmt->execute([$recordId]);
                $remainingToConvert -= $recordGrams;
            } else {
                // Partial conversion: deduct from this record
                $newKeeperGrams = $recordGrams - $remainingToConvert;
                $newBlades = $recordBlades > 0 ? max(0, $recordBlades - ($remainingToConvert / $recordGrams) * $recordBlades) : null;
                $updateStmt = $pdo->prepare("UPDATE gold_vault SET weight_grams = ?, total_blades = ? WHERE id = ?");
                $updateStmt->execute([$newKeeperGrams, $newBlades, $recordId]);
                $remainingToConvert = 0;
                break;
            }
        }

        if ($remainingToConvert > 0.0001) {
            throw new Exception("Insufficient keeper balls balance in vault.");
        }

        // Create new refined record for the keeper
        $insertRefinedStmt = $pdo->prepare("
            INSERT INTO gold_vault 
            (gold_type, ownership_status, weight_grams, volume, current_location, customer_id, parent_ball_id) 
            VALUES ('refined', 'keeper_held', ?, ?, 'office_vault', ?, ?)
        ");
        $insertRefinedStmt->execute([
            $refinedGrams,
            $refinedVolume,
            $customerId,
            $firstParentBallId
        ]);
        $newVaultId = $pdo->lastInsertId();

        // Log activity for Keeper audit & activity history (matches api/keepers/history.php structure)
        log_activity(
            $pdo, 
            $current_user_id ?? 1, 
            'CONVERT_BALLS', 
            'gold_vault', 
            $newVaultId, 
            ['balls_grams' => $ballsGrams], 
            [
                'balls_used' => $ballsGrams,
                'refined_produced' => $refinedGrams,
                'volume' => $refinedVolume,
                'customer_id' => $customerId
            ]
        );

        $pdo->commit();

        sendResponse('success', 'Customer Gold Balls successfully converted to Refined Gold', [
            'vault_id' => $newVaultId,
            'customer_id' => $customerId,
            'balls_used' => $ballsGrams,
            'refined_produced' => $refinedGrams,
            'volume' => $refinedVolume
        ], 200);
    }

    // =========================================================================
    // CASE 2: COMPANY-OWNED GOLD BALLS (Smelting & Conversion to Refined Vault)
    // =========================================================================
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

    $overallGrams = (float)($item['total_grams'] ?? 0);
    $overallBlades = (float)($item['total_blades'] ?? 0);
    $totalCostBasis = (float)($item['total_cost_basis'] ?? 0);

    if ($overallGrams <= 0 && $overallBlades <= 0) {
        throw new Exception("No company_owned balls found in the $sourceLocation to convert.");
    }
    
    // Override with user-provided estimates if present
    if ($ballsGrams > 0) $overallGrams = $ballsGrams;
    if ($ballsBlades > 0) {
        $overallBlades = $ballsBlades;
    } elseif ($overallGrams > 0 && $overallBlades <= 0) {
        $overallBlades = $overallGrams / 0.8;
    }

    $localPrice = isset($data['local_price']) ? (float)$data['local_price'] : 0.0;
    if ($localPrice <= 0) {
        $localPrice = (float)get_system_setting($pdo, 'goldbod_price', 0.0);
    }
    if ($localPrice <= 0) {
        throw new Exception("Market local price is required for company gold conversion.");
    }

    // Calculate refined cash value
    $discountPercent = (float)get_system_setting($pdo, 'purity_discount_percent', 0.70);
    $discountFactor = (100 - $discountPercent) / 100;

    $density = floor(($refinedGrams / $refinedVolume) * 100) / 100;
    $rawKarat = 0;
    if ($density > 0) {
        $rawKarat = floor(((($density - 10.51) * 52.838) / $density) * 100) / 100;
    }
    $karat = $rawKarat > 0 ? floor(($rawKarat * $discountFactor) * 100) / 100 : 0;
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
        $estimatedCash,
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
        $totalCostBasis
    ]);

    // 5. Log activity
    log_activity(
        $pdo, 
        $current_user_id ?? 1, 
        'CONVERT_BALLS', 
        'market_sales', 
        $marketSaleId, 
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
