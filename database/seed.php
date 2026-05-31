<?php
// database/seed.php
require_once __DIR__ . '/../config/database.php';

try {
    // 1. Clear existing non-user data for a clean slate
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");
    $pdo->exec("TRUNCATE TABLE audit_logs;");
    $pdo->exec("TRUNCATE TABLE expenses;");
    $pdo->exec("TRUNCATE TABLE gold_purchases;");
    $pdo->exec("TRUNCATE TABLE loans;");
    $pdo->exec("TRUNCATE TABLE gold_vault;");
    $pdo->exec("TRUNCATE TABLE capital_ledger;");
    $pdo->exec("TRUNCATE TABLE customers;");
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");

    $pdo->beginTransaction();

    // 2. Insert Dummy Customers
    $pdo->exec("
        INSERT INTO customers (name, type, phone) VALUES 
        ('Kwame Mensah', 'individual', '054-123-4567'),
        ('Ama Serwaa', 'individual', '024-987-6543'),
        ('Obuasi Miners Syndicate', 'group', 'Kumasi Road, Block C'),
        ('John Doe', 'individual', '055-555-5555')
    ");

    // 3. Inject Initial Capital (100,000 GHS)
    $pdo->exec("
        INSERT INTO capital_ledger (transaction_type, amount_ghs, running_balance, description) VALUES
        ('external_capital_in', 100000.00, 100000.00, 'Initial business funding from CEO')
    ");

    // 4. Issue some active loans
    $pdo->exec("
        INSERT INTO loans (customer_id, principal_amount, status) VALUES
        (1, 5000.00, 'active'),
        (3, 15000.00, 'active')
    ");

    $pdo->exec("
        INSERT INTO capital_ledger (transaction_type, amount_ghs, running_balance, reference_id, description) VALUES
        ('loan_issued', -5000.00, 95000.00, 1, 'Loan issued to Kwame Mensah'),
        ('loan_issued', -15000.00, 80000.00, 2, 'Loan issued to Obuasi Miners Syndicate')
    ");

    // 5. Add some Gold to the Vault (Company Owned)
    $pdo->exec("
        INSERT INTO gold_vault (gold_type, ownership_status, weight_grams, current_location) VALUES
        ('refined', 'company_owned', 150.5, 'office_vault'),
        ('balls', 'company_owned', 45.2, 'office_vault')
    ");

    $pdo->exec("
        INSERT INTO gold_purchases (customer_id, gold_type, weight_grams, total_paid_ghs, origin) VALUES
        (2, 'refined', 150.5, 30000.00, 'walk_in'),
        (4, 'balls', 45.2, 8500.00, 'walk_in')
    ");

    $pdo->exec("
        INSERT INTO capital_ledger (transaction_type, amount_ghs, running_balance, reference_id, description) VALUES
        ('gold_purchase', -30000.00, 50000.00, 1, 'Purchased 150.5g refined gold'),
        ('gold_purchase', -8500.00, 41500.00, 2, 'Purchased 45.2g gold balls')
    ");

    // 6. Add some Keeper Held Gold (Not paid for yet)
    $pdo->exec("
        INSERT INTO gold_vault (gold_type, ownership_status, weight_grams, current_location, customer_id) VALUES
        ('balls', 'keeper_held', 20.0, 'office_vault', 3),
        ('refined', 'keeper_held', 55.0, 'office_vault', 1)
    ");

    // 7. Add some Business Expenses
    $pdo->exec("
        INSERT INTO expenses (description, amount, date) VALUES
        ('Office Electricity Bill', 250.00, '2026-05-20'),
        ('Transport for Market execution', 100.00, '2026-05-22')
    ");

    $pdo->exec("
        INSERT INTO capital_ledger (transaction_type, amount_ghs, running_balance, reference_id, description) VALUES
        ('expense', -250.00, 41250.00, 1, 'Office Electricity Bill'),
        ('expense', -100.00, 41150.00, 2, 'Transport for Market execution')
    ");

    // Note: We don't truncate or mess with users/api_tokens so your login still works perfectly.

    $pdo->commit();
    echo "Dummy data securely seeded! Database is ready to view.\n";

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo "Error seeding database: " . $e->getMessage() . "\n";
}
