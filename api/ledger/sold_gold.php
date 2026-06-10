<?php
// api/ledger/sold_gold.php

require_once '../../config/headers.php';
require_once '../../config/database.php';
require_once '../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse('error', 'Method not allowed', [], 405);
}

$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 15;
$offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

if ($limit <= 0) $limit = 15;
if ($offset < 0) $offset = 0;

try {
    // Total count for pagination
    $countStmt = $pdo->query("SELECT COUNT(*) FROM market_sales");
    $totalCount = (int)$countStmt->fetchColumn();

    // Query sales
    $stmt = $pdo->prepare("
        SELECT ms.*, u.username as handler_name 
        FROM market_sales ms
        LEFT JOIN users u ON ms.handler_id = u.id
        ORDER BY ms.created_at DESC 
        LIMIT :limit OFFSET :offset
    ");
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    
    $sales = $stmt->fetchAll(PDO::FETCH_ASSOC);

    sendResponse('success', 'Sold gold retrieved', [
        'total_count' => $totalCount,
        'sales' => $sales
    ], 200);

} catch (\PDOException $e) {
    error_log("System Error: " . $e->getMessage());
    sendResponse('error', 'A system error occurred while processing your request.', [], 500);
}
