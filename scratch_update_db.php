<?php
require 'config/database.php';

$sql = "
CREATE TABLE IF NOT EXISTS market_sales (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    sale_uid VARCHAR(50) NOT NULL,
    gold_type ENUM('refined', 'balls', 'mixed') NOT NULL,
    total_grams DECIMAL(10,4) NOT NULL DEFAULT 0,
    total_volume DECIMAL(10,4) NOT NULL DEFAULT 0,
    total_blades DECIMAL(10,4) NOT NULL DEFAULT 0,
    estimated_cash DECIMAL(15,2) NOT NULL DEFAULT 0,
    actual_cash DECIMAL(15,2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
";

try {
    $pdo->exec($sql);
    echo "market_sales table created successfully.\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
