<?php
require_once 'config/database.php';
try {
    // Add column
    $pdo->exec("ALTER TABLE gold_purchases ADD COLUMN transaction_ref VARCHAR(50) UNIQUE DEFAULT NULL AFTER id;");
    
    // Populate existing rows with a unique reference
    $stmt = $pdo->query("SELECT id FROM gold_purchases WHERE transaction_ref IS NULL");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $updateStmt = $pdo->prepare("UPDATE gold_purchases SET transaction_ref = ? WHERE id = ?");
    foreach ($rows as $row) {
        $ref = 'PUR-' . strtoupper(substr(uniqid(), -6)) . sprintf("%03d", $row['id']);
        $updateStmt->execute([$ref, $row['id']]);
    }
    
    echo "Successfully added and populated transaction_ref column.\\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\\n";
}
