<?php
// api/users/create.php
require_once '../../config/headers.php';
require_once '../../config/database.php';

// Secure the endpoint
require_once '../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse('error', 'Method not allowed', [], 405);
}

// Only admins can create new users
if ($current_user_role !== 'admin') {
    sendResponse('error', 'Unauthorized access', [], 403);
}

$jsonInput = file_get_contents('php://input');
$data = json_decode($jsonInput, true);

if (!$data || !isset($data['name']) || !isset($data['username']) || !isset($data['password']) || !isset($data['role'])) {
    sendResponse('error', 'Missing required fields', [], 400);
}

$name = trim($data['name']);
$username = trim($data['username']);
$password = $data['password'];
$role = $data['role'];

// Validate role
$allowedRoles = ['admin', 'staff', 'salesperson'];
if (!in_array($role, $allowedRoles)) {
    sendResponse('error', 'Invalid role selected', [], 400);
}

try {
    // Check if username already exists
    $checkStmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
    $checkStmt->execute([$username]);
    if ($checkStmt->fetch()) {
        sendResponse('error', 'Username is already taken', [], 400);
    }

    // Hash the password
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare("INSERT INTO users (name, username, password_hash, role, status) VALUES (?, ?, ?, ?, 'active')");
    $stmt->execute([$name, $username, $passwordHash, $role]);

    sendResponse('success', 'User registered successfully', ['id' => $pdo->lastInsertId()], 201);
} catch (\PDOException $e) {
    sendResponse('error', 'Database error: ' . $e->getMessage(), [], 500);
}
