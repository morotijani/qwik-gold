<?php
// api/ledger/vault_stats.php

require_once '../../config/headers.php';
require_once '../../config/database.php';
require_once '../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse('error', 'Method not allowed', [], 405);
}

try {
    // 1. Total Capital
    $capStmt = $pdo->query("SELECT SUM(amount_ghs) as total_capital FROM capital_ledger");
    $capResult = $capStmt->fetch();
    $totalCapital = $capResult['total_capital'] !== null ? (float)$capResult['total_capital'] : 0.0;

    // Fetch current local price for live valuation (use most recent purchase price as estimate)
    $priceStmt = $pdo->query("SELECT local_price FROM gold_purchases WHERE local_price > 0 ORDER BY created_at DESC LIMIT 1");
    $priceRow = $priceStmt->fetch();
    $currentPrice = $priceRow ? (float)$priceRow['local_price'] : 0.0;

    // 2. Gold Vault Stats (company owned, active vs hold)
    $vaultStmt = $pdo->query("
        SELECT 
            current_location,
            gold_type,
            SUM(weight_grams) as grams,
            SUM(volume) as volume,
            SUM(total_blades) as blades,
            SUM(guessed_value_ghs) as guessed_value
        FROM gold_vault
        WHERE ownership_status = 'company_owned' 
        AND current_location IN ('office_vault', 'on_hold')
        GROUP BY current_location, gold_type
    ");
    $vaultStats = $vaultStmt->fetchAll();

    $statsTemplate = [
        'gold_balls' => ['grams' => 0.0, 'blades' => 0.0, 'guessed_value' => 0.0],
        'refined_gold' => ['grams' => 0.0, 'volume' => 0.0, 'guessed_value' => 0.0]
    ];
    
    $active = $statsTemplate;
    $hold = $statsTemplate;

    foreach ($vaultStats as $stat) {
        $loc = $stat['current_location'];
        if ($stat['gold_type'] === 'balls') {
            if ($loc === 'office_vault') {
                $active['gold_balls']['grams'] = (float)$stat['grams'];
                $active['gold_balls']['blades'] = (float)$stat['blades'];
                $active['gold_balls']['guessed_value'] = (float)$stat['guessed_value'];
            } else {
                $hold['gold_balls']['grams'] = (float)$stat['grams'];
                $hold['gold_balls']['blades'] = (float)$stat['blades'];
                $hold['gold_balls']['guessed_value'] = (float)$stat['guessed_value'];
            }
        } elseif ($stat['gold_type'] === 'refined') {
            if ($loc === 'office_vault') {
                $active['refined_gold']['grams'] = (float)$stat['grams'];
                $active['refined_gold']['volume'] = (float)$stat['volume'];
                $active['refined_gold']['guessed_value'] = (float)$stat['guessed_value'];
            } else {
                $hold['refined_gold']['grams'] = (float)$stat['grams'];
                $hold['refined_gold']['volume'] = (float)$stat['volume'];
                $hold['refined_gold']['guessed_value'] = (float)$stat['guessed_value'];
            }
        }
    }

    sendResponse('success', 'Vault stats retrieved', [
        'total_capital_ghs' => round($totalCapital, 2),
        'current_local_price_ghs' => round($currentPrice, 2),
        'gold_balls' => [
            'grams' => round($active['gold_balls']['grams'], 4),
            'total_balls_blades' => round($active['gold_balls']['blades'], 4),
            'guessed_value' => round($active['gold_balls']['guessed_value'], 2)
        ],
        'refined_gold' => [
            'grams' => round($active['refined_gold']['grams'], 4),
            'volume' => round($active['refined_gold']['volume'], 4),
            'guessed_value' => round($active['refined_gold']['guessed_value'], 2)
        ],
        'hold_gold_balls' => [
            'grams' => round($hold['gold_balls']['grams'], 4),
            'total_balls_blades' => round($hold['gold_balls']['blades'], 4),
            'guessed_value' => round($hold['gold_balls']['guessed_value'], 2)
        ],
        'hold_refined_gold' => [
            'grams' => round($hold['refined_gold']['grams'], 4),
            'volume' => round($hold['refined_gold']['volume'], 4),
            'guessed_value' => round($hold['refined_gold']['guessed_value'], 2)
        ]
    ], 200);

} catch (\PDOException $e) {
    error_log("System Error: " . $e->getMessage());
    sendResponse('error', 'A system error occurred while processing your request.', [], 500);
}
