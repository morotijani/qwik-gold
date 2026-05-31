<?php
require 'config/database.php';
$depositsStmt = $pdo->prepare("SELECT a.created_at, 'deposit' as action, CAST(JSON_EXTRACT(a.new_data, '$.grams') AS DECIMAL(10,4)) as grams, JSON_UNQUOTE(JSON_EXTRACT(a.new_data, '$.type')) as gold_type, NULL as payout_ghs FROM audit_logs a JOIN gold_vault g ON a.record_id = g.id WHERE a.action = 'DEPOSIT_KEEPER' AND g.customer_id = 1");
$depositsStmt->execute();
$deposits = $depositsStmt->fetchAll(PDO::FETCH_ASSOC);

$salesStmt = $pdo->prepare("SELECT created_at, 'liquidate' as action, weight_grams as grams, gold_type, total_paid_ghs as payout_ghs FROM gold_purchases WHERE origin = 'from_keeper' AND customer_id = 1");
$salesStmt->execute();
$sales = $salesStmt->fetchAll(PDO::FETCH_ASSOC);

$history = array_merge($deposits, $sales);
usort($history, function($a, $b) {
    return strtotime($b['created_at']) - strtotime($a['created_at']);
});
echo json_encode([
    'status' => 'success',
    'message' => 'Keeper history retrieved',
    'data' => $history
]);
