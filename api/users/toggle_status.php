<?php
// api/users/toggle_status.php
require_once '../../config/headers.php';
require_once '../../config/database.php';

// Secure the endpoint
require_once '../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse('error', 'Method not allowed', [], 405);
}

// Only admins can change status
if ($current_user_role !== 'admin') {
    sendResponse('error', 'Unauthorized access', [], 403);
}

$jsonInput = file_get_contents('php://input');
$data = json_decode($jsonInput, true);

if (!$data || !isset($data['user_id'])) {
    sendResponse('error', 'Missing user_id', [], 400);
}

$userId = (int)$data['user_id'];

// Prevent an admin from deactivating themselves
if ($userId === $current_user_id) {
    sendResponse('error', 'You cannot deactivate your own account', [], 400);
}

try {
    // Get current status
    $stmt = $pdo->prepare("SELECT status FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    
    if (!$user) {
        sendResponse('error', 'User not found', [], 404);
    }
    
    $newStatus = $user['status'] === 'active' ? 'suspended' : 'active';
    
    $updateStmt = $pdo->prepare("UPDATE users SET status = ? WHERE id = ?");
    $updateStmt->execute([$newStatus, $userId]);
    
    sendResponse('success', 'User status updated to ' . $newStatus, ['new_status' => $newStatus], 200);
} catch (\PDOException $e) {
    error_log("System Error: " . $e->getMessage());
    sendResponse('error', 'A system error occurred while processing your request.', [], 500);
}
