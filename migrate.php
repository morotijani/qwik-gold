<?php
require_once __DIR__ . '/config/database.php';

try {
    $pdo->exec("ALTER TABLE loans ADD COLUMN type ENUM('standard', 'collateral') NOT NULL DEFAULT 'standard' AFTER principal_amount");
    echo "Migration successful\n";
} catch (PDOException $e) {
    if ($e->getCode() == '42S21') {
        echo "Column 'type' already exists.\n";
    } else {
        echo "Migration failed: " . $e->getMessage() . "\n";
    }
}
