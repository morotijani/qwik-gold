<?php
require_once 'config/database.php';

echo "--- LOANS ---\n";
$stmt = $pdo->query('SELECT * FROM loans');
print_r($stmt->fetchAll());

echo "--- CUSTOMERS ---\n";
$stmt2 = $pdo->query('SELECT * FROM customers');
print_r($stmt2->fetchAll());

echo "--- JOIN QUERY ---\n";
$stmt3 = $pdo->query('
    SELECT 
        l.id, l.customer_id, l.principal_amount, l.type, l.status, l.created_at,
        c.name as customer_name, c.contact_info
    FROM loans l
    JOIN customers c ON l.customer_id = c.id
    ORDER BY l.status ASC, l.created_at DESC
');
print_r($stmt3->fetchAll());
