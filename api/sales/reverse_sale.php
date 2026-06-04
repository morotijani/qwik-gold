<?php
// api/sales/reverse_sale.php

require_once '../../config/headers.php';
require_once '../../config/database.php';
require_once '../middleware/auth.php';
require_once '../helpers/logger.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse('error', 'Method not allowed', [], 405);
}

$jsonInput = file_get_contents('php://input');
$data = json_decode($jsonInput, true);

if (!isset($data['sale_id'])) {
    sendResponse('error', 'Missing required fields', [], 400);
}

$saleId = (int)$data['sale_id'];

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("SELECT * FROM market_sales WHERE id = ? AND status = 'pending' FOR UPDATE");
    $stmt->execute([$saleId]);
    $sale = $stmt->fetch();

    if (!$sale) {
        throw new Exception("Sale not found or already completed.");
    }

    // 1. Revert gold_vault records
    $updateVault = $pdo->prepare("
        UPDATE gold_vault 
        SET current_location = 'office_vault', sale_id = NULL 
        WHERE sale_id = ?
    ");
    $updateVault->execute([$saleId]);

    // 2. Delete the pending market_sales record
    $deleteSale = $pdo->prepare("DELETE FROM market_sales WHERE id = ?");
    $deleteSale->execute([$saleId]);

    log_activity($pdo, $current_user_id ?? null, 'REVERSE_SALE', 'market_sales', $saleId, ['status' => 'pending'], ['status' => 'deleted']);

    $pdo->commit();

    sendResponse('success', 'Sale reversed and gold returned to vault successfully', [], 200);

} catch (\Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    sendResponse('error', 'Failed to reverse sale: ' . $e->getMessage(), [], 500);
}
