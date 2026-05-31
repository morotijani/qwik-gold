<?php
// api/loans/offset_collateral.php

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

// Validate inputs
$requiredFields = ['loan_id', 'customer_id', 'gold_type', 'grams_to_use', 'agreed_value_ghs'];
foreach ($requiredFields as $field) {
    if (!isset($data[$field])) {
        sendResponse('error', "Missing required field: {$field}", [], 400);
    }
}

$loanId = (int)$data['loan_id'];
$customerId = (int)$data['customer_id'];
$goldType = strtolower($data['gold_type']);
$weightGrams = (float)$data['grams_to_use'];
$goldValueGhs = (float)$data['agreed_value_ghs'];
$userComment = isset($data['comment']) ? trim($data['comment']) : null;

// Granular gold metrics
$currentLocalPrice = isset($data['current_local_price']) ? (float)$data['current_local_price'] : null;
$volume = isset($data['volume']) ? (float)$data['volume'] : null;
$pounds = isset($data['pounds']) ? (float)$data['pounds'] : null;
$density = isset($data['density']) ? (float)$data['density'] : null;
$karat = isset($data['karat']) ? (float)$data['karat'] : null;

$pricePerBlade = isset($data['price_per_blade']) ? (float)$data['price_per_blade'] : null;
$totalBlades = isset($data['total_blades']) ? (float)$data['total_blades'] : null;

if ($loanId <= 0 || $customerId <= 0 || $weightGrams <= 0 || $goldValueGhs <= 0) {
    sendResponse('error', 'Invalid numeric values provided', [], 400);
}

if ($goldType !== 'balls' && $goldType !== 'refined') {
    sendResponse('error', 'Invalid gold_type. Must be balls or refined', [], 400);
}

