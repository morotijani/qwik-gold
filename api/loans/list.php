<?php
// api/loans/list.php

require_once '../../config/headers.php';
require_once '../../config/database.php';
require_once '../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse('error', 'Method not allowed', [], 405);
}

try {
    $stmt = $pdo->prepare("
        SELECT 
            l.id, l.customer_id, l.principal_amount, l.type, l.status, l.created_at,
            c.name as customer_name, c.contact_info
        FROM loans l
        JOIN customers c ON l.customer_id = c.id
        ORDER BY l.status ASC, l.created_at DESC
    ");
    $stmt->execute();
    $loans = $stmt->fetchAll();

    sendResponse('success', 'Loans retrieved successfully', $loans, 200);

} catch (\Exception $e) {
    sendResponse('error', 'Failed to retrieve loans: ' . $e->getMessage(), [], 500);
}
