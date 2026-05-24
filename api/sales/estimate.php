<?php
// api/sales/estimate.php

require_once '../../config/headers.php';
require_once '../../config/database.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse('error', 'Method not allowed. Use GET.', [], 405);
}

// Validate inputs
if (!isset($_GET['market_price_blade']) || !isset($_GET['market_price_pound'])) {
    sendResponse('error', 'Missing required parameters: market_price_blade, market_price_pound', [], 400);
}

$marketPriceBlade = (float)$_GET['market_price_blade'];
$marketPricePound = (float)$_GET['market_price_pound'];

if ($marketPriceBlade <= 0 || $marketPricePound <= 0) {
    sendResponse('error', 'Market prices must be greater than zero.', [], 400);
}

try {
    // Efficient single query using conditional aggregation to get sums for both gold types
    $query = "SELECT 
                SUM(CASE WHEN gold_type = 'balls' THEN weight_grams ELSE 0 END) AS balls_grams,
                SUM(CASE WHEN gold_type = 'refined' THEN weight_grams ELSE 0 END) AS refined_grams
              FROM gold_vault 
              WHERE ownership_status = 'company_owned'";
              
    $stmt = $pdo->query($query);
    $result = $stmt->fetch();
    
    $ballsTotalGrams = $result ? (float)$result['balls_grams'] : 0.0;
    $refinedTotalGrams = $result ? (float)$result['refined_grams'] : 0.0;
    
    // Core Math Calculations
    // 1 blade = 0.8g
    $ballsEstimatedBlades = $ballsTotalGrams / 0.8;
    $ballsExpectedRevenue = $ballsEstimatedBlades * $marketPriceBlade;
    
    // 1 pound = 8g
    $refinedEstimatedPounds = $refinedTotalGrams / 8;
    $refinedExpectedRevenue = $refinedEstimatedPounds * $marketPricePound;
    
    // Grand Total
    $grandTotalExpected = $ballsExpectedRevenue + $refinedExpectedRevenue;
    
    // Build Structured JSON Response
    $responseData = [
        'inventory' => [
            'balls_total_grams' => round($ballsTotalGrams, 4),
            'refined_total_grams' => round($refinedTotalGrams, 4)
        ],
        'forecast' => [
            'balls_estimated_blades' => round($ballsEstimatedBlades, 4),
            'balls_expected_revenue_ghs' => round($ballsExpectedRevenue, 2),
            'refined_estimated_pounds' => round($refinedEstimatedPounds, 4),
            'refined_expected_revenue_ghs' => round($refinedExpectedRevenue, 2)
        ],
        'grand_total_expected_ghs' => round($grandTotalExpected, 2)
    ];

    sendResponse('success', 'Out sales estimation complete', $responseData, 200);

} catch (\PDOException $e) {
    // Output error response
    sendResponse('error', 'Database error occurred while forecasting: ' . $e->getMessage(), [], 500);
}
