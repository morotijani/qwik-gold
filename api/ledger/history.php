<?php
// api/ledger/history.php

require_once '../../config/headers.php';
require_once '../../config/database.php';

// Secure the endpoint by requiring the Auth Gatekeeper
require_once '../middleware/auth.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse('error', 'Method not allowed. Use GET.', [], 405);
}

// Extract pagination parameters with defaults
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
$offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

// Ensure limits are strictly positive/valid
if ($limit <= 0) $limit = 50;
if ($offset < 0) $offset = 0;

try {
    // 1) Calculate the absolute current overall running_balance dynamically
    $balanceStmt = $pdo->query("SELECT SUM(amount_ghs) AS total_cash FROM capital_ledger");
    $balanceResult = $balanceStmt->fetch();
    $currentRunningBalance = $balanceResult && $balanceResult['total_cash'] !== null ? (float)$balanceResult['total_cash'] : 0.0;

    // 2) Query the capital_ledger table for transaction history with pagination
    $stmt = $pdo->prepare("
        SELECT id, transaction_type, amount_ghs, reference_id, created_at 
        FROM capital_ledger 
        ORDER BY created_at DESC 
        LIMIT :limit OFFSET :offset
    ");
    
    // Bind numeric params explicitly to prevent SQL injection in LIMIT/OFFSET
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 3) Map the raw SQL results to precisely match the requested JSON schema array
    $transactions = [];
    foreach ($results as $row) {
        $transactions[] = [
            'id' => (int)$row['id'],
            'type' => $row['transaction_type'],
            'amount_ghs' => (float)$row['amount_ghs'],
            'reference_id' => $row['reference_id'] !== null ? (int)$row['reference_id'] : null,
            'date' => $row['created_at']
        ];
    }

    // 4) Return the final structured JSON response
    sendResponse('success', 'Ledger history retrieved', [
        'current_running_balance_ghs' => round($currentRunningBalance, 2),
        'transactions' => $transactions
    ], 200);

} catch (\PDOException $e) {
    sendResponse('error', 'Database error occurred: ' . $e->getMessage(), [], 500);
}
