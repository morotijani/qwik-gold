<?php
require 'config/database.php';

try {
    $sql = "ALTER TABLE expenses ADD COLUMN status ENUM('active', 'voided') DEFAULT 'active' AFTER amount;";
    $pdo->exec($sql);
    echo "Successfully added 'status' column to expenses table.\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
