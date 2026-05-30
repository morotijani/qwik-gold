<?php
require_once __DIR__ . '/../config/database.php';

try {
    $pdo->exec("
        ALTER TABLE gold_purchases 
        ADD COLUMN local_price DECIMAL(15, 2) DEFAULT NULL AFTER total_paid_ghs,
        ADD COLUMN density DECIMAL(10, 2) DEFAULT NULL AFTER local_price,
        ADD COLUMN karat DECIMAL(10, 2) DEFAULT NULL AFTER density,
        ADD COLUMN pounds DECIMAL(10, 4) DEFAULT NULL AFTER karat,
        ADD COLUMN total_blades DECIMAL(10, 4) DEFAULT NULL AFTER pounds;
    ");
    echo "Migration successful: Columns added to gold_purchases table.\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "Migration already applied (columns exist).\n";
    } else {
        echo "Migration failed: " . $e->getMessage() . "\n";
    }
}
