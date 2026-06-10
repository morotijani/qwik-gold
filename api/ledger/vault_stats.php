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

    // 2. Gold Vault Stats (company owned, in office)
    $vaultStmt = $pdo->query("
        SELECT 
            gold_type,
            SUM(weight_grams) as grams,
            SUM(volume) as volume,
            SUM(total_blades) as blades
        FROM gold_vault
        WHERE ownership_status = 'company_owned' 
        AND current_location = 'office_vault'
        GROUP BY gold_type
    ");
    $vaultStats = $vaultStmt->fetchAll();

    $balls = [
        'grams' => 0.0,
        'blades' => 0.0
    ];
    $refined = [
        'grams' => 0.0,
        'volume' => 0.0
    ];

    foreach ($vaultStats as $stat) {
        if ($stat['gold_type'] === 'balls') {
            $balls['grams'] = (float)$stat['grams'];
            $balls['blades'] = (float)$stat['blades'];
        } elseif ($stat['gold_type'] === 'refined') {
            $refined['grams'] = (float)$stat['grams'];
            $refined['volume'] = (float)$stat['volume'];
        }
    }

    sendResponse('success', 'Vault stats retrieved', [
        'total_capital_ghs' => round($totalCapital, 2),
        'gold_balls' => [
            'grams' => round($balls['grams'], 4),
            'total_balls_blades' => round($balls['blades'], 4)
        ],
        'refined_gold' => [
            'grams' => round($refined['grams'], 4),
            'volume' => round($refined['volume'], 4)
        ]
    ], 200);

} catch (\PDOException $e) {
    error_log("System Error: " . $e->getMessage());
    sendResponse('error', 'A system error occurred while processing your request.', [], 500);
}
