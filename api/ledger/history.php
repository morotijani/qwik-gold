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

$typeFilter = isset($_GET['type']) && $_GET['type'] !== '' && $_GET['type'] !== 'all' ? $_GET['type'] : null;

try {
    // 1) Calculate the absolute current overall running_balance dynamically
    $balanceStmt = $pdo->query("SELECT SUM(amount_ghs) AS total_cash FROM capital_ledger");
    $balanceResult = $balanceStmt->fetch();
    $currentRunningBalance = $balanceResult && $balanceResult['total_cash'] !== null ? (float)$balanceResult['total_cash'] : 0.0;

    // 1.5) Get total count for pagination
    if ($typeFilter) {
        $countStmt = $pdo->prepare("SELECT COUNT(*) FROM capital_ledger WHERE transaction_type = :type");
        $countStmt->execute([':type' => $typeFilter]);
    } else {
        $countStmt = $pdo->query("SELECT COUNT(*) FROM capital_ledger");
    }
    $totalCount = (int)$countStmt->fetchColumn();

    // 2) Query the capital_ledger table for transaction history with pagination
    $query = "SELECT id, transaction_type, amount_ghs, reference_id, created_at 
              FROM capital_ledger ";
    
    if ($typeFilter) {
        $query .= "WHERE transaction_type = :type ";
    }
    
    $query .= "ORDER BY created_at DESC LIMIT :limit OFFSET :offset";

    $stmt = $pdo->prepare($query);
    
    // Bind parameters
    if ($typeFilter) {
        $stmt->bindValue(':type', $typeFilter, PDO::PARAM_STR);
    }
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
        'total_count' => $totalCount,
        'transactions' => $transactions
    ], 200);

} catch (\PDOException $e) {
    sendResponse('error', 'Database error occurred: ' . $e->getMessage(), [], 500);
}
