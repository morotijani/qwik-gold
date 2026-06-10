<?php
// api/capital/balance.php

require_once '../../config/headers.php';
require_once '../../config/database.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse('error', 'Method not allowed. Use GET.', [], 405);
}

try {
    // Run a query to SUM all transactions (both positive injections and negative deductions)
    $stmt = $pdo->query("SELECT SUM(amount_ghs) AS total_cash FROM capital_ledger");
    $result = $stmt->fetch();
    
    // Default to 0.0 if the ledger is completely empty
    $totalCash = $result && $result['total_cash'] !== null ? (float)$result['total_cash'] : 0.0;

    sendResponse('success', 'Office capital balance retrieved', [
        'available_cash_ghs' => round($totalCash, 2)
    ], 200);

} catch (\PDOException $e) {
    error_log("System Error: " . $e->getMessage());
    sendResponse('error', 'A system error occurred while processing your request.', [], 500);
}
