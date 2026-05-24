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
// contact_info is optional
$contactInfo = isset($data['contact_info']) ? trim($data['contact_info']) : null;

if (empty($name)) {
    sendResponse('error', 'Customer name cannot be empty', [], 400);
}

if ($type !== 'individual' && $type !== 'group') {
    sendResponse('error', 'Invalid type. Must be either "individual" or "group"', [], 400);
}

try {
    // Insert new customer
    $stmt = $pdo->prepare("INSERT INTO customers (name, type, contact_info) VALUES (?, ?, ?)");
    $stmt->execute([$name, $type, $contactInfo]);
    
    $customerId = $pdo->lastInsertId();

    
    log_activity($pdo, $current_user_id ?? null, 'CREATE_CUSTOMER', 'customers', $customerId, null, ['name' => $name, 'type' => $type]);
    sendResponse('success', 'Customer registered successfully', [
        'customer_id' => (int)$customerId,
        'name' => $name,
        'type' => $type,
        'contact_info' => $contactInfo
    ], 201);

} catch (\PDOException $e) {
    sendResponse('error', 'Failed to register customer: ' . $e->getMessage(), [], 500);
}
