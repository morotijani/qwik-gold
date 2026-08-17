<?php
// api/vault/move_to_hold.php

require_once '../../config/headers.php';
require_once '../../config/database.php';
require_once '../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse('error', 'Method not allowed', [], 405);
}

try {
    $pdo->beginTransaction();

    // Check if there is any gold to hold
    $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM gold_vault WHERE ownership_status = 'company_owned' AND current_location = 'office_vault'");
    $checkStmt->execute();
    if ($checkStmt->fetchColumn() == 0) {
        throw new \Exception("There is no company-owned gold in the active vault to move to hold.");
    }

    // Move all company-owned gold from office_vault to on_hold
    $updateStmt = $pdo->prepare("UPDATE gold_vault SET current_location = 'on_hold' WHERE ownership_status = 'company_owned' AND current_location = 'office_vault'");
    $updateStmt->execute();

    $pdo->commit();
    sendResponse('success', 'Vault successfully moved to hold.', [], 200);

} catch (\Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Move to Hold Error: " . $e->getMessage());
    sendResponse('error', $e->getMessage(), [], 400);
}
