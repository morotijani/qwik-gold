<?php
// api/helpers/logger.php

/**
 * Reusable helper function to securely log activity into the audit_logs table.
 * 
 * @param PDO $pdo The active database connection
 * @param int|null $user_id The ID of the user performing the action (from the Auth Middleware)
 * @param string $action The action being performed (e.g., 'ISSUE_LOAN')
 * @param string $table_affected The name of the database table heavily modified
 * @param int $record_id The primary key of the modified record
 * @param array|object|null $old_data The state before the action
 * @param array|object|null $new_data The state after the action
 * @return void
 */
function log_activity($pdo, $user_id, $action, $table_affected, $record_id, $old_data = null, $new_data = null) {
    // 1) Capture the IP address of the staff member making the request
    $ip_address = $_SERVER['REMOTE_ADDR'] ?? null;
    
    // 2) JSON encode the flexible data payloads if they were provided
    $old_data_json = $old_data !== null ? json_encode($old_data) : null;
    $new_data_json = $new_data !== null ? json_encode($new_data) : null;

    try {
        // 3) Execute the insert statement
        $stmt = $pdo->prepare("
            INSERT INTO audit_logs (user_id, action, table_affected, record_id, old_data, new_data, ip_address) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $user_id, 
            $action, 
            $table_affected, 
            $record_id, 
            $old_data_json, 
            $new_data_json, 
            $ip_address
        ]);
        
    } catch (\Exception $e) {
        // 4) Fail silently. If the logging system hits a hiccup, it should NOT roll back the 
        // critical financial transaction happening in the main application.
        // We log it to the server's native error log instead.
        error_log("Qwik-Gold Audit Logging Failed: " . $e->getMessage());
    }
}
