<?php
// config/database.php

$host = '127.0.0.1';
$db   = 'gold_ledger';
$user = 'root'; // Change according to your local environment
$pass = '';     // Change according to your local environment
$charset = 'utf8mb4';

// Set default timezone for all PHP date/time functions to Ghana Time (GMT)
date_default_timezone_set('Africa/Accra');

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
    
    // Set MySQL connection timezone to UTC (+00:00) which perfectly matches Ghana time
    $pdo->exec("SET time_zone = '+00:00';");
} catch (\PDOException $e) {
    // In a production environment, you should log this error instead of displaying it.
    throw new \PDOException($e->getMessage(), (int)$e->getCode());
}
