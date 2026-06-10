<?php
// api/users/list.php
require_once '../../config/headers.php';
require_once '../../config/database.php';

// Secure the endpoint
require_once '../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse('error', 'Method not allowed', [], 405);
}

// Only admins can view the user list
if ($current_user_role !== 'admin') {
    sendResponse('error', 'Unauthorized access', [], 403);
}

try {
    $stmt = $pdo->query("SELECT id, name, username, role, status, created_at FROM users ORDER BY created_at DESC");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    sendResponse('success', 'Users retrieved successfully', $users, 200);
} catch (\PDOException $e) {
    sendResponse('error', 'Database error: ' . $e->getMessage(), [], 500);
}
