<?php
// api/expenses/list.php

require_once '../../config/headers.php';
require_once '../../config/database.php';

// Secure the endpoint by requiring the Auth Gatekeeper
require_once '../middleware/auth.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse('error', 'Method not allowed. Use GET.', [], 405);
}

try {
    // 1) Fetch all expenses ordered by date/created_at
    $stmt = $pdo->query("SELECT id, description, amount, date, created_at FROM expenses ORDER BY date DESC, created_at DESC");
    $expenses = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 2) Calculate total lifetime expenses
    $totalStmt = $pdo->query("SELECT SUM(amount) AS total_amount FROM expenses");
    $totalResult = $totalStmt->fetch();
    $totalLifetime = $totalResult['total_amount'] !== null ? (float)$totalResult['total_amount'] : 0.0;

    // 3) Calculate total expenses for the current month
    $monthStmt = $pdo->query("
        SELECT SUM(amount) AS total_month 
        FROM expenses 
        WHERE YEAR(date) = YEAR(CURRENT_DATE()) AND MONTH(date) = MONTH(CURRENT_DATE())
    ");
    $monthResult = $monthStmt->fetch();
    $totalThisMonth = $monthResult['total_month'] !== null ? (float)$monthResult['total_month'] : 0.0;

    // 4) Calculate total expenses for today
    $todayStmt = $pdo->query("
        SELECT SUM(amount) AS total_today 
        FROM expenses 
        WHERE date = CURRENT_DATE()
    ");
    $todayResult = $todayStmt->fetch();
    $totalToday = $todayResult['total_today'] !== null ? (float)$todayResult['total_today'] : 0.0;

    // 4) Format the results
    $formattedExpenses = [];
    foreach ($expenses as $row) {
        $formattedExpenses[] = [
            'id' => (int)$row['id'],
            'description' => $row['description'],
            'amount_ghs' => (float)$row['amount'],
            'date' => $row['date'],
            'created_at' => $row['created_at']
        ];
    }

    sendResponse('success', 'Expenses retrieved successfully', [
        'total_lifetime_ghs' => $totalLifetime,
        'total_month_ghs' => $totalThisMonth,
        'total_today_ghs' => $totalToday,
        'expenses' => $formattedExpenses
    ], 200);

} catch (\PDOException $e) {
    sendResponse('error', 'Database error occurred: ' . $e->getMessage(), [], 500);
}
