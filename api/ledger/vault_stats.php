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

    // 2. Gold Vault Stats (company owned, active vs hold)
    $vaultStmt = $pdo->query("
        SELECT 
            current_location,
            gold_type,
            SUM(weight_grams) as grams,
            SUM(volume) as volume,
            SUM(total_blades) as blades
        FROM gold_vault
        WHERE ownership_status = 'company_owned' 
        AND current_location IN ('office_vault', 'on_hold')
        GROUP BY current_location, gold_type
    ");
    $vaultStats = $vaultStmt->fetchAll();

    $statsTemplate = [
        'gold_balls' => ['grams' => 0.0, 'blades' => 0.0],
        'refined_gold' => ['grams' => 0.0, 'volume' => 0.0]
    ];
    
    $active = $statsTemplate;
    $hold = $statsTemplate;

    foreach ($vaultStats as $stat) {
        $loc = $stat['current_location'];
        if ($stat['gold_type'] === 'balls') {
            if ($loc === 'office_vault') {
                $active['gold_balls']['grams'] = (float)$stat['grams'];
                $active['gold_balls']['blades'] = (float)$stat['blades'];
            } else {
                $hold['gold_balls']['grams'] = (float)$stat['grams'];
                $hold['gold_balls']['blades'] = (float)$stat['blades'];
            }
        } elseif ($stat['gold_type'] === 'refined') {
            if ($loc === 'office_vault') {
                $active['refined_gold']['grams'] = (float)$stat['grams'];
                $active['refined_gold']['volume'] = (float)$stat['volume'];
            } else {
                $hold['refined_gold']['grams'] = (float)$stat['grams'];
                $hold['refined_gold']['volume'] = (float)$stat['volume'];
            }
        }
    }

    sendResponse('success', 'Vault stats retrieved', [
        'total_capital_ghs' => round($totalCapital, 2),
        'gold_balls' => [
            'grams' => round($active['gold_balls']['grams'], 4),
            'total_balls_blades' => round($active['gold_balls']['blades'], 4)
        ],
        'refined_gold' => [
            'grams' => round($active['refined_gold']['grams'], 4),
            'volume' => round($active['refined_gold']['volume'], 4)
        ],
        'hold_gold_balls' => [
            'grams' => round($hold['gold_balls']['grams'], 4),
            'total_balls_blades' => round($hold['gold_balls']['blades'], 4)
        ],
        'hold_refined_gold' => [
            'grams' => round($hold['refined_gold']['grams'], 4),
            'volume' => round($hold['refined_gold']['volume'], 4)
        ]
    ], 200);

} catch (\PDOException $e) {
    error_log("System Error: " . $e->getMessage());
    sendResponse('error', 'A system error occurred while processing your request.', [], 500);
}
