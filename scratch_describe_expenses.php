<?php
require 'config/database.php';

$stmt = $pdo->query("DESCRIBE expenses");
$columns = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($columns as $column) {
    echo $column['Field'] . " - " . $column['Type'] . "\n";
}
