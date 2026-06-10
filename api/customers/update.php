<?php
// api/customers/update.php

require_once '../../config/headers.php';
require_once '../../config/database.php';
require_once '../helpers/logger.php';

// Secure the endpoint by requiring the Auth Gatekeeper
require_once '../middleware/auth.php';

// Only allow POST or PUT requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'PUT') {
    sendResponse('error', 'Method not allowed', [], 405);
}

// Get the JSON payload
$jsonInput = file_get_contents('php://input');
$data = json_decode($jsonInput, true);

if (!$data) {
    sendResponse('error', 'Invalid JSON payload', [], 400);
}

// Validate required fields
if (!isset($data['id']) || !isset($data['name'])) {
    sendResponse('error', 'Missing required fields: id, name', [], 400);
}

$id = (int)$data['id'];
$name = trim($data['name']);
$businessName = isset($data['business_name']) ? trim($data['business_name']) : null;
$phone = isset($data['phone']) ? trim($data['phone']) : null;
$email = isset($data['email']) ? trim($data['email']) : null;
$address = isset($data['address']) ? trim($data['address']) : null;
$entityType = isset($data['entity_type']) ? trim($data['entity_type']) : 'individual';

if ($id <= 0) {
    sendResponse('error', 'Invalid customer ID', [], 400);
}
if (empty($name)) {
    sendResponse('error', 'Customer name cannot be empty', [], 400);
}
if (empty($phone)) {
    sendResponse('error', 'Phone number is required', [], 400);
}

try {
    // Check if customer exists
    $checkStmt = $pdo->prepare("SELECT id, type FROM customers WHERE id = ?");
    $checkStmt->execute([$id]);
    $existing = $checkStmt->fetch();

    if (!$existing) {
        sendResponse('error', 'Customer not found', [], 404);
    }

    // Update customer
    $stmt = $pdo->prepare("UPDATE customers SET name = ?, business_name = ?, entity_type = ?, phone = ?, email = ?, address = ? WHERE id = ?");
    $stmt->execute([$name, $businessName, $entityType, $phone, $email, $address, $id]);
    
    log_activity($pdo, $current_user_id ?? null, 'UPDATE_CUSTOMER', 'customers', $id, null, [
        'name' => $name, 
        'business_name' => $businessName, 
        'entity' => $entityType
    ]);
    
    sendResponse('success', 'Customer details updated successfully', [
        'id' => $id,
        'name' => $name,
        'business_name' => $businessName,
        'entity_type' => $entityType,
        'phone' => $phone,
        'email' => $email,
        'address' => $address
    ], 200);

} catch (\PDOException $e) {
    error_log("System Error: " . $e->getMessage());
    sendResponse('error', 'A system error occurred while processing your request.', [], 500);
}
