<?php
// api/customers/make_keeper.php

require_once '../../config/headers.php';
require_once '../../config/database.php';
require_once '../helpers/logger.php';

// Secure the endpoint by requiring the Auth Gatekeeper
require_once '../middleware/auth.php';

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

if (!isset($data['customer_id'])) {
    sendResponse('error', 'Missing required field: customer_id', [], 400);
}

$customerId = (int)$data['customer_id'];

if ($customerId <= 0) {
    sendResponse('error', 'Invalid customer_id', [], 400);
}

try {
    // Check if customer exists
    $checkStmt = $pdo->prepare("SELECT id, name, type FROM customers WHERE id = ?");
    $checkStmt->execute([$customerId]);
    $existing = $checkStmt->fetch();

    if (!$existing) {
        sendResponse('error', 'Customer not found', [], 404);
    }

    if ($existing['type'] === 'keeper') {
        sendResponse('error', 'Customer is already a keeper', [], 400);
    }

    // Update customer type
    $stmt = $pdo->prepare("UPDATE customers SET type = 'keeper' WHERE id = ?");
    $stmt->execute([$customerId]);
    
    log_activity($pdo, $current_user_id ?? null, 'MAKE_KEEPER', 'customers', $customerId, null, [
        'name' => $existing['name'], 
        'previous_type' => $existing['type']
    ]);
    
    sendResponse('success', 'Customer successfully upgraded to Keeper', [
        'customer_id' => $customerId,
        'name' => $existing['name']
    ], 200);

} catch (\PDOException $e) {
    error_log("System Error: " . $e->getMessage());
    sendResponse('error', 'A system error occurred while processing your request.', [], 500);
}
