<?php
// api/expenses/create.php

require_once '../../config/headers.php';
require_once '../../config/database.php';
require_once '../middleware/auth.php';
require_once '../helpers/logger.php';


// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse('error', 'Method not allowed', [], 405);
}

// Get the JSON payload
$jsonInput = file_get_contents('php://input');
$data = json_decode($jsonInput, true);

if (!$data) {
    sendResponse('error', 'Invalid JSON payload', [], 400);
}

// Validate base required fields
if (!isset($data['description']) || !isset($data['amount_ghs'])) {
    sendResponse('error', 'Missing required fields: description, amount_ghs', [], 400);
}

$description = trim($data['description']);
$amountGhs = (float)$data['amount_ghs'];

// Process optional date (defaults to today's date in Y-m-d format)
$date = isset($data['date']) && !empty($data['date']) ? $data['date'] : date('Y-m-d');

if (empty($description)) {
    sendResponse('error', 'Description cannot be empty', [], 400);
}

if ($amountGhs <= 0) {
    sendResponse('error', 'Expense amount must be greater than zero', [], 400);
}

try {
    // 0. Begin the database transaction
    $pdo->beginTransaction();

    // 1. INSERT a new record into the expenses table
    $stmt = $pdo->prepare("INSERT INTO expenses (description, amount, date, handler_id) VALUES (?, ?, ?, ?)");
    $stmt->execute([$description, $amountGhs, $date, $current_user_id ?? null]);
    $expenseId = $pdo->lastInsertId();

    // 2. INSERT a record into the capital_ledger table
    // Securely fetch the latest running balance
    $balanceStmt = $pdo->query("SELECT running_balance FROM capital_ledger ORDER BY id DESC LIMIT 1 FOR UPDATE");
    $lastLedger = $balanceStmt->fetch();
    $currentBalance = $lastLedger ? (float)$lastLedger['running_balance'] : 0.0;
    
    // Calculate the deduction
    $deductionAmount = -1 * abs($amountGhs);
    $newBalance = $currentBalance + $deductionAmount;

    $insertLedgerStmt = $pdo->prepare("INSERT INTO capital_ledger (transaction_type, amount_ghs, running_balance, reference_id) VALUES ('expense', ?, ?, ?)");
    $insertLedgerStmt->execute([$deductionAmount, $newBalance, $expenseId]);

    
    log_activity($pdo, $current_user_id ?? null, 'CREATE_EXPENSE', 'expenses', $expenseId, null, ['amount' => $amountGhs, 'description' => $description]);
    // 3. Commit Transaction
    $pdo->commit();

    sendResponse('success', 'Expense recorded successfully', [
        'expense_id' => (int)$expenseId,
        'description' => $description,
        'amount_deducted_ghs' => abs($deductionAmount),
        'capital_status' => 'Ledger updated'
    ], 201); // 201 Created

} catch (\Exception $e) {
    // Roll back the entire transaction if any step fails
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    // Output error response
    error_log("System Error: " . $e->getMessage());
    sendResponse('error', 'A system error occurred while processing your request.', [], 500);
}
