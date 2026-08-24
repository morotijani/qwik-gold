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

if (!isset($data['ownership_status'])) {
    sendResponse('error', 'Missing ownership information', [], 400);
}
if (!isset($data['balls_grams_used']) || !isset($data['refined_grams_produced']) || !isset($data['refined_volume'])) {
    sendResponse('error', 'Missing conversion metrics', [], 400);
}

$ownershipStatus = $data['ownership_status']; // 'company_owned' or 'keeper_held'
$customerId = isset($data['customer_id']) && $data['customer_id'] !== '' && $data['customer_id'] !== null ? (int)$data['customer_id'] : null;
$sourceLocation = isset($data['source_location']) && $data['source_location'] === 'on_hold' ? 'on_hold' : 'office_vault';

$ballsGramsUsed = (float)$data['balls_grams_used'];
$refinedGrams = (float)$data['refined_grams_produced'];
$refinedVolume = (float)$data['refined_volume'];

if ($ballsGramsUsed <= 0 || $refinedGrams <= 0 || $refinedVolume <= 0) {
    sendResponse('error', 'Metrics must be greater than zero', [], 400);
}

try {
    $pdo->beginTransaction();

    // 1. Fetch available balls for this owner
    if ($ownershipStatus === 'company_owned') {
        $stmt = $pdo->prepare("SELECT id, weight_grams, cost_basis_ghs, guessed_value_ghs FROM gold_vault WHERE ownership_status = 'company_owned' AND gold_type = 'balls' AND current_location = ? ORDER BY id ASC FOR UPDATE");
        $stmt->execute([$sourceLocation]);
    } else {
        $stmt = $pdo->prepare("SELECT id, weight_grams, cost_basis_ghs, guessed_value_ghs FROM gold_vault WHERE ownership_status = 'keeper_held' AND customer_id = ? AND gold_type = 'balls' AND current_location = 'office_vault' ORDER BY id ASC FOR UPDATE");
        $stmt->execute([$customerId]);
    }
    
    $balls = $stmt->fetchAll();

    $totalAvailable = 0;
    foreach ($balls as $ball) {
        $totalAvailable += (float)$ball['weight_grams'];
    }

    // Fix floating point precision issues by rounding to 4 decimal places
    $totalAvailableRounded = round($totalAvailable, 4);
    $ballsGramsUsedRounded = round($ballsGramsUsed, 4);

    if ($totalAvailableRounded < $ballsGramsUsedRounded) {
        throw new \Exception("Insufficient gold balls available. Requested: {$ballsGramsUsed}g, Available: {$totalAvailable}g");
    }

    // 2. Deduct from oldest balls first
    $remainingToConvert = $ballsGramsUsedRounded;
    $lastBallId = null; 
    
    $totalCostBasisUsed = 0.0;
    $totalGuessedValueUsed = 0.0;

    foreach ($balls as $ball) {
        if ($remainingToConvert <= 0) break;

        $ballId = $ball['id'];
        $lastBallId = $ballId;
        $ballWeight = round((float)$ball['weight_grams'], 4);
        $ballCostBasis = (float)($ball['cost_basis_ghs'] ?? 0);
        $ballGuessedValue = (float)($ball['guessed_value_ghs'] ?? 0);

        if ($ballWeight <= $remainingToConvert) {
            // Entire ball is converted
            $totalCostBasisUsed += $ballCostBasis;
            $totalGuessedValueUsed += $ballGuessedValue;

            $upd = $pdo->prepare("UPDATE gold_vault SET current_location = 'converted' WHERE id = ?");
            $upd->execute([$ballId]);
            $remainingToConvert = round($remainingToConvert - $ballWeight, 4);
        } else {
            // Partial conversion: reduce weight of existing ball
            $fraction = $remainingToConvert / $ballWeight;
            $costUsed = $ballCostBasis * $fraction;
            $guessedUsed = $ballGuessedValue * $fraction;

            $totalCostBasisUsed += $costUsed;
            $totalGuessedValueUsed += $guessedUsed;

            $newWeight = round($ballWeight - $remainingToConvert, 4);
            $newCost = $ballCostBasis - $costUsed;
            $newGuessed = $ballGuessedValue - $guessedUsed;

            $upd = $pdo->prepare("UPDATE gold_vault SET weight_grams = ?, cost_basis_ghs = ?, guessed_value_ghs = ? WHERE id = ?");
            $upd->execute([$newWeight, $newCost, $newGuessed, $ballId]);

            // Create a historical "converted" record for the portion we used
            $ins = $pdo->prepare("INSERT INTO gold_vault (gold_type, ownership_status, weight_grams, current_location, customer_id, cost_basis_ghs, guessed_value_ghs) VALUES ('balls', ?, ?, 'converted', ?, ?, ?)");
            $ins->execute([$ownershipStatus, $remainingToConvert, $customerId, $costUsed, $guessedUsed]);
            $lastBallId = $pdo->lastInsertId();

            $remainingToConvert = 0;
        }
    }

    // 3. Create Refined Gold Record
    $insRefined = $pdo->prepare("INSERT INTO gold_vault (gold_type, ownership_status, weight_grams, volume, current_location, customer_id, parent_ball_id, cost_basis_ghs, guessed_value_ghs) VALUES ('refined', ?, ?, ?, ?, ?, ?, ?, ?)");
    $insRefined->execute([$ownershipStatus, $refinedGrams, $refinedVolume, $sourceLocation, $customerId, $lastBallId, $totalCostBasisUsed, $totalGuessedValueUsed]);
    $newRefinedId = $pdo->lastInsertId();
    
    // 4. Update Collateral on Loan (if applicable)
    if ($ownershipStatus === 'keeper_held' && $customerId) {
        $loanStmt = $pdo->prepare("SELECT id, collateral_gold_type, collateral_weight FROM loans WHERE customer_id = ? AND status = 'active' AND type = 'collateral' AND collateral_gold_type = 'balls' FOR UPDATE");
        $loanStmt->execute([$customerId]);
        $loan = $loanStmt->fetch();
        
        if ($loan) {
            $currentCollateralWeight = (float)$loan['collateral_weight'];
            if ($ballsGramsUsed >= $currentCollateralWeight) {
                // Completely converted
                $updLoan = $pdo->prepare("UPDATE loans SET collateral_gold_type = 'refined', collateral_weight = ?, collateral_volume = ? WHERE id = ?");
                $updLoan->execute([$refinedGrams, $refinedVolume, $loan['id']]);
            } else {
                // Partially converted
                $newColWeight = $currentCollateralWeight - $ballsGramsUsed;
                $updLoan = $pdo->prepare("UPDATE loans SET collateral_weight = ?, notes = CONCAT(COALESCE(notes, ''), '\\n[Partially converted ', ?, 'g to Refined]') WHERE id = ?");
                $updLoan->execute([$newColWeight, $ballsGramsUsed, $loan['id']]);
            }
        }
    }

    log_activity($pdo, $current_user_id ?? null, 'CONVERT_BALLS', 'gold_vault', $newRefinedId, null, [
        'balls_used' => $ballsGramsUsed,
        'refined_produced' => $refinedGrams,
        'volume' => $refinedVolume
    ]);

    $pdo->commit();
    sendResponse('success', 'Gold successfully converted to Refined', [], 200);

} catch (\Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Conversion Error: " . $e->getMessage());
    sendResponse('error', $e->getMessage(), [], 400);
}
