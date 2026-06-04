<?php
require 'config/database.php';

$sql = "
ALTER TABLE market_sales 
ADD COLUMN status ENUM('pending', 'completed') DEFAULT 'pending' AFTER sale_uid,
ADD COLUMN estimated_local_price DECIMAL(15,2) DEFAULT 0 AFTER total_blades,
ADD COLUMN actual_local_price DECIMAL(15,2) DEFAULT 0 AFTER estimated_local_price,
ADD COLUMN actual_grams_market DECIMAL(10,4) DEFAULT 0 AFTER actual_local_price,
ADD COLUMN actual_volume_market DECIMAL(10,4) DEFAULT 0 AFTER actual_grams_market,
ADD COLUMN actual_blades_market DECIMAL(10,4) DEFAULT 0 AFTER actual_volume_market;

ALTER TABLE gold_vault
ADD COLUMN sale_id INT(11) NULL DEFAULT NULL AFTER current_location;
";

try {
    $pdo->exec($sql);
    echo "market_sales and gold_vault tables updated successfully.\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
