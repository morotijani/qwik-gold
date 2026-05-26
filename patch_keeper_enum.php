<?php
require_once 'config/database.php';
try {
    $pdo->exec("ALTER TABLE customers MODIFY COLUMN type ENUM('individual', 'group', 'keeper') NOT NULL DEFAULT 'individual'");
    echo "Successfully updated ENUM constraint in the live database.\\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\\n";
}
