<?php
// api/purchases/delete.php

require_once '../../config/headers.php';
require_once '../../config/database.php';
require_once '../helpers/logger.php';
require_once '../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse('error', 'Method not allowed. Use POST.', [], 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (empty($input['id'])) {
    sendResponse('error', 'Purchase ID is required', [], 400);
}

$purchaseId = (int)$input['id'];

try {
    $pdo->beginTransaction();

    // 1. Fetch the purchase
    $stmt = $pdo->prepare("SELECT * FROM gold_purchases WHERE id = ? FOR UPDATE");
    $stmt->execute([$purchaseId]);
    $purchase = $stmt->fetch();

    if (!$purchase) {
        throw new Exception("Purchase not found.");
    }

    // 2. Fetch the linked gold_vault record
    $vaultStmt = $pdo->prepare("SELECT * FROM gold_vault WHERE purchase_id = ? FOR UPDATE");
    $vaultStmt->execute([$purchaseId]);
    $vaultItem = $vaultStmt->fetch();

    // Fallback for older records created before purchase_id was added
    if (!$vaultItem) {
        $vaultStmt = $pdo->prepare("
            SELECT * FROM gold_vault 
            WHERE ownership_status = 'company_owned' 
            AND gold_type = ? 
            AND weight_grams = ? 
            AND created_at BETWEEN (STR_TO_DATE(?, '%Y-%m-%d %H:%i:%s') - INTERVAL 2 SECOND) AND (STR_TO_DATE(?, '%Y-%m-%d %H:%i:%s') + INTERVAL 2 SECOND)
            LIMIT 1
            FOR UPDATE
        ");
        $vaultStmt->execute([
            $purchase['gold_type'],
            $purchase['weight_grams'],
            $purchase['created_at'],
            $purchase['created_at']
        ]);
        $vaultItem = $vaultStmt->fetch();
    }

    // 3. Safety Checks
    if (!$vaultItem) {
        throw new Exception("Could not locate the associated gold in the vault. Deletion aborted.");
    }

    if (!in_array($vaultItem['current_location'], ['office_vault', 'on_hold'])) {
        throw new Exception("This purchase cannot be deleted because the gold has already been smelted or sold.");
    }

    // 4. Delete the gold_vault record
    $pdo->prepare("DELETE FROM gold_vault WHERE id = ?")->execute([$vaultItem['id']]);

    // 5. Reverse Capital Transaction
    $totalPaid = (float)$purchase['total_paid_ghs'];
    if ($totalPaid > 0) {
        $balanceStmt = $pdo->query("SELECT running_balance FROM capital_ledger ORDER BY id DESC LIMIT 1 FOR UPDATE");
        $lastLedger = $balanceStmt->fetch();
        $currentBalance = $lastLedger ? (float)$lastLedger['running_balance'] : 0.0;
        
        $newBalance = $currentBalance + $totalPaid;
        
        $ledgerStmt = $pdo->prepare("INSERT INTO capital_ledger (transaction_type, amount_ghs, running_balance, description) VALUES ('purchase_reversal', ?, ?, ?)");
        $ledgerStmt->execute([$totalPaid, $newBalance, "Reversal for deleted purchase (Ref: " . $purchase['transaction_ref'] . ")"]);
    }

    // 6. Delete the purchase record
    $pdo->prepare("DELETE FROM gold_purchases WHERE id = ?")->execute([$purchaseId]);

    // 7. Log activity
    log_activity($pdo, $current_user_id ?? null, 'DELETE_PURCHASE', 'gold_purchases', $purchaseId, null, [
        'transaction_ref' => $purchase['transaction_ref'],
        'weight_grams' => $purchase['weight_grams'],
        'refunded_capital' => $totalPaid
    ]);

    $pdo->commit();

    sendResponse('success', 'Purchase successfully deleted and capital refunded.', [], 200);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Delete Purchase Error: " . $e->getMessage());
    sendResponse('error', $e->getMessage(), [], 500);
}
