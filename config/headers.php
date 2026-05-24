<?php
// config/headers.php

// Set standard REST API headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS"); // Added OPTIONS for CORS preflight
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight OPTIONS requests directly
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

/**
 * Standard JSON response function to keep all API outputs consistent.
 *
 * @param string|bool $status  Typically 'success' or 'error', or a boolean
 * @param string      $message A descriptive message about the response
 * @param array       $data    Optional data payload to return
 * @param int         $httpCode The HTTP status code (default: 200)
 */
function sendResponse($status, $message, $data = [], $httpCode = 200) {
    http_response_code($httpCode);
    
    $response = [
        'status'  => $status,
        'message' => $message
    ];
    
    if (!empty($data)) {
        $response['data'] = $data;
    }
    
    echo json_encode($response);
    exit();
}
