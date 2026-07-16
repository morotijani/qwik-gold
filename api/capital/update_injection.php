<?php
// api/capital/update_injection.php

require_once '../../config/headers.php';
require_once '../../config/database.php';
require_once '../middleware/auth.php';
require_once '../helpers/logger.php';
require_once '../helpers/ledger.php';

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
if (!isset($data['ledger_id']) || !isset($data['source_description']) || !isset($data['amount_ghs'])) {
    sendResponse('error', 'Missing required fields: ledger_id, source_description, amount_ghs', [], 400);
}

$ledgerId = (int)$data['ledger_id'];
$sourceDescription = trim($data['source_description']);
$amountGhs = (float)$data['amount_ghs'];

if (empty($sourceDescription)) {
    sendResponse('error', 'Source description cannot be empty', [], 400);
}

if ($amountGhs <= 0) {
    sendResponse('error', 'Injection amount must be greater than zero', [], 400);
}

try {
    $pdo->beginTransaction();

    // 1. Verify this ledger row exists and is an external_capital_in transaction
    $stmt = $pdo->prepare("SELECT * FROM capital_ledger WHERE id = ? FOR UPDATE");
    $stmt->execute([$ledgerId]);
    $ledgerRow = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$ledgerRow) {
        throw new \Exception("Ledger transaction not found.");
    }

    if ($ledgerRow['transaction_type'] !== 'external_capital_in') {
        throw new \Exception("You can only edit external capital injections.");
    }

    $oldAmount = (float)$ledgerRow['amount_ghs'];

    // 2. Update the specific row
    $updateStmt = $pdo->prepare("UPDATE capital_ledger SET amount_ghs = ?, description = ? WHERE id = ?");
    $updateStmt->execute([$amountGhs, $sourceDescription, $ledgerId]);

    // 3. Recalculate the entire running balance chain from this row forward
    recalculate_ledger_balances($pdo, $ledgerId);

    // 4. Log the activity
    log_activity($pdo, $current_user_id ?? null, 'UPDATE_CAPITAL', 'capital_ledger', $ledgerId, null, [
        'old_amount' => $oldAmount,
        'new_amount' => $amountGhs,
        'source' => $sourceDescription
    ]);

    $pdo->commit();

    sendResponse('success', 'External capital injection updated successfully.', [
        'ledger_id' => $ledgerId,
        'new_amount_ghs' => $amountGhs
    ], 200);

} catch (\Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    // Distinguish between our thrown validation exceptions and real system errors
    if ($e->getMessage() === "Ledger transaction not found." || $e->getMessage() === "You can only edit external capital injections.") {
        sendResponse('error', $e->getMessage(), [], 400);
    }

    error_log("System Error updating capital: " . $e->getMessage());
    sendResponse('error', 'A system error occurred while processing your request.', [], 500);
}
