<?php
// api/capital/delete_injection.php

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
if (!isset($data['ledger_id'])) {
    sendResponse('error', 'Missing required fields: ledger_id', [], 400);
}

$ledgerId = (int)$data['ledger_id'];

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
        throw new \Exception("You can only delete external capital injections.");
    }

    $oldAmount = (float)$ledgerRow['amount_ghs'];

    // 2. Delete the row
    $deleteStmt = $pdo->prepare("DELETE FROM capital_ledger WHERE id = ?");
    $deleteStmt->execute([$ledgerId]);

    // 3. Recalculate the entire running balance chain from this row's position forward
    // Since the row is deleted, we pass the same ID to the helper. It will recalculate
    // starting from whatever row comes after the previous row. 
    recalculate_ledger_balances($pdo, $ledgerId);

    // 4. Log the activity
    log_activity($pdo, $current_user_id ?? null, 'DELETE_CAPITAL', 'capital_ledger', $ledgerId, null, [
        'amount_removed' => $oldAmount,
        'source_was' => $ledgerRow['description']
    ]);

    $pdo->commit();

    sendResponse('success', 'External capital injection deleted successfully.', [], 200);

} catch (\Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    // Distinguish between our thrown validation exceptions and real system errors
    if ($e->getMessage() === "Ledger transaction not found." || $e->getMessage() === "You can only delete external capital injections.") {
        sendResponse('error', $e->getMessage(), [], 400);
    }

    error_log("System Error deleting capital: " . $e->getMessage());
    sendResponse('error', 'A system error occurred while processing your request.', [], 500);
}
