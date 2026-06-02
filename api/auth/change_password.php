<?php
require_once '../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse('error', 'Method not allowed', [], 405);
}

$jsonInput = file_get_contents('php://input');
$data = json_decode($jsonInput, true);

if (!isset($data['current_password']) || !isset($data['new_password'])) {
    sendResponse('error', 'Missing required fields', [], 400);
}

$current_password = $data['current_password'];
$new_password = $data['new_password'];

if (strlen($new_password) < 6) {
    sendResponse('error', 'New password must be at least 6 characters long', [], 400);
}

try {
    $stmt = $pdo->prepare("SELECT password_hash FROM users WHERE id = ?");
    $stmt->execute([$current_user_id]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($current_password, $user['password_hash'])) {
        sendResponse('error', 'Incorrect current password', [], 400);
    }

    if (password_verify($new_password, $user['password_hash'])) {
        sendResponse('error', 'New password cannot be the same as the current password', [], 400);
    }

    $new_hash = password_hash($new_password, PASSWORD_DEFAULT);
    
    $updateStmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
    $updateStmt->execute([$new_hash, $current_user_id]);

    sendResponse('success', 'Password changed successfully', []);
} catch (\PDOException $e) {
    sendResponse('error', 'Database error occurred', [], 500);
}
