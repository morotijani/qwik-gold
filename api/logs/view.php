<?php
// api/logs/view.php

require_once '../../config/headers.php';
require_once '../../config/database.php';

// Secure the endpoint by requiring the Auth Gatekeeper
require_once '../middleware/auth.php';

// Ensure only admins can view the master audit trail
global $current_user_role;
if ($current_user_role !== 'admin') {
    sendResponse('error', 'Unauthorized: Admin access required', [], 403);
}

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse('error', 'Method not allowed. Use GET.', [], 405);
}

// Extract optional filtering and pagination parameters
$userIdFilter = isset($_GET['user_id']) && $_GET['user_id'] !== '' ? (int)$_GET['user_id'] : null;
$actionFilter = isset($_GET['action']) && $_GET['action'] !== '' ? trim($_GET['action']) : null;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
$offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

if ($limit <= 0) $limit = 100;
if ($offset < 0) $offset = 0;

try {
    // 1) Build the dynamic SELECT query
    // We use a LEFT JOIN just in case the user was deleted (due to our ON DELETE SET NULL constraint)
    $query = "
        SELECT 
            a.id, 
            u.name AS staff_name, 
            a.action, 
            a.table_affected, 
            a.record_id, 
            a.old_data, 
            a.new_data, 
            a.ip_address, 
            a.created_at
        FROM audit_logs a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE 1=1
    ";
    
    $params = [];
    
    // Apply filters securely if provided
    if ($userIdFilter !== null) {
        $query .= " AND a.user_id = ?";
        $params[] = $userIdFilter;
    }
    
    if ($actionFilter !== null) {
        $query .= " AND a.action = ?";
        $params[] = $actionFilter;
    }
    
    // Finalize pagination
    $query .= " ORDER BY a.created_at DESC LIMIT " . (int)$limit . " OFFSET " . (int)$offset;

    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 2) Map the results perfectly to the expected JSON schema
    $logs = [];
    foreach ($results as $row) {
        $logs[] = [
            'id' => (int)$row['id'],
            'staff_name' => $row['staff_name'] ?? 'System / Deleted User',
            'action' => $row['action'],
            'table_affected' => $row['table_affected'],
            'record_id' => (int)$row['record_id'],
            // Dynamically decode the JSON payloads so they render as native JSON objects, not strings
            'old_data' => $row['old_data'] ? json_decode($row['old_data'], true) : null,
            'new_data' => $row['new_data'] ? json_decode($row['new_data'], true) : null,
            'ip_address' => $row['ip_address'],
            'timestamp' => $row['created_at']
        ];
    }

    sendResponse('success', 'Audit logs retrieved', [
        'logs' => $logs
    ], 200);

} catch (\PDOException $e) {
    sendResponse('error', 'Database error occurred: ' . $e->getMessage(), [], 500);
}
