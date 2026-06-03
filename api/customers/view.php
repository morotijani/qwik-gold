<?php
// api/customers/view.php

require_once '../../config/headers.php';
require_once '../../config/database.php';

// Secure the endpoint by requiring the Auth Gatekeeper
require_once '../middleware/auth.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse('error', 'Method not allowed. Use GET.', [], 405);
}

// Validate parameter
if (!isset($_GET['customer_id'])) {
    sendResponse('error', 'Missing required parameter: customer_id', [], 400);
}

$customerId = (int)$_GET['customer_id'];

if ($customerId <= 0) {
    sendResponse('error', 'Invalid customer_id', [], 400);
}

try {
    // 1) SELECT customer details
    $custStmt = $pdo->prepare("SELECT id, customer_uid, name, business_name, type, entity_type, phone, email, address, created_at FROM customers WHERE id = ?");
    $custStmt->execute([$customerId]);
    $customer = $custStmt->fetch(PDO::FETCH_ASSOC);

    if (!$customer) {
        sendResponse('error', 'Customer not found', [], 404);
    }

    // 2) SELECT all loans (active and settled)
    $loansStmt = $pdo->prepare("SELECT id, customer_id, loan_uid, principal_amount, type, status, created_at FROM loans WHERE customer_id = ? ORDER BY created_at DESC");
    $loansStmt->execute([$customerId]);
    $allLoans = $loansStmt->fetchAll(PDO::FETCH_ASSOC);
    
    $totalActiveDebt = 0.0;
    $totalSettled = 0.0;
    $activeLoans = [];

    foreach ($allLoans as $loan) {
        if ($loan['status'] === 'active') {
            $totalActiveDebt += (float)$loan['principal_amount'];
            $activeLoans[] = $loan;
        } else {
            $totalSettled += (float)$loan['principal_amount'];
        }
    }

    // 3) SELECT the sum of their keeper gold
    $goldStmt = $pdo->prepare("
        SELECT gold_type, SUM(weight_grams) as total_grams, SUM(volume) as total_volume, SUM(total_blades) as sum_blades 
        FROM gold_vault 
        WHERE customer_id = ? AND ownership_status = 'keeper_held'
        GROUP BY gold_type
    ");
    $goldStmt->execute([$customerId]);
    $goldResults = $goldStmt->fetchAll(PDO::FETCH_ASSOC);
    
    $vaultTotals = [
        'balls_grams' => 0.0,
        'balls_blades' => 0.0,
        'refined_grams' => 0.0,
        'refined_volume' => 0.0
    ];
    
    foreach ($goldResults as $row) {
        if ($row['gold_type'] === 'balls') {
            $vaultTotals['balls_grams'] = (float)$row['total_grams'];
            $vaultTotals['balls_blades'] = (float)$row['sum_blades'];
        } elseif ($row['gold_type'] === 'refined') {
            $vaultTotals['refined_grams'] = (float)$row['total_grams'];
            $vaultTotals['refined_volume'] = (float)$row['total_volume'];
        }
    }
    // 4) SELECT all gold purchases (walk-in sales from this customer)
    $purchasesStmt = $pdo->prepare("SELECT id, transaction_ref, gold_type, weight_grams, total_paid_ghs, created_at FROM gold_purchases WHERE customer_id = ? ORDER BY created_at DESC");
    $purchasesStmt->execute([$customerId]);
    $allPurchases = $purchasesStmt->fetchAll(PDO::FETCH_ASSOC);

    // Return the perfectly combined JSON response
    sendResponse('success', 'Customer profile retrieved', [
        'profile' => $customer,
        'active_debt' => [
            'total_amount_ghs' => $totalActiveDebt,
            'loans' => $activeLoans
        ],
        'all_loans' => $allLoans,
        'all_purchases' => $allPurchases,
        'total_settled_ghs' => $totalSettled,
        'current_kept_gold' => $vaultTotals
    ], 200);

} catch (\PDOException $e) {
    sendResponse('error', 'Database error occurred: ' . $e->getMessage(), [], 500);
}
