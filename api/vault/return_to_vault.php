<?php
// api/vault/return_to_vault.php

require_once '../../config/headers.php';
require_once '../../config/database.php';
require_once '../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse('error', 'Method not allowed', [], 405);
}

try {
    $pdo->beginTransaction();

    // Check if there is any gold on hold
    $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM gold_vault WHERE ownership_status = 'company_owned' AND current_location = 'on_hold'");
    $checkStmt->execute();
    if ($checkStmt->fetchColumn() == 0) {
        throw new \Exception("There is no gold on hold to return to the active vault.");
    }

    // Move all company-owned gold from on_hold back to office_vault
    $updateStmt = $pdo->prepare("UPDATE gold_vault SET current_location = 'office_vault' WHERE ownership_status = 'company_owned' AND current_location = 'on_hold'");
    $updateStmt->execute();

    $pdo->commit();
    sendResponse('success', 'Held gold successfully returned to active vault.', [], 200);

} catch (\Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Return to Vault Error: " . $e->getMessage());
    sendResponse('error', $e->getMessage(), [], 400);
}
