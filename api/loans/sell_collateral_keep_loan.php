<?php
// api/loans/sell_collateral_keep_loan.php

require_once '../../config/headers.php';
require_once '../../config/database.php';
require_once '../middleware/auth.php';
require_once '../helpers/logger.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse('error', 'Method not allowed', [], 405);
}

$jsonInput = file_get_contents('php://input');
$data = json_decode($jsonInput, true);

if (!$data) {
    sendResponse('error', 'Invalid JSON payload', [], 400);
}

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
    $pdo->beginTransaction();

    // 1. SELECT the loan and lock the row
    $stmt = $pdo->prepare("SELECT principal_amount, status, notes FROM loans WHERE id = ? AND customer_id = ? FOR UPDATE");
    $stmt->execute([$loanId, $customerId]);
    $loan = $stmt->fetch();

    if (!$loan) {
        throw new Exception("Loan not found for this customer");
    }
    if ($loan['status'] !== 'active') {
        throw new Exception("This loan is already settled or inactive");
    }

    // 2. Fetch keeper's current hold records in FIFO order and lock them for update
    $stmt = $pdo->prepare("SELECT id, weight_grams FROM gold_vault WHERE customer_id = ? AND gold_type = ? AND ownership_status = 'keeper_held' AND current_location = 'office_vault' ORDER BY id ASC FOR UPDATE");
    $stmt->execute([$customerId, $goldType]);
    $vaultRecords = $stmt->fetchAll();

    $remainingToUse = $weightGrams;

    foreach ($vaultRecords as $row) {
        if ($remainingToUse <= 0.0001) break;

        $recordId = $row['id'];
        $recordGrams = (float)$row['weight_grams'];

        if ($recordGrams <= $remainingToUse) {
            $proportionalValue = ($recordGrams / $weightGrams) * $goldValueGhs;
            $updateStmt = $pdo->prepare("UPDATE gold_vault SET ownership_status = 'company_owned', customer_id = NULL, guessed_value_ghs = ? WHERE id = ?");
            $updateStmt->execute([$proportionalValue, $recordId]);
            $remainingToUse -= $recordGrams;
        } else {
            $newKeeperGrams = $recordGrams - $remainingToUse;
            $updateStmt = $pdo->prepare("UPDATE gold_vault SET weight_grams = ? WHERE id = ?");
            $updateStmt->execute([$newKeeperGrams, $recordId]);

            $proportionalValue = ($remainingToUse / $weightGrams) * $goldValueGhs;
            $insertStmt = $pdo->prepare("INSERT INTO gold_vault (gold_type, ownership_status, weight_grams, volume, current_location, customer_id, guessed_value_ghs) VALUES (?, 'company_owned', ?, ?, 'office_vault', NULL, ?)");
            $insertStmt->execute([$goldType, $remainingToUse, $volume, $proportionalValue]);
            $remainingToUse = 0;
            break;
        }
    }

    if ($remainingToUse > 0.0001) {
        throw new Exception("Insufficient collateral. Trying to use {$weightGrams}g but only found " . ($weightGrams - $remainingToUse) . "g of keeper-held {$goldType} gold.");
    }

    // 3. Update the loan to be a standard loan and append a note
    $dateStr = date('Y-m-d H:i:s');
    $appendNote = "[Collateral Sold to Company on {$dateStr} - Converted to Standard Loan]";
    $newNotes = empty($loan['notes']) ? $appendNote : $loan['notes'] . " " . $appendNote;

    $updateLoanStmt = $pdo->prepare("UPDATE loans SET type = 'standard', notes = ? WHERE id = ?");
    $updateLoanStmt->execute([$newNotes, $loanId]);

    // 4. Pay out the customer from the capital ledger
    $balanceStmt = $pdo->query("SELECT running_balance FROM capital_ledger ORDER BY id DESC LIMIT 1 FOR UPDATE");
    $lastLedger = $balanceStmt->fetch();
    $currentBalance = $lastLedger ? (float)$lastLedger['running_balance'] : 0.0;
    
    if ($currentBalance < $goldValueGhs) {
        throw new Exception("Insufficient Office Capital. Current available capital is ₵ " . number_format($currentBalance, 2));
    }
    
    $deductionAmount = -1 * abs($goldValueGhs);
    $newBalance = $currentBalance + $deductionAmount;

    $txnRef = 'PUR-COL-' . strtoupper(substr(uniqid(), -5)) . rand(10, 99);

    // 5. Insert purchase record with origin 'collateral_purchase'
    $insertPurchaseStmt = $pdo->prepare("
        INSERT INTO gold_purchases 
        (transaction_ref, customer_id, gold_type, weight_grams, volume, total_paid_ghs, local_price, density, karat, pounds, total_blades, origin, handler_id, notes) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'collateral_purchase', ?, ?)
    ");
    $insertPurchaseStmt->execute([
        $txnRef, $customerId, $goldType, $weightGrams, $volume, $goldValueGhs, $currentLocalPrice, 
        $density, $karat, $pounds, $totalBlades, $current_user_id ?? null, "Customer sold collateral for cash."
    ]);
    $purchaseId = $pdo->lastInsertId();

    $ledgerStmt = $pdo->prepare("INSERT INTO capital_ledger (transaction_type, amount_ghs, running_balance, reference_id) VALUES ('gold_purchase', ?, ?, ?)");
    $ledgerStmt->execute([$deductionAmount, $newBalance, $purchaseId]);
    
    log_activity($pdo, $current_user_id ?? null, 'CONVERT_COLLATERAL_TO_STANDARD', 'loans', $loanId, ['type' => 'collateral'], ['type' => 'standard', 'payout' => $goldValueGhs]);
    
    $pdo->commit();

    sendResponse('success', 'Collateral successfully purchased and loan converted to standard', [
        'loan_id' => $loanId,
        'gold_used_grams' => $weightGrams,
        'payout_amount_ghs' => $goldValueGhs
    ], 200);

} catch (\Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("System Error (Sell Collateral Keep Loan): " . $e->getMessage());
    sendResponse('error', $e->getMessage(), [], 500);
}
