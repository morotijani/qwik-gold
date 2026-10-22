<?php
// api/settings/get.php

require_once dirname(__DIR__, 2) . '/config/headers.php';
require_once dirname(__DIR__, 2) . '/config/database.php';
require_once dirname(__DIR__) . '/helpers/settings.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse('error', 'Method not allowed. Use GET.', [], 405);
}

try {
    $settings = get_all_system_settings($pdo);
    sendResponse('success', 'System settings retrieved successfully', $settings, 200);
} catch (\Exception $e) {
    error_log("Settings error: " . $e->getMessage());
    sendResponse('error', 'Failed to retrieve system settings', [], 500);
}
