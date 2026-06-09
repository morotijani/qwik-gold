<?php
// api/middleware/auth.php

// Ensure standard response helper and DB connection are available
// Using dirname(__DIR__, 2) to correctly traverse back to the root config directory
require_once dirname(__DIR__, 2) . '/config/headers.php';
require_once dirname(__DIR__, 2) . '/config/database.php';

/**
 * Helper function to extract the Bearer token from the incoming HTTP headers.
 */
function getBearerTokenAuth() {
    $headers = null;
    if (isset($_SERVER['Authorization'])) {
        $headers = trim($_SERVER["Authorization"]);
    } else if (isset($_SERVER['HTTP_AUTHORIZATION'])) { 
        $headers = trim($_SERVER["HTTP_AUTHORIZATION"]);
    } elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
        if (isset($requestHeaders['Authorization'])) {
            $headers = trim($requestHeaders['Authorization']);
        }
    }
    
    if (!empty($headers)) {
        if (preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
            return $matches[1];
        }
    }
    return null;
}

// 1 & 2) Extract the Bearer token
$token = getBearerTokenAuth();

// 3) Stop the request immediately if no token is found
if (!$token) {
    sendResponse('error', 'Unauthorized: Missing or invalid token', [], 401);
}

try {
    // 4) Query the api_tokens table to see if the token exists
    // Joining the users table to seamlessly handle step 5
    $stmt = $pdo->prepare("
        SELECT u.id, u.role, u.name, t.expires_at 
        FROM api_tokens t
        JOIN users u ON t.user_id = u.id
        WHERE t.token = ?
    ");
    $stmt->execute([$token]);
    $session = $stmt->fetch();

    if (!$session) {
        sendResponse('error', 'Unauthorized: Invalid token', [], 401);
    }

    $currentDate = new DateTime();
    $expirationDate = new DateTime($session['expires_at']);

    if ($currentDate > $expirationDate) {
        $deleteStmt = $pdo->prepare("DELETE FROM api_tokens WHERE token = ?");
        $deleteStmt->execute([$token]);
        
        sendResponse('error', 'Unauthorized: Token has expired. Please log in again.', [], 401);
    }

    // 5) Store the user's ID and role in global PHP variables for the endpoint to use
    global $current_user_id;
    global $current_user_role;
    global $current_user_name;
    $current_user_id = (int)$session['id'];
    $current_user_role = $session['role'];
    $current_user_name = $session['name'];

} catch (\PDOException $e) {
    sendResponse('error', 'Authentication failed due to system error', [], 500);
}
