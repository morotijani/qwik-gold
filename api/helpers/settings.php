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
            'calculation_formula' => 'mayrocy',
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
            'calculation_formula' => 'mayrocy',
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

/**
 * Compute standardized refined gold valuation metrics according to the configured standard.
 * Supports:
 *  - 'mayrocy' (Default): full-precision raw density for raw karat, rounded display density,
 *    and subtractive purity discount directly from purity % (rawPurity - discount%).
 *  - 'nwdgc' (Legacy): truncated density, and multiplicative discount on raw karat (rawKarat * (1 - discount%/100)).
 *
 * @param PDO $pdo
 * @param float $grams
 * @param float $volume
 * @param float $pricePerPound
 * @param float|null $discountPercent
 * @param string|null $formulaStandard
 * @return array
 */
function calculate_refined_gold($pdo, $grams, $volume, $pricePerPound = 0, $discountPercent = null, $formulaStandard = null) {
    $g = (float)$grams;
    $v = (float)$volume;
    $p = (float)$pricePerPound;

    $disc = $discountPercent !== null
        ? max(0.0, (float)$discountPercent)
        : max(0.0, (float)get_system_setting($pdo, 'purity_discount_percent', 0.70));

    $formula = $formulaStandard !== null
        ? strtolower(trim((string)$formulaStandard))
        : strtolower(trim((string)get_system_setting($pdo, 'calculation_formula', 'mayrocy')));

    if ($formula !== 'mayrocy' && $formula !== 'nwdgc') {
        $formula = 'mayrocy';
    }

    $truncate2 = function($num) {
        return floor(((float)$num + 0.00000001) * 100) / 100;
    };
    $round2 = function($num) {
        return round(((float)$num + 1e-12), 2, PHP_ROUND_HALF_UP);
    };

    $pounds = $g > 0 ? $truncate2($g / 7.75) : 0.0;
    $rawDensity = ($g > 0 && $v > 0) ? ($g / $v) : 0.0;

    if ($formula === 'nwdgc') {
        $density = $rawDensity > 0 ? $truncate2($rawDensity) : 0.0;
        $rawKarat = 0.0;
        if ($density > 0) {
            $rawKarat = $truncate2((($density - 10.51) * 52.838) / $density);
            $rawKarat = max(0.0, min(24.0, $rawKarat));
        }
        $rawPurity = $rawKarat > 0 ? min(100.0, $round2(($rawKarat / 24.0) * 100)) : 0.0;

        $discountFactor = (100.0 - $disc) / 100.0;
        $payableKarat = 0.0;
        if ($rawKarat > 0) {
            $payableKarat = $disc > 0 ? $truncate2($rawKarat * $discountFactor) : $rawKarat;
            $payableKarat = max(0.0, min(24.0, $payableKarat));
        }
        $purityPercent = $payableKarat > 0 ? min(100.0, $round2(($payableKarat / 24.0) * 100)) : 0.0;
    } else {
        // Mayrocy Standard (Default)
        $density = $rawDensity > 0 ? $round2($rawDensity) : 0.0;
        $rawKarat = 0.0;
        if ($rawDensity > 0) {
            $rawKarat = $truncate2((($rawDensity - 10.51) * 52.838) / $rawDensity);
            $rawKarat = max(0.0, min(24.0, $rawKarat));
        }
        $rawPurity = $rawKarat > 0 ? min(100.0, $round2(($rawKarat / 24.0) * 100)) : 0.0;

        $purityPercent = $rawPurity > 0 ? max(0.0, min(100.0, $round2($rawPurity - $disc))) : 0.0;
        $payableKarat = $purityPercent > 0 ? max(0.0, min(24.0, $round2(($purityPercent / 100.0) * 24.0))) : 0.0;
    }

    $adjustedPricePerPound = ($payableKarat > 0 && $p > 0) ? $round2(($payableKarat * $p) / 23.0) : 0.0;
    $totalPayout = ($payableKarat > 0 && $p > 0 && $pounds > 0) ? floor(($payableKarat * $p / 23.0) * $pounds) : 0.0;
    $grossPayout = ($rawKarat > 0 && $p > 0 && $pounds > 0) ? floor(($rawKarat * $p / 23.0) * $pounds) : 0.0;

    return [
        'formula' => $formula,
        'grams' => $g,
        'volume' => $v,
        'price_per_pound' => $p,
        'adjusted_price_per_pound' => $adjustedPricePerPound,
        'discount_percent' => $disc,
        'pounds' => $pounds,
        'density' => $density,
        'raw_karat' => $rawKarat,
        'raw_purity' => $rawPurity,
        'payable_karat' => $payableKarat,
        'purity_percent' => $purityPercent,
        'total_payout' => $totalPayout,
        'gross_payout' => $grossPayout,
        'discount_saved' => max(0.0, $grossPayout - $totalPayout)
    ];
}
