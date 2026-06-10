<?php
// api/customers/create.php

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

// Validate base required fields
if (!isset($data['name']) || !isset($data['type'])) {
    sendResponse('error', 'Missing required fields: name, type', [], 400);
}

$name = trim($data['name']);
$type = strtolower(trim($data['type']));

// New optional fields
$businessName = isset($data['business_name']) ? trim($data['business_name']) : null;
$phone = isset($data['phone']) ? trim($data['phone']) : null;
$email = isset($data['email']) ? trim($data['email']) : null;
$address = isset($data['address']) ? trim($data['address']) : null;
$entityType = isset($data['entity_type']) ? trim($data['entity_type']) : 'individual';

if (empty($name)) {
    sendResponse('error', 'Customer name cannot be empty', [], 400);
}
if (empty($phone)) {
    sendResponse('error', 'Phone number is required', [], 400);
}

if ($type !== 'individual' && $type !== 'group' && $type !== 'keeper') {
    sendResponse('error', 'Invalid type. Must be either "individual", "group", or "keeper"', [], 400);
}

try {
    // Insert new customer
    $stmt = $pdo->prepare("INSERT INTO customers (name, business_name, type, entity_type, phone, email, address, handler_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$name, $businessName, $type, $entityType, $phone, $email, $address, $current_user_id ?? null]);
    
    $customerId = $pdo->lastInsertId();

    $customerUid = 'CUST-' . str_pad($customerId, 6, '0', STR_PAD_LEFT);
    $updateUidStmt = $pdo->prepare("UPDATE customers SET customer_uid = ? WHERE id = ?");
    $updateUidStmt->execute([$customerUid, $customerId]);

    
    log_activity($pdo, $current_user_id ?? null, 'CREATE_CUSTOMER', 'customers', $customerId, null, ['name' => $name, 'type' => $type, 'entity' => $entityType, 'customer_uid' => $customerUid]);
    sendResponse('success', 'Customer registered successfully', [
        'customer_id' => (int)$customerId,
        'customer_uid' => $customerUid,
        'name' => $name,
        'business_name' => $businessName,
        'type' => $type,
        'entity_type' => $entityType,
        'phone' => $phone,
        'email' => $email,
        'address' => $address
    ], 201);

} catch (\PDOException $e) {
    sendResponse('error', 'Failed to register customer: ' . $e->getMessage(), [], 500);
}
