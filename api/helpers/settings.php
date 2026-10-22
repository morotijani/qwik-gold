<?php
// api/helpers/settings.php

/**
 * Fetch all system settings as a key-value map.
 *
 * @param PDO $pdo
 * @return array
 */
function get_all_system_settings($pdo) {
    try {
        $stmt = $pdo->query("SELECT setting_key, setting_value, description FROM system_settings");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $settings = [
            'purity_discount_percent' => 0.70,
            'company_name' => 'Qwik Gold',
            'company_tagline' => 'Enterprise Precious Metals Ledger',
            'company_address' => 'Accra Gold Market, Greater Accra, Ghana',
            'company_phone' => '+233 24 123 4567',
            'company_email' => 'info@qwikgold.com',
            'company_website' => 'https://qwikgold.com',
            'company_currency' => 'GHS',
            'company_logo' => 'assets/img/logo.png',
            'company_receipt_footer' => 'Thank you for doing business with Qwik Gold!'
        ];
        foreach ($rows as $row) {
            $key = $row['setting_key'];
            $val = $row['setting_value'];
            if ($key === 'purity_discount_percent') {
                $settings[$key] = (float)$val;
            } else {
                $settings[$key] = $val;
            }
        }
        return $settings;
    } catch (\Exception $e) {
        return [
            'purity_discount_percent' => 0.70,
            'company_name' => 'Qwik Gold',
            'company_tagline' => 'Enterprise Precious Metals Ledger',
            'company_address' => 'Accra Gold Market, Greater Accra, Ghana',
            'company_phone' => '+233 24 123 4567',
            'company_email' => 'info@qwikgold.com',
            'company_website' => 'https://qwikgold.com',
            'company_currency' => 'GHS',
            'company_logo' => 'assets/img/logo.png',
            'company_receipt_footer' => 'Thank you for doing business with Qwik Gold!'
        ];
    }
}

/**
 * Fetch a specific system setting value.
 *
 * @param PDO $pdo
 * @param string $key
 * @param mixed $default
 * @return mixed
 */
function get_system_setting($pdo, $key, $default = null) {
    try {
        $stmt = $pdo->prepare("SELECT setting_value FROM system_settings WHERE setting_key = ?");
        $stmt->execute([$key]);
        $val = $stmt->fetchColumn();
        return $val !== false ? $val : $default;
    } catch (\Exception $e) {
        return $default;
    }
}

/**
 * Update or insert a system setting.
 *
 * @param PDO $pdo
 * @param string $key
 * @param string $value
 * @param string|null $description
 * @return bool
 */
function set_system_setting($pdo, $key, $value, $description = null) {
    $stmt = $pdo->prepare("
        INSERT INTO system_settings (setting_key, setting_value, description) 
        VALUES (?, ?, ?) 
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), description = COALESCE(VALUES(description), description)
    ");
    return $stmt->execute([$key, (string)$value, $description]);
}
