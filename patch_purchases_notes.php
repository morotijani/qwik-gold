<?php
require_once 'config/database.php';
try {
    $pdo->exec("ALTER TABLE gold_purchases ADD COLUMN notes VARCHAR(255) DEFAULT NULL AFTER origin;");
    echo "Successfully added notes column to gold_purchases table.\\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\\n";
}
