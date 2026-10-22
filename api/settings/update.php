<?php
// api/settings/update.php

require_once dirname(__DIR__, 2) . '/config/headers.php';
require_once dirname(__DIR__, 2) . '/config/database.php';
require_once dirname(__DIR__) . '/helpers/settings.php';
require_once dirname(__DIR__) . '/helpers/logger.php';
require_once dirname(__DIR__) . '/middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse('error', 'Method not allowed. Use POST.', [], 405);
}

// Ensure the caller is an admin
if (isset($current_user_role) && $current_user_role !== 'admin') {
    sendResponse('error', 'Unauthorized. Only administrators can update system settings.', [], 403);
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || !is_array($input)) {
    sendResponse('error', 'Invalid JSON payload', [], 400);
}

try {
    $updatedKeys = [];

    // 1. Purity Discount Percentage
    if (isset($input['purity_discount_percent'])) {
        $discount = (float)$input['purity_discount_percent'];
        if ($discount < 0 || $discount > 50) {
            sendResponse('error', 'Purity discount percentage must be between 0% and 50%', [], 400);
        }
        set_system_setting(
            $pdo,
            'purity_discount_percent',
            (string)$discount,
            'Purity discount percentage deducted from raw karat for refined gold calculations'
        );
        $updatedKeys['purity_discount_percent'] = $discount;
    }

    // 2. Company Profile Settings
    $companyFields = [
        'company_name'           => ['Company Name', 150],
        'company_tagline'        => ['Company Tagline / Subtitle', 255],
        'company_address'        => ['Physical Address', 500],
        'company_phone'          => ['Phone Number', 60],
        'company_email'          => ['Email Address', 120],
        'company_website'        => ['Website URL', 200],
        'company_currency'       => ['Currency Symbol / Code', 30],
        'company_receipt_footer' => ['Receipt Footer Note', 300],
        'company_logo'           => ['Company Logo URL or Path', 500]
    ];

    foreach ($companyFields as $field => $meta) {
        if (isset($input[$field])) {
            $val = trim((string)$input[$field]);
            $maxLen = $meta[1];
            if (strlen($val) > $maxLen) {
                $val = substr($val, 0, $maxLen);
            }
            set_system_setting($pdo, $field, $val, $meta[0]);
            $updatedKeys[$field] = $val;
        }
    }

    if (empty($updatedKeys)) {
        sendResponse('error', 'No valid settings provided to update', [], 400);
    }

    // Log the change
    log_activity(
        $pdo,
        $current_user_id ?? null,
        'UPDATE_SETTINGS',
        'system_settings',
        null,
        null,
        $updatedKeys
    );

    $allSettings = get_all_system_settings($pdo);
    sendResponse('success', 'System settings updated successfully', $allSettings, 200);

} catch (\Exception $e) {
    error_log("Settings update error: " . $e->getMessage());
    sendResponse('error', 'Failed to update system settings: ' . $e->getMessage(), [], 500);
}
