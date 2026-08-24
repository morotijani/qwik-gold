<?php
// api/ledger/sold_gold_details.php

require_once '../../config/headers.php';
require_once '../../config/database.php';
require_once '../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse('error', 'Method not allowed', [], 405);
}

if (!isset($_GET['sale_id'])) {
    sendResponse('error', 'Missing sale_id', [], 400);
}

$saleId = (int)$_GET['sale_id'];

try {
    // 1. Get the sale record
    $stmt = $pdo->prepare("SELECT * FROM market_sales WHERE id = ?");
    $stmt->execute([$saleId]);
    $sale = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$sale) {
        sendResponse('error', 'Sale not found', [], 404);
    }

    // 2. Get the constituent gold vault records
    $vaultStmt = $pdo->prepare("SELECT * FROM gold_vault WHERE sale_id = ?");
    $vaultStmt->execute([$saleId]);
    $constituents = $vaultStmt->fetchAll(PDO::FETCH_ASSOC);

    $smeltedCount = 0;
    $smeltedGrams = 0;
    $purchasedCount = 0;
    $purchasedGrams = 0;

    foreach ($constituents as $item) {
        if ($sale['gold_type'] === 'refined' && !empty($item['parent_ball_id'])) {
            $smeltedCount++;
            $smeltedGrams += (float)$item['weight_grams'];
        } else {
            $purchasedCount++;
            $purchasedGrams += (float)$item['weight_grams'];
        }
    }

    sendResponse('success', 'Sale details retrieved', [
        'sale' => $sale,
        'constituents' => [
            'smelted' => [
                'count' => $smeltedCount,
                'grams' => $smeltedGrams
            ],
            'direct_purchased' => [
                'count' => $purchasedCount,
                'grams' => $purchasedGrams
            ],
            'total_items' => count($constituents)
        ]
    ], 200);

} catch (\PDOException $e) {
    error_log("System Error: " . $e->getMessage());
    sendResponse('error', 'A system error occurred while processing your request.', [], 500);
}
