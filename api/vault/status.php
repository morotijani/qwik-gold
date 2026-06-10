<?php
// api/vault/status.php

require_once '../../config/headers.php';
require_once '../../config/database.php';

// Secure the endpoint by requiring the Auth Gatekeeper
require_once '../middleware/auth.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse('error', 'Method not allowed. Use GET.', [], 405);
}

try {
    // Query to SUM weight_grams and group by type and ownership
    // Strictly filtering out 'sold_main_market' by ensuring current_location is 'office_vault'
    $stmt = $pdo->query("
        SELECT ownership_status, gold_type, SUM(weight_grams) as total_grams 
        FROM gold_vault 
        WHERE current_location = 'office_vault' 
        GROUP BY ownership_status, gold_type
    ");
    
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Initialize structured output perfectly matching the requested JSON format
    $data = [
        'company_owned' => [
            'balls_grams' => 0.0,
            'refined_grams' => 0.0
        ],
        'keeper_held' => [
            'balls_grams' => 0.0,
            'refined_grams' => 0.0
        ],
        'total_physical_grams_in_safe' => 0.0
    ];

    // Populate the data dynamically from the aggregated query
    foreach ($results as $row) {
        $owner = $row['ownership_status']; // 'company_owned' or 'keeper_held'
        $type = $row['gold_type'] . '_grams'; // 'balls' -> 'balls_grams', 'refined' -> 'refined_grams'
        $grams = (float)$row['total_grams'];
        
        if (isset($data[$owner][$type])) {
            $data[$owner][$type] = $grams;
            $data['total_physical_grams_in_safe'] += $grams;
        }
    }

    sendResponse('success', 'Vault status retrieved', $data, 200);

} catch (\PDOException $e) {
    error_log("System Error: " . $e->getMessage());
    sendResponse('error', 'A system error occurred while processing your request.', [], 500);
}
