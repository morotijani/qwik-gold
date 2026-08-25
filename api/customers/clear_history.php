<?php
// api/customers/clear_history.php

require_once '../../config/headers.php';
require_once '../../config/database.php';
require_once '../middleware/auth.php';
require_once '../helpers/logger.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse('error', 'Method not allowed', [], 405);
}

$jsonInput = file_get_contents('php://input');
$data = json_decode($jsonInput, true);

if (!$data || !isset($data['customer_id'])) {
    sendResponse('error', 'Missing customer_id', [], 400);
}

$customerId = (int)$data['customer_id'];

if ($customerId <= 0) {
    sendResponse('error', 'Invalid customer_id', [], 400);
}

try {
    $pdo->beginTransaction();

    // Hide all settled loans
    $stmtLoans = $pdo->prepare("UPDATE loans SET is_cleared_from_profile = TRUE WHERE customer_id = ? AND status = 'settled'");
    $stmtLoans->execute([$customerId]);
    $loansCleared = $stmtLoans->rowCount();

    // Hide all gold purchases
    $stmtPurchases = $pdo->prepare("UPDATE gold_purchases SET is_cleared_from_profile = TRUE WHERE customer_id = ?");
    $stmtPurchases->execute([$customerId]);
    $purchasesCleared = $stmtPurchases->rowCount();

    $pdo->commit();

    log_activity($pdo, $current_user_id ?? null, 'CLEAR_CUSTOMER_HISTORY', 'customers', $customerId, null, [
        'loans_cleared' => $loansCleared,
        'purchases_cleared' => $purchasesCleared
    ]);

    sendResponse('success', "History cleared. Hidden $loansCleared settled loans and $purchasesCleared past purchases.", [
        'loans_cleared' => $loansCleared,
        'purchases_cleared' => $purchasesCleared
    ], 200);

} catch (\Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Clear History Error: " . $e->getMessage());
    sendResponse('error', 'A system error occurred while clearing history.', [], 500);
}
