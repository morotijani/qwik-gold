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
    
    $totalCost = 0.0;
    foreach ($constituents as $item) {
        $totalCost += (float)$item['guessed_value_ghs'];
    }
    $sale['total_cost'] = $totalCost;

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

    // 3. If merged, fetch the original sales
    $mergedSales = [];
    if (!empty($sale['is_merged'])) {
        $mergeStmt = $pdo->prepare("SELECT * FROM market_sales WHERE merged_into_id = ?");
        $mergeStmt->execute([$saleId]);
        $mergedSales = $mergeStmt->fetchAll(PDO::FETCH_ASSOC);
        
        $mergedTotalCost = 0.0;
        foreach ($mergedSales as &$ms) {
            $msCostStmt = $pdo->prepare("SELECT SUM(guessed_value_ghs) FROM gold_vault WHERE sale_id = ?");
            $msCostStmt->execute([$ms['id']]);
            $ms['total_cost'] = (float)$msCostStmt->fetchColumn();
            $mergedTotalCost += $ms['total_cost'];
        }
        
        // If it's a merged sale and vault items were migrated to the master sale (legacy behavior), 
        // the sub-sales will have 0 direct cost. In this case, prorate the master sale's total cost.
        if ($mergedTotalCost == 0 && $totalCost > 0) {
            foreach ($mergedSales as &$ms) {
                if ($sale['total_grams'] > 0) {
                    $ms['total_cost'] = $totalCost * ($ms['total_grams'] / $sale['total_grams']);
                }
                $mergedTotalCost += $ms['total_cost'];
            }
        }
        
        // Ensure the master sale's total cost is accurate
        $sale['total_cost'] = max($totalCost, $mergedTotalCost);
    }

    sendResponse('success', 'Sale details retrieved', [
        'sale' => $sale,
        'merged_sales' => $mergedSales,
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
