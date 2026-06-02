<?php
require_once '../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse('error', 'Method not allowed', [], 405);
}

$jsonInput = file_get_contents('php://input');
$data = json_decode($jsonInput, true);

if (!isset($data['name']) || !isset($data['username'])) {
    sendResponse('error', 'Missing required fields: name and username', [], 400);
}

$name = trim($data['name']);
$username = trim($data['username']);

if (empty($name) || empty($username)) {
    sendResponse('error', 'Name and username cannot be empty', [], 400);
}

try {
    // Check if username is taken by someone else
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? AND id != ?");
    $stmt->execute([$username, $current_user_id]);
    if ($stmt->fetch()) {
        sendResponse('error', 'Username is already taken by another user', [], 400);
    }

    $updateStmt = $pdo->prepare("UPDATE users SET name = ?, username = ? WHERE id = ?");
    $updateStmt->execute([$name, $username, $current_user_id]);

    sendResponse('success', 'Profile updated successfully', [
        'user' => [
            'id' => $current_user_id,
            'name' => $name,
            'username' => $username,
            'role' => $current_user_role
        ]
    ]);
} catch (\PDOException $e) {
    sendResponse('error', 'Database error occurred', [], 500);
}
