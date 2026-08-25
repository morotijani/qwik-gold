<?php
require_once 'config/database.php';
$stmt = $pdo->query('SELECT id FROM market_sales WHERE is_merged = 1 ORDER BY id DESC LIMIT 1');
$id = $stmt->fetchColumn();

// Include the logic of sold_gold_details.php manually
$stmt = $pdo->prepare("SELECT * FROM market_sales WHERE id = ?");
$stmt->execute([$id]);
$sale = $stmt->fetch(PDO::FETCH_ASSOC);

$vaultStmt = $pdo->prepare("SELECT * FROM gold_vault WHERE sale_id = ?");
$vaultStmt->execute([$id]);
$constituents = $vaultStmt->fetchAll(PDO::FETCH_ASSOC);

$smeltedCount = 0; $smeltedGrams = 0; $purchasedCount = 0; $purchasedGrams = 0;
foreach ($constituents as $item) {
    if ($sale['gold_type'] === 'refined' && !empty($item['parent_ball_id'])) {
        $smeltedCount++;
        $smeltedGrams += (float)$item['weight_grams'];
    } else {
        $purchasedCount++;
        $purchasedGrams += (float)$item['weight_grams'];
    }
}

$mergedSales = [];
if (!empty($sale['is_merged'])) {
    $mergeStmt = $pdo->prepare("SELECT * FROM market_sales WHERE merged_into_id = ?");
    $mergeStmt->execute([$id]);
    $mergedSales = $mergeStmt->fetchAll(PDO::FETCH_ASSOC);
}

echo json_encode([
    'sale' => $sale,
    'merged_sales' => $mergedSales,
    'constituents' => [
        'smelted' => ['count' => $smeltedCount, 'grams' => $smeltedGrams],
        'direct_purchased' => ['count' => $purchasedCount, 'grams' => $purchasedGrams],
        'total_items' => count($constituents)
    ]
], JSON_PRETTY_PRINT);