try {
    // 0. Begin the transaction
    $pdo->beginTransaction();

    // 1. SELECT the principal_amount from loans and lock the row
    $stmt = $pdo->prepare("SELECT principal_amount, status FROM loans WHERE id = ? AND customer_id = ? FOR UPDATE");
    $stmt->execute([$loanId, $customerId]);
    $loan = $stmt->fetch();

    if (!$loan) {
        throw new Exception("Loan not found for this customer");
    }

    if ($loan['status'] !== 'active') {
        throw new Exception("This loan is already settled");
    }

    $currentPrincipal = (float)$loan['principal_amount'];
    
    // 2. Fetch keeper's current hold records in FIFO order and lock them for update
    $stmt = $pdo->prepare("SELECT id, weight_grams FROM gold_vault WHERE customer_id = ? AND gold_type = ? AND ownership_status = 'keeper_held' ORDER BY id ASC FOR UPDATE");
    $stmt->execute([$customerId, $goldType]);
    $vaultRecords = $stmt->fetchAll();

    $remainingToUse = $weightGrams;

    foreach ($vaultRecords as $row) {
        if ($remainingToUse <= 0.0001) break; // Finished fulfilling the sell amount

        $recordId = $row['id'];
        $recordGrams = (float)$row['weight_grams'];

        if ($recordGrams <= $remainingToUse) {
            // Full record converted to company ownership
            $updateStmt = $pdo->prepare("UPDATE gold_vault SET ownership_status = 'company_owned', customer_id = NULL WHERE id = ?");
            $updateStmt->execute([$recordId]);
            
            $remainingToUse -= $recordGrams;
        } else {
            // Partial conversion: subtract from keeper's record
            $newKeeperGrams = $recordGrams - $remainingToUse;
            $updateStmt = $pdo->prepare("UPDATE gold_vault SET weight_grams = ? WHERE id = ?");
            $updateStmt->execute([$newKeeperGrams, $recordId]);

            // Insert new company_owned record for the converted amount
            $insertStmt = $pdo->prepare("INSERT INTO gold_vault (gold_type, ownership_status, weight_grams, volume, current_location, customer_id) VALUES (?, 'company_owned', ?, ?, 'office_vault', NULL)");
            $insertStmt->execute([$goldType, $remainingToUse, $volume]);

            $remainingToUse = 0;
            break; // Done
        }
    }

    // Check if the keeper actually had enough gold to use
    if ($remainingToUse > 0.0001) {
        throw new Exception("Insufficient collateral. Trying to use {$weightGrams}g but only found " . ($weightGrams - $remainingToUse) . "g of keeper-held {$goldType} gold.");
    }

    // 3. Compare gold value and handle full settlement or partial
    $changeDue = 0.0;
    $newStatus = 'active';
    $newPrincipal = $currentPrincipal;

    // Determine comment
    $userComment = isset($data['comment']) && !empty(trim($data['comment'])) ? trim($data['comment']) : null;

    if ($goldValueGhs >= $currentPrincipal) {
        $newStatus = 'settled';
        $newPrincipal = 0.0;
        
        // Update loan status to 'settled'
        $updateStmt = $pdo->prepare("UPDATE loans SET status = 'settled', principal_amount = 0, settlement_note = 'Settled via collateral offset' WHERE id = ?");
        $updateStmt->execute([$loanId]);

        // Calculate the change due to the customer
        $changeDue = $goldValueGhs - $currentPrincipal;

        // If we owe them change, touch the capital ledger
        if ($changeDue > 0) {
            $balanceStmt = $pdo->query("SELECT running_balance FROM capital_ledger ORDER BY id DESC LIMIT 1 FOR UPDATE");
            $lastLedger = $balanceStmt->fetch();
            $currentBalance = $lastLedger ? (float)$lastLedger['running_balance'] : 0.0;
            
            $deduction = -1 * abs($changeDue);
            $newBalance = $currentBalance + $deduction;

            $insertLedgerStmt = $pdo->prepare("INSERT INTO capital_ledger (transaction_type, amount_ghs, running_balance, reference_id) VALUES ('loan_repaid', ?, ?, ?)");
            $insertLedgerStmt->execute([$deduction, $newBalance, $loanId]);
        }
        
        $message = "Loan settled using collateral";
        
    } else {
        // Handle partial offset
        $newPrincipal = $currentPrincipal - $goldValueGhs;
        
        if ($userComment) {
            $updateStmt = $pdo->prepare("UPDATE loans SET principal_amount = ?, settlement_note = ? WHERE id = ?");
            $updateStmt->execute([$newPrincipal, $userComment, $loanId]);
        } else {
            $updateStmt = $pdo->prepare("UPDATE loans SET principal_amount = ? WHERE id = ?");
            $updateStmt->execute([$newPrincipal, $loanId]);
        }
        
        $message = "Loan partially offset using collateral";
    }

    // 4. Insert purchase record with origin 'collateral_offset'
    $insertPurchaseStmt = $pdo->prepare("INSERT INTO gold_purchases (customer_id, gold_type, weight_grams, total_paid_ghs, origin) VALUES (?, ?, ?, ?, 'collateral_offset')");
    $insertPurchaseStmt->execute([$customerId, $goldType, $weightGrams, $goldValueGhs]);
    $purchaseId = $pdo->lastInsertId();

    // 4b. Insert into loan_settlements
    $settlementStmt = $pdo->prepare("
        INSERT INTO loan_settlements 
        (loan_id, settlement_type, amount_paid, principal_before, principal_after, gold_type, gold_grams_used, processed_by, notes,
         volume, total_blades, price_per_blade, current_local_price, pounds, density, karat)
        VALUES (?, 'collateral', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $settlementStmt->execute([
        $loanId, $goldValueGhs, $currentPrincipal, $newPrincipal, $goldType, $weightGrams, $current_user_id, $userComment,
        $volume, $totalBlades, $pricePerBlade, $currentLocalPrice, $pounds, $density, $karat
    ]);

    
    log_activity($pdo, $current_user_id ?? null, 'OFFSET_COLLATERAL', 'loans', $loanId, ['old_principal' => $currentPrincipal], ['new_principal' => $newPrincipal, 'grams_used' => $weightGrams]);
    // Commit Transaction
    $pdo->commit();

    sendResponse('success', $message, [
        'loan_id' => $loanId,
        'new_loan_status' => $newStatus,
        'gold_used_grams' => $weightGrams,
        'change_due_to_customer_ghs' => $changeDue,
        'vault_status' => 'Collateral converted to company owned'
    ], 200);

} catch (\Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    sendResponse('error', 'Collateral offset failed: ' . $e->getMessage(), [], 500);
}
