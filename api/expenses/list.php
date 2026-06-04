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
    $statusFilter = isset($_GET['status']) ? $_GET['status'] : 'active';
    
    // 1) Fetch expenses based on filter
    if ($statusFilter === 'all') {
        $stmt = $pdo->query("SELECT id, description, amount, date, created_at, status FROM expenses ORDER BY date DESC, created_at DESC");
    } else {
        $validStatus = $statusFilter === 'voided' ? 'voided' : 'active';
        $stmt = $pdo->prepare("SELECT id, description, amount, date, created_at, status FROM expenses WHERE status = ? ORDER BY date DESC, created_at DESC");
        $stmt->execute([$validStatus]);
    }
    
    $expenses = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 2) Calculate total lifetime expenses (only active)
    $totalStmt = $pdo->query("SELECT SUM(amount) AS total_amount FROM expenses WHERE status = 'active'");
    $totalResult = $totalStmt->fetch();
    $totalLifetime = $totalResult['total_amount'] !== null ? (float)$totalResult['total_amount'] : 0.0;

    // 3) Calculate total expenses for the current month
    $monthStmt = $pdo->query("
        SELECT SUM(amount) AS total_month 
        FROM expenses 
        WHERE status = 'active' AND YEAR(date) = YEAR(CURRENT_DATE()) AND MONTH(date) = MONTH(CURRENT_DATE())
    ");
    $monthResult = $monthStmt->fetch();
    $totalThisMonth = $monthResult['total_month'] !== null ? (float)$monthResult['total_month'] : 0.0;

    // 4) Calculate total expenses for today
    $todayStmt = $pdo->query("
        SELECT SUM(amount) AS total_today 
        FROM expenses 
        WHERE status = 'active' AND date = CURRENT_DATE()
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
            'created_at' => $row['created_at'],
            'status' => $row['status']
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
