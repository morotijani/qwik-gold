<?php
// api/capital/withdraw_all.php & api/capital/withdraw.php

require_once '../../config/headers.php';
require_once '../../config/database.php';
require_once '../middleware/auth.php';
require_once '../helpers/logger.php';

// Only administrators can withdraw capital
requireRole('admin');

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse('error', 'Method not allowed', [], 405);
}

// Get the JSON payload
$jsonInput = file_get_contents('php://input');
$data = json_decode($jsonInput, true);
if (!is_array($data)) {
    $data = [];
}

try {
    $pdo->beginTransaction();

    // Fetch the total available balance by summing all transactions with row lock
    $balanceStmt = $pdo->query("SELECT SUM(amount_ghs) AS total_cash FROM capital_ledger");
    $lastLedger = $balanceStmt->fetch();
    $currentBalance = $lastLedger && $lastLedger['total_cash'] !== null ? (float)$lastLedger['total_cash'] : 0.0;

    if ($currentBalance <= 0) {
        $pdo->rollBack();
        sendResponse('error', 'No capital available to withdraw.', [], 400);
    }

    $mode = isset($data['mode']) ? trim($data['mode']) : (isset($data['amount_ghs']) && (float)$data['amount_ghs'] > 0 ? 'partial' : 'all');
    $customDescription = isset($data['description']) && trim($data['description']) !== '' ? trim($data['description']) : null;

    if ($mode === 'all') {
        $amountToWithdraw = round($currentBalance, 2);
        $newBalance = 0.0;
        $description = $customDescription ?: 'Full Capital Withdrawal (Clear)';
        $actionType = 'WITHDRAW_ALL_CAPITAL';
        $successMessage = 'All capital successfully cleared (GHS ' . number_format($amountToWithdraw, 2) . ').';
    } else {
        if (!isset($data['amount_ghs']) || !is_numeric($data['amount_ghs'])) {
            $pdo->rollBack();
            sendResponse('error', 'Missing or invalid withdrawal amount.', [], 400);
        }

        $requestedAmount = round((float)$data['amount_ghs'], 2);

        if ($requestedAmount <= 0) {
            $pdo->rollBack();
            sendResponse('error', 'Withdrawal amount must be greater than zero.', [], 400);
        }

        if ($requestedAmount > ($currentBalance + 0.001)) {
            $pdo->rollBack();
            sendResponse('error', 'Withdrawal amount (GHS ' . number_format($requestedAmount, 2) . ') exceeds available capital (GHS ' . number_format($currentBalance, 2) . ').', [], 400);
        }

        // If requested amount equals or clears entire balance
        if ($requestedAmount >= ($currentBalance - 0.001)) {
            $amountToWithdraw = round($currentBalance, 2);
            $newBalance = 0.0;
            $description = $customDescription ?: 'Full Capital Withdrawal (Clear)';
            $actionType = 'WITHDRAW_ALL_CAPITAL';
            $successMessage = 'All capital successfully cleared (GHS ' . number_format($amountToWithdraw, 2) . ').';
        } else {
            $amountToWithdraw = $requestedAmount;
            $newBalance = round($currentBalance - $amountToWithdraw, 2);
            $description = $customDescription ?: 'Partial Capital Withdrawal';
            $actionType = 'WITHDRAW_CAPITAL';
            $successMessage = 'Capital of GHS ' . number_format($amountToWithdraw, 2) . ' withdrawn successfully.';
        }
    }

    // INSERT into capital_ledger
    // Note amount_ghs is inserted as a negative value because it's a cash outflow
    $insertLedgerStmt = $pdo->prepare("
        INSERT INTO capital_ledger (transaction_type, amount_ghs, running_balance, description) 
        VALUES ('capital_withdrawal', ?, ?, ?)
    ");
    $insertLedgerStmt->execute([-$amountToWithdraw, $newBalance, $description]);
    $ledgerId = (int)$pdo->lastInsertId();

    // Log the activity audit record
    log_activity($pdo, $current_user_id ?? null, $actionType, 'capital_ledger', $ledgerId, null, [
        'amount' => $amountToWithdraw,
        'new_balance' => $newBalance,
        'description' => $description,
        'mode' => $mode
    ]);

    $pdo->commit();

    sendResponse('success', $successMessage, [
        'withdrawn_amount' => $amountToWithdraw,
        'new_capital_balance' => $newBalance,
        'description' => $description,
        'mode' => $mode
    ], 200);

} catch (\Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    error_log("System Error: " . $e->getMessage());
    sendResponse('error', 'A system error occurred while processing your request.', [], 500);
}
