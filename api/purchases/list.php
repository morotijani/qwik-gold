<?php
// api/purchases/list.php

require_once '../../config/headers.php';
require_once '../../config/database.php';
require_once '../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse('error', 'Method not allowed', [], 405);
}

try {
    $stmt = $pdo->query("
        SELECT 
            p.id, 
            p.transaction_ref,
            p.gold_type, 
            p.weight_grams, 
            p.total_paid_ghs, 
            p.local_price,
            p.density,
            p.karat,
            p.pounds,
            p.total_blades,
            p.notes, 
            p.created_at,
            c.name as customer_name
        FROM gold_purchases p
        LEFT JOIN customers c ON p.customer_id = c.id
        WHERE p.origin = 'walk_in'
        ORDER BY p.created_at DESC
    ");
    
    $purchases = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format output
    foreach ($purchases as &$p) {
        if (!empty($p['customer_name'])) {
            $p['seller_display'] = $p['customer_name'] . ' (Registered)';
        } elseif (!empty($p['notes'])) {
            $p['seller_display'] = $p['notes'] . ' (Walk-In)';
        } else {
            $p['seller_display'] = 'Unknown Walk-In';
        }
    }

    sendResponse('success', 'Purchases retrieved successfully', $purchases, 200);
} catch (Exception $e) {
    sendResponse('error', 'Failed to fetch purchases: ' . $e->getMessage(), [], 500);
}
