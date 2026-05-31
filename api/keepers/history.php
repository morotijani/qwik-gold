<?php
// api/keepers/history.php

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
    // 1) Fetch Deposits (via audit_logs joined with gold_vault to get the original deposited amount)
    // We use JSON_EXTRACT to pull the exact grams deposited from the audit log, 
    // because the gold_vault weight_grams might have been reduced by liquidations.
    $depositsStmt = $pdo->prepare("
        SELECT 
            a.created_at, 
            'deposit' as action, 
            CAST(JSON_EXTRACT(a.new_data, '$.grams') AS DECIMAL(10,4)) as grams, 
            JSON_UNQUOTE(JSON_EXTRACT(a.new_data, '$.type')) as gold_type,
            CAST(JSON_EXTRACT(a.new_data, '$.volume') AS DECIMAL(10,4)) as volume,
            CAST(JSON_EXTRACT(a.new_data, '$.total_blades') AS DECIMAL(10,2)) as total_blades,
            NULL as payout_ghs
        FROM audit_logs a
        JOIN gold_vault g ON a.record_id = g.id
        WHERE a.action = 'DEPOSIT_KEEPER' AND g.customer_id = ?
    ");
    $depositsStmt->execute([$customerId]);
    $deposits = $depositsStmt->fetchAll(PDO::FETCH_ASSOC);

    // 2) Fetch Liquidations (Sales)
    $salesStmt = $pdo->prepare("
        SELECT 
            created_at, 
            'liquidate' as action, 
            weight_grams as grams, 
            gold_type,
            total_paid_ghs as payout_ghs
        FROM gold_purchases 
        WHERE origin = 'from_keeper' AND customer_id = ?
    ");
    $salesStmt->execute([$customerId]);
    $sales = $salesStmt->fetchAll(PDO::FETCH_ASSOC);

    // Combine and sort by created_at DESC
    $history = array_merge($deposits, $sales);
    
    usort($history, function($a, $b) {
        return strtotime($b['created_at']) - strtotime($a['created_at']);
    });

    sendResponse('success', 'Keeper history retrieved', $history, 200);

} catch (\PDOException $e) {
    sendResponse('error', 'Database error occurred: ' . $e->getMessage(), [], 500);
}
