<?php
require_once '../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse('error', 'Method not allowed', [], 405);
}

try {
    $stmt = $pdo->prepare("SELECT id, name, username, role, created_at FROM users WHERE id = ?");
    $stmt->execute([$current_user_id]);
    $user = $stmt->fetch();

    if (!$user) {
        sendResponse('error', 'User not found', [], 404);
    }

    sendResponse('success', 'User retrieved', [
        'user' => [
            'id' => (int)$user['id'],
            'name' => $user['name'],
            'username' => $user['username'],
            'role' => $user['role'],
            'created_at' => $user['created_at']
        ]
    ]);
} catch (\PDOException $e) {
    sendResponse('error', 'Database error', [], 500);
}
