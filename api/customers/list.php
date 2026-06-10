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
    $stmt = $pdo->query("
        SELECT c.id, c.customer_uid, c.name, c.business_name, c.type, c.entity_type, c.phone, c.email, c.address, u.username as handler_name 
        FROM customers c
        LEFT JOIN users u ON c.handler_id = u.id
        ORDER BY c.name ASC
    ");
    $customers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    sendResponse('success', 'Customers retrieved successfully', $customers, 200);

} catch (\PDOException $e) {
    error_log("System Error: " . $e->getMessage());
    sendResponse('error', 'A system error occurred while processing your request.', [], 500);
}
