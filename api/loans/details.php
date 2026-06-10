<?php
// api/loans/details.php

require_once '../../config/headers.php';
require_once '../../config/database.php';
require_once '../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse('error', 'Method not allowed', [], 405);
}

if (!isset($_GET['loan_id'])) {
    sendResponse('error', 'Missing required parameter: loan_id', [], 400);
}

$loanId = (int)$_GET['loan_id'];

try {
    // Fetch loan with issuer name
    $loanStmt = $pdo->prepare("
        SELECT l.*, c.name as customer_name, u.name as issuer_name
        FROM loans l
        JOIN customers c ON l.customer_id = c.id
        LEFT JOIN users u ON l.issued_by = u.id
        WHERE l.id = ?
    ");
    $loanStmt->execute([$loanId]);
    $loan = $loanStmt->fetch(PDO::FETCH_ASSOC);

    if (!$loan) {
        sendResponse('error', 'Loan not found', [], 404);
    }

    // Fetch settlements with processor name
    $settlementsStmt = $pdo->prepare("
        SELECT s.*, u.name as processor_name
        FROM loan_settlements s
        LEFT JOIN users u ON s.processed_by = u.id
        WHERE s.loan_id = ?
        ORDER BY s.created_at DESC
    ");
    $settlementsStmt->execute([$loanId]);
    $settlements = $settlementsStmt->fetchAll(PDO::FETCH_ASSOC);

    sendResponse('success', 'Loan details retrieved', [
        'loan' => $loan,
        'settlements' => $settlements
    ], 200);

} catch (\Exception $e) {
    error_log("System Error: " . $e->getMessage());
    sendResponse('error', 'A system error occurred while processing your request.', [], 500);
}
