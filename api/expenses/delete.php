<?php
// api/expenses/delete.php

require_once '../../config/headers.php';
require_once '../../config/database.php';
require_once '../middleware/auth.php';
require_once '../helpers/logger.php';

// Only allow POST requests (we use POST for destructive actions usually from frontend)
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse('error', 'Method not allowed. Use POST.', [], 405);
}

$jsonInput = file_get_contents('php://input');
$data = json_decode($jsonInput, true);

if (!isset($data['expense_id'])) {
    sendResponse('error', 'Missing required field: expense_id', [], 400);
}

$expenseId = (int)$data['expense_id'];
$isPermanent = isset($data['permanent']) && $data['permanent'] === true;

try {
    $pdo->beginTransaction();

    // 1) Fetch the expense
    $stmt = $pdo->prepare("SELECT * FROM expenses WHERE id = ? FOR UPDATE");
    $stmt->execute([$expenseId]);
    $expense = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$expense) {
        throw new Exception("Expense not found.");
    }

    if ($isPermanent) {
        if ($expense['status'] !== 'voided') {
            throw new Exception("You can only permanently delete voided expenses.");
        }
        $deleteStmt = $pdo->prepare("DELETE FROM expenses WHERE id = ?");
        $deleteStmt->execute([$expenseId]);
        
        log_activity($pdo, $current_user_id ?? null, 'EXPENSE_PERM_DELETED', 'expenses', $expenseId, ['description' => $expense['description']], []);
        
        $pdo->commit();
        sendResponse('success', 'Expense permanently deleted.', [], 200);
        exit;
    }

    if ($expense['status'] === 'voided') {
        throw new Exception("Expense is already voided.");
    }

    $amountToRefund = (float)$expense['amount'];

    // 2) Get the latest capital_ledger balance
    $balanceStmt = $pdo->query("SELECT running_balance FROM capital_ledger ORDER BY id DESC LIMIT 1 FOR UPDATE");
    $lastLedger = $balanceStmt->fetch();
    $currentBalance = $lastLedger ? (float)$lastLedger['running_balance'] : 0.0;

    $newBalance = $currentBalance + $amountToRefund;

    // 3) Insert refund into capital_ledger
    $insertLedgerStmt = $pdo->prepare("
        INSERT INTO capital_ledger (transaction_type, amount_ghs, running_balance, reference_id) 
        VALUES ('expense_refunded', ?, ?, ?)
    ");
    $insertLedgerStmt->execute([$amountToRefund, $newBalance, $expenseId]);

    // 4) Update the expense status to voided
    $voidStmt = $pdo->prepare("UPDATE expenses SET status = 'voided' WHERE id = ?");
    $voidStmt->execute([$expenseId]);

    // 5) Log activity
    log_activity($pdo, $current_user_id ?? null, 'EXPENSE_VOIDED', 'expenses', $expenseId, ['old_amount' => $amountToRefund, 'description' => $expense['description']], []);

    $pdo->commit();

    sendResponse('success', 'Expense successfully voided and refunded to Capital Ledger.', [], 200);

} catch (\Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("System Error: " . $e->getMessage());
    sendResponse('error', 'A system error occurred while processing your request.', [], 500);
}
