<?php
require 'config/database.php';
$tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
foreach($tables as $table) {
    echo $table."\n";
    $columns = $pdo->query("SHOW COLUMNS FROM ".$table)->fetchAll();
    foreach($columns as $col) {
        echo '  - '.$col['Field'].' ('.$col['Type'].")\n";
    }
}
