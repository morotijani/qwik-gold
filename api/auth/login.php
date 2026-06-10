<?php
// api/auth/login.php

require_once '../../config/headers.php';
require_once '../../config/database.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse('error', 'Method not allowed', [], 405);
}

// Get the JSON payload
$jsonInput = file_get_contents('php://input');
$data = json_decode($jsonInput, true);

if (!$data) {
    sendResponse('error', 'Invalid JSON payload', [], 400);
}

// Validate base required fields
if (!isset($data['username']) || !isset($data['password'])) {
    sendResponse('error', 'Missing required fields: username and password', [], 400);
}

$username = trim($data['username']);
$password = $data['password'];

try {
    // 1) Query the users table for the username
    $stmt = $pdo->prepare("SELECT id, name, username, password_hash, role, status FROM users WHERE username = ? LIMIT 1");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    // 2) Verify user exists, password matches, and user is active
    if ($user && password_verify($password, $user['password_hash'])) {
        
        if ($user['status'] === 'suspended') {
            sendResponse('error', 'Your account has been suspended. Contact an administrator.', [], 403);
        }
        
        // 3) Generate secure 64-character token
        $token = bin2hex(random_bytes(32));
        
        // 4) Insert token into api_tokens, expiring 24 hours from now
        $expiresAt = date('Y-m-d H:i:s', strtotime('+24 hours'));
        
        $insertStmt = $pdo->prepare("INSERT INTO api_tokens (user_id, token, expires_at) VALUES (?, ?, ?)");
        $insertStmt->execute([$user['id'], $token, $expiresAt]);
        
        // 5) Return structured success response
        sendResponse('success', 'Login successful', [
            'token' => $token,
            'user' => [
                'id' => (int)$user['id'],
                'name' => $user['name'],
                'role' => $user['role']
            ]
        ], 200);

    } else {
        // Return standard 401 Unauthorized for invalid credentials
        sendResponse('error', 'Invalid username or password', [], 401);
    }

} catch (\PDOException $e) {
    error_log("System Error: " . $e->getMessage());
    sendResponse('error', 'A system error occurred while processing your request.', [], 500);
} catch (\Exception $e) {
    sendResponse('error', 'An unexpected error occurred', [], 500);
}
