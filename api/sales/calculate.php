<?php
// api/sales/calculate.php

// Include the headers and standard response helper
require_once '../../config/headers.php';
require_once '../../config/database.php';
require_once '../helpers/settings.php';

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
if (!isset($data['gold_type']) || !isset($data['grams'])) {
    sendResponse('error', 'Missing required fields: gold_type and grams', [], 400);
}

$goldType = strtolower($data['gold_type']);
$grams = (float)$data['grams'];

if ($grams <= 0) {
    sendResponse('error', 'Grams must be greater than zero', [], 400);
}

$responseData = [
    'input_grams' => $grams,
    'breakdown' => [],
];

if ($goldType === 'balls') {
    // Validate fields specific to "balls"
    if (!isset($data['price_per_blade'])) {
        sendResponse('error', 'Missing required field: price_per_blade for balls', [], 400);
    }
    $pricePerBlade = (float)$data['price_per_blade'];
    
    // 1 blade = 0.8g, 1 match = 0.08g, 1 pound = 8g
    $totalBlades = $grams / 0.8;
    $totalPayout = $totalBlades * $pricePerBlade;
    
    // Breakdown calculations
    $pounds = floor($totalBlades / 10);
    $remainingBladesAfterPounds = $totalBlades - ($pounds * 10);
    $blades = floor($remainingBladesAfterPounds);
    
    // Remaining matches based on leftover grams
    $accountedGrams = ($pounds * 8) + ($blades * 0.8);
    $remainingGrams = $grams - $accountedGrams;
    // Using round to avoid minor floating-point precision issues in PHP
    $matches = (int)round($remainingGrams / 0.08); 
    
    $responseData['breakdown'] = [
        'pounds' => $pounds,
        'blades' => $blades,
        'matches' => $matches
    ];
    $responseData['total_blades'] = $totalBlades;
    $responseData['total_payout_ghs'] = $totalPayout;

} elseif ($goldType === 'refined') {
    // Validate fields specific to "refined"
    if (!isset($data['volume']) || !isset($data['price_per_pound'])) {
        sendResponse('error', 'Missing required fields: volume and price_per_pound for refined', [], 400);
    }
    $volume = (float)$data['volume'];
    $pricePerPound = (float)$data['price_per_pound'];
    
    if ($volume <= 0) {
        sendResponse('error', 'Volume must be greater than zero', [], 400);
    }
    
    $discountPercent = isset($data['discount_percent']) ? (float)$data['discount_percent'] : null;
    $formula = isset($data['formula']) ? (string)$data['formula'] : null;
    $calc = calculate_refined_gold($pdo, $grams, $volume, $pricePerPound, $discountPercent, $formula);

    $responseData['breakdown'] = [
        'formula' => $calc['formula'],
        'density' => $calc['density'],
        'pounds' => $calc['pounds'],
        'raw_karat' => $calc['raw_karat'],
        'raw_purity' => $calc['raw_purity'],
        'payable_karat' => $calc['payable_karat'],
        'karat' => $calc['payable_karat'],
        'purity_percent' => $calc['purity_percent'],
        'adjusted_price_per_pound' => $calc['adjusted_price_per_pound'],
        'gross_payout' => $calc['gross_payout'],
        'discount_saved' => $calc['discount_saved'],
        'discount_percent' => $calc['discount_percent']
    ];
    $responseData['total_payout_ghs'] = $calc['total_payout'];

} else {
    sendResponse('error', 'Invalid gold_type. Must be balls or refined', [], 400);
}

// Return the successful response using the standard helper
sendResponse('success', 'Calculation complete', $responseData, 200);
