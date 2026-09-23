<?php
// api/capital/withdraw_all.php

require_once '../../config/headers.php';
require_once '../../config/database.php';
require_once '../middleware/auth.php';
require_once '../helpers/logger.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse('error', 'Method not allowed', [], 405);
}

try {
    $pdo->beginTransaction();

    // Fetch the total available balance by summing all transactions
    $balanceStmt = $pdo->query("SELECT SUM(amount_ghs) AS total_cash FROM capital_ledger");
    $lastLedger = $balanceStmt->fetch();
    $currentBalance = $lastLedger && $lastLedger['total_cash'] !== null ? (float)$lastLedger['total_cash'] : 0.0;

    if ($currentBalance <= 0) {
        $pdo->rollBack();
        sendResponse('error', 'No capital available to withdraw.', [], 400);
    }

    $amountToWithdraw = $currentBalance;
    $newBalance = 0.0;

    // INSERT into capital_ledger
    $insertLedgerStmt = $pdo->prepare("INSERT INTO capital_ledger (transaction_type, amount_ghs, running_balance, description) VALUES ('capital_withdrawal', ?, ?, ?)");
    // Note amount_ghs is inserted as a negative value because it's a withdrawal
    $insertLedgerStmt->execute([-$amountToWithdraw, $newBalance, 'Full Capital Withdrawal (Clear)']);

    log_activity($pdo, $current_user_id ?? null, 'WITHDRAW_ALL_CAPITAL', 'capital_ledger', 1, null, ['amount' => $amountToWithdraw]);

    $pdo->commit();

    sendResponse('success', 'All capital successfully cleared.', [
        'withdrawn_amount' => $amountToWithdraw,
        'new_capital_balance' => $newBalance
    ], 200);

} catch (\Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    error_log("System Error: " . $e->getMessage());
    sendResponse('error', 'A system error occurred while processing your request.', [], 500);
}
