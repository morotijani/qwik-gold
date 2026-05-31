<?php
// api/keepers/deposit.php

require_once '../../config/headers.php';
require_once '../../config/database.php';
require_once '../middleware/auth.php';
require_once '../helpers/logger.php';

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
if (!isset($data['customer_id']) || !isset($data['gold_type']) || !isset($data['weight_grams'])) {
    sendResponse('error', 'Missing required fields: customer_id, gold_type, and weight_grams', [], 400);
}

$customerId = (int)$data['customer_id'];
$goldType = strtolower($data['gold_type']);
$weightGrams = (float)$data['weight_grams'];
$volume = isset($data['volume']) && $data['volume'] !== '' ? (float)$data['volume'] : null;
$totalBlades = isset($data['total_blades']) && $data['total_blades'] !== '' ? (float)$data['total_blades'] : null;

// Validate specific values
if ($customerId <= 0) {
    sendResponse('error', 'Invalid customer_id', [], 400);
}

if ($goldType !== 'balls' && $goldType !== 'refined') {
    sendResponse('error', 'Invalid gold_type. Must be balls or refined', [], 400);
}

if ($weightGrams <= 0) {
    sendResponse('error', 'weight_grams must be greater than zero', [], 400);
}

try {
    // Insert new record into the gold_vault table
    $query = "INSERT INTO gold_vault (gold_type, ownership_status, weight_grams, volume, total_blades, current_location, customer_id) 
              VALUES (:gold_type, 'keeper_held', :weight_grams, :volume, :total_blades, 'office_vault', :customer_id)";
              
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':gold_type', $goldType);
    $stmt->bindParam(':weight_grams', $weightGrams);
    $stmt->bindParam(':volume', $volume);
    $stmt->bindParam(':total_blades', $totalBlades);
    $stmt->bindParam(':customer_id', $customerId);
    
    if ($stmt->execute()) {
        $insertedId = $pdo->lastInsertId();
        
        $responseData = [
            'vault_id' => $insertedId,
            'customer_id' => $customerId,
            'gold_type' => $goldType,
            'weight_grams' => $weightGrams,
            'volume' => $volume,
            'total_blades' => $totalBlades,
            'ownership_status' => 'keeper_held'
        ];
        
        $logPayload = [
            'grams' => $weightGrams, 
            'type' => $goldType,
            'volume' => $volume,
            'total_blades' => $totalBlades
        ];
        log_activity($pdo, $current_user_id ?? null, 'DEPOSIT_KEEPER', 'gold_vault', $insertedId, null, $logPayload);
        
        // Return JSON success response using the standard helper function
        sendResponse('success', 'Gold deposited successfully into the vault.', $responseData, 201);
    } else {
        sendResponse('error', 'Failed to deposit gold.', [], 500);
    }

} catch (\PDOException $e) {
    // Check for foreign key constraint violation (e.g., customer doesn't exist)
    if ($e->getCode() == 23000) {
         sendResponse('error', 'Invalid customer_id: Customer does not exist.', [], 400);
    }
    
    // Catch-all for other database errors
    // Note: In production, log the actual exception message securely rather than exposing it
    sendResponse('error', 'Database error occurred.', [], 500);
}
