<?php
// api/keepers/balance.php

require_once '../../config/headers.php';
require_once '../../config/database.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse('error', 'Method not allowed. Use GET.', [], 405);
}

// Validate that customer_id is provided
if (!isset($_GET['customer_id'])) {
    sendResponse('error', 'Missing required parameter: customer_id', [], 400);
}

$customerId = (int)$_GET['customer_id'];

if ($customerId <= 0) {
    sendResponse('error', 'Invalid customer_id', [], 400);
}

try {
    // Query to sum weight_grams, volume, and total_blades grouped by gold_type for a specific keeper
    $query = "SELECT gold_type, SUM(weight_grams) as total_grams, SUM(volume) as total_volume, SUM(total_blades) as total_blades 
              FROM gold_vault 
              WHERE customer_id = :customer_id 
                AND ownership_status = 'keeper_held' 
              GROUP BY gold_type";
              
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':customer_id', $customerId, PDO::PARAM_INT);
    $stmt->execute();
    
    $results = $stmt->fetchAll();
    
    // Default balances to 0
    $vault_totals = [
        'balls_grams' => 0.0,
        'balls_blades' => 0.0,
        'refined_grams' => 0.0,
        'refined_volume' => 0.0
    ];
    
    // Map database results to the balances array
    foreach ($results as $row) {
        $type = $row['gold_type'];
        if ($type === 'balls') {
            $vault_totals['balls_grams'] = (float)$row['total_grams'];
            $vault_totals['balls_blades'] = (float)$row['total_blades'];
        } else if ($type === 'refined') {
            $vault_totals['refined_grams'] = (float)$row['total_grams'];
            $vault_totals['refined_volume'] = (float)$row['total_volume'];
        }
    }
    
    $responseData = [
        'customer_id' => $customerId,
        'vault_totals' => $vault_totals
    ];
    
    sendResponse('success', 'Keeper balance retrieved', $responseData, 200);

} catch (\PDOException $e) {
    // In production, log the actual exception securely
    sendResponse('error', 'Database error occurred while fetching balance.', [], 500);
}
