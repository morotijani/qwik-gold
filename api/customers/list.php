<?php
// api/customers/list.php

require_once '../../config/headers.php';
require_once '../../config/database.php';

// Secure the endpoint by requiring the Auth Gatekeeper
require_once '../middleware/auth.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse('error', 'Method not allowed. Use GET.', [], 405);
}

try {
    // Query the customers table, ordered alphabetically by name
    $stmt = $pdo->query("SELECT id, customer_uid, name, business_name, type, entity_type, phone, email, address FROM customers ORDER BY name ASC");
    $customers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    sendResponse('success', 'Customers retrieved successfully', $customers, 200);

} catch (\PDOException $e) {
    sendResponse('error', 'Failed to retrieve customers: ' . $e->getMessage(), [], 500);
}
