<?php
// api/sales/calculate.php

// Include the headers and standard response helper
require_once '../../config/headers.php';

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
    
    // Calculations for refined gold
    $truncate2 = function($num) {
        return floor($num * 100) / 100;
    };
    
    $density = 0;
    if ($volume > 0) {
        $density = $truncate2($grams / $volume);
    }
    
    $pounds = $truncate2($grams / 7.75);
    
    $karat = 0;
    if ($density > 0) {
        $karat = $truncate2((($density - 10.51) * 52.838) / $density);
    }
    
    $totalPayout = ($karat * $pricePerPound / 23) * $pounds;
    
    $responseData['breakdown'] = [
        'density' => $density,
        'karat' => $karat,
        'pounds' => $pounds
    ];
    $responseData['total_payout_ghs'] = $totalPayout;

} else {
    sendResponse('error', 'Invalid gold_type. Must be balls or refined', [], 400);
}

// Return the successful response using the standard helper
sendResponse('success', 'Calculation complete', $responseData, 200);
