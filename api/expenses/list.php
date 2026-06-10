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
    $limit = isset($_GET['limit']) ? max(1, (int)$_GET['limit']) : 50;
    $offset = isset($_GET['offset']) ? max(0, (int)$_GET['offset']) : 0;
    
    // 1) Fetch total count and expenses based on filter
    if ($statusFilter === 'all') {
        $countStmt = $pdo->query("SELECT COUNT(*) FROM expenses");
        $totalCount = (int)$countStmt->fetchColumn();

        $stmt = $pdo->prepare("SELECT e.id, e.description, e.amount, e.date, e.created_at, e.status, u.username as handler_name 
                               FROM expenses e 
                               LEFT JOIN users u ON e.handler_id = u.id 
                               ORDER BY e.date DESC, e.created_at DESC LIMIT :limit OFFSET :offset");
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
    } else {
        $validStatus = $statusFilter === 'voided' ? 'voided' : 'active';
        
        $countStmt = $pdo->prepare("SELECT COUNT(*) FROM expenses WHERE status = ?");
        $countStmt->execute([$validStatus]);
        $totalCount = (int)$countStmt->fetchColumn();

        $stmt = $pdo->prepare("SELECT e.id, e.description, e.amount, e.date, e.created_at, e.status, u.username as handler_name 
                               FROM expenses e 
                               LEFT JOIN users u ON e.handler_id = u.id 
                               WHERE e.status = :status 
                               ORDER BY e.date DESC, e.created_at DESC LIMIT :limit OFFSET :offset");
        $stmt->bindValue(':status', $validStatus, PDO::PARAM_STR);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
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
            'status' => $row['status'],
            'handler_name' => $row['handler_name'] ? $row['handler_name'] : 'System'
        ];
    }

    sendResponse('success', 'Expenses retrieved successfully', [
        'total_count' => $totalCount,
        'total_lifetime_ghs' => $totalLifetime,
        'total_month_ghs' => $totalThisMonth,
        'total_today_ghs' => $totalToday,
        'expenses' => $formattedExpenses
    ], 200);

} catch (\PDOException $e) {
    error_log("System Error: " . $e->getMessage());
    sendResponse('error', 'A system error occurred while processing your request.', [], 500);
}
