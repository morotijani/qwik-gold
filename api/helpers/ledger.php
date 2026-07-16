<?php
// api/helpers/ledger.php

/**
 * Recalculates the running_balance of all transactions in the capital_ledger
 * starting from a specific ID onwards.
 * 
 * Assumes that $pdo->beginTransaction() has already been called
 * and locks the table rows using FOR UPDATE.
 *
 * @param PDO $pdo The active PDO connection
 * @param int $fromId The ID of the capital_ledger row to start recalculating from
 * @throws Exception If a database error occurs
 */
function recalculate_ledger_balances(PDO $pdo, int $fromId) {
    // 1. Get the balance exactly prior to the row we are starting from.
    // We lock that row just to be safe.
    $stmt = $pdo->prepare("SELECT running_balance FROM capital_ledger WHERE id < ? ORDER BY id DESC LIMIT 1 FOR UPDATE");
    $stmt->execute([$fromId]);
    $prev = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $current_balance = $prev ? (float)$prev['running_balance'] : 0.0;

    // 2. Fetch all rows from the start ID onwards, ordered chronologically (by ID), locking them.
    $stmt = $pdo->prepare("SELECT id, amount_ghs FROM capital_ledger WHERE id >= ? ORDER BY id ASC FOR UPDATE");
    $stmt->execute([$fromId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($rows)) {
        return; // Nothing to recalculate
    }

    // 3. Update the running balance sequentially.
    // Prepare the update statement once for performance
    $updateStmt = $pdo->prepare("UPDATE capital_ledger SET running_balance = ? WHERE id = ?");
    
    foreach ($rows as $row) {
        $current_balance += (float)$row['amount_ghs'];
        $updateStmt->execute([$current_balance, $row['id']]);
    }
}
