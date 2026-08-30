<?php
// api/sales/merge_complete_sale.php

require_once '../../config/headers.php';
require_once '../../config/database.php';
require_once '../middleware/auth.php';
require_once '../helpers/logger.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse('error', 'Method not allowed', [], 405);
}

$jsonInput = file_get_contents('php://input');
$data = json_decode($jsonInput, true);

if (!isset($data['sale_ids']) || !is_array($data['sale_ids']) || count($data['sale_ids']) < 2) {
    sendResponse('error', 'Must select at least two sales to merge.', [], 400);
}

$saleIds = array_map('intval', $data['sale_ids']);
$actualPrice = (float)$data['actual_local_price'];
$actualGrams = (float)$data['actual_grams'];
$actualVolume = (float)$data['actual_volume'];

if ($actualPrice <= 0 || $actualGrams <= 0 || $actualVolume <= 0) {
    sendResponse('error', 'Actual fields must be greater than zero.', [], 400);
}

try {
    $pdo->beginTransaction();

    // 1. Fetch and lock the pending sales
    $inClause = implode(',', array_fill(0, count($saleIds), '?'));
    $stmt = $pdo->prepare("SELECT * FROM market_sales WHERE id IN ($inClause) AND status = 'pending' AND merged_into_id IS NULL FOR UPDATE");
    $stmt->execute($saleIds);
    $sales = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (count($sales) !== count($saleIds)) {
        throw new Exception("One or more selected sales could not be found or are not pending.");
    }

    $sumStmt = $pdo->prepare("SELECT SUM(guessed_value_ghs) FROM gold_vault WHERE sale_id IN ($inClause)");
    $sumStmt->execute($saleIds);
    $totalCostBasis = (float)$sumStmt->fetchColumn();

    $totalOriginalGrams = 0.0;
    $totalEstCash = 0.0;

    foreach ($sales as $sale) {
        $totalOriginalGrams += (float)$sale['total_grams'];
        $totalEstCash += (float)$sale['estimated_cash'];
    }

    // 2. Calculate actuals using Refined Gold math
    $density = $actualGrams / $actualVolume;
    $karat = 0;
    if ($density > 0) {
        $karat = (($density - 10.51) * 52.838) / $density;
    }
    $pounds = $actualGrams / 7.75;
    $actualCash = ($karat * $actualPrice / 23) * $pounds;
    
    $netProfit = $actualCash - $totalCostBasis;

    // 3. Create NEW master sale record
    $insertMaster = $pdo->prepare("
        INSERT INTO market_sales (
            sale_uid, gold_type, status, total_grams, total_volume, 
            estimated_cash, net_profit_ghs, actual_local_price, 
            actual_grams_market, actual_volume_market, actual_cash, handler_id, is_merged
        ) VALUES (
            ?, 'refined', 'completed', ?, ?, 
            ?, ?, ?, 
            ?, ?, ?, ?, 1
        )
    ");
    
    $newSaleUid = 'MRG-' . time() . '-' . rand(100, 999);
    $current_user_id = $current_user_id ?? 1;

    $insertMaster->execute([
        $newSaleUid, 
        $totalOriginalGrams, $actualVolume, 
        $totalEstCash, $netProfit, $actualPrice,
        $actualGrams, $actualVolume, $actualCash, $current_user_id
    ]);
    
    $newMasterId = $pdo->lastInsertId();

    // 4. Update old sales to point to new master sale
    $updateOld = $pdo->prepare("UPDATE market_sales SET merged_into_id = ?, status = 'completed' WHERE id IN ($inClause)");
    $params = array_merge([$newMasterId], $saleIds);
    $updateOld->execute($params);

    // 5. Update gold_vault records to link to the new master sale ID
    $updateVault = $pdo->prepare("UPDATE gold_vault SET sale_id = ? WHERE sale_id IN ($inClause)");
    $updateVault->execute($params);

    // 6. Inject into capital_ledger
    $balanceStmt = $pdo->query("SELECT running_balance FROM capital_ledger ORDER BY id DESC LIMIT 1 FOR UPDATE");
    $lastLedger = $balanceStmt->fetch();
    $currentBalance = $lastLedger ? (float)$lastLedger['running_balance'] : 0.0;
    
    $newBalance = $currentBalance + $actualCash;

    $insertLedger = $pdo->prepare("INSERT INTO capital_ledger (transaction_type, amount_ghs, running_balance, reference_id) VALUES ('out_sale_revenue', ?, ?, ?)");
    $insertLedger->execute([$actualCash, $newBalance, $newMasterId]);

    log_activity($pdo, $current_user_id, 'MERGE_COMPLETE_SALE', 'market_sales', $newMasterId, ['merged_ids' => $saleIds], ['new_status' => 'completed', 'actual_cash' => $actualCash]);

    $pdo->commit();

    sendResponse('success', 'Sales merged and completed successfully', [
        'actual_cash' => $actualCash,
        'master_sale_id' => $newMasterId
    ], 200);

} catch (\Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("System Error (Merge Sale): " . $e->getMessage());
    sendResponse('error', $e->getMessage(), [], 500);
}
