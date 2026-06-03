CREATE DATABASE IF NOT EXISTS gold_ledger;
USE gold_ledger;

-- customers (Individuals & Groups)
CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_uid VARCHAR(50) UNIQUE DEFAULT NULL,
    name VARCHAR(255) NOT NULL,
    business_name VARCHAR(255) DEFAULT NULL,
    type ENUM('individual', 'group', 'keeper') NOT NULL DEFAULT 'individual',
    entity_type VARCHAR(50) DEFAULT 'individual',
    phone VARCHAR(50) DEFAULT NULL,
    email VARCHAR(100) DEFAULT NULL,
    address TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- capital_ledger (The Single Source of Truth for Cash)
CREATE TABLE capital_ledger (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_type ENUM('loan_issued', 'loan_repaid', 'gold_purchase', 'expense', 'out_sale_revenue', 'external_capital_in') NOT NULL,
    amount_ghs DECIMAL(15, 2) NOT NULL,
    running_balance DECIMAL(15, 2) NOT NULL,
    reference_id INT DEFAULT NULL, -- Links to specific loan, purchase, or expense ID
    description VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- gold_vault (The Physical Gold Tracker)
CREATE TABLE gold_vault (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gold_type ENUM('refined', 'balls') NOT NULL,
    ownership_status ENUM('company_owned', 'keeper_held') NOT NULL,
    weight_grams DECIMAL(10, 4) NOT NULL,
    volume DECIMAL(10, 4) DEFAULT NULL,
    total_blades DECIMAL(10, 2) DEFAULT NULL,
    current_location ENUM('office_vault', 'sold_main_market') NOT NULL DEFAULT 'office_vault',
    customer_id INT DEFAULT NULL, -- NULL if company owned, linked if keeper_held
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- loans
CREATE TABLE loans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    loan_uid VARCHAR(50) UNIQUE DEFAULT NULL,
    customer_id INT NOT NULL,
    principal_amount DECIMAL(15, 2) NOT NULL,
    original_principal DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    type ENUM('standard', 'collateral') NOT NULL DEFAULT 'standard',
    status ENUM('active', 'settled') NOT NULL DEFAULT 'active',
    issued_by INT DEFAULT NULL,
    collateral_gold_type ENUM('refined', 'balls') DEFAULT NULL,
    collateral_weight DECIMAL(10, 4) DEFAULT NULL,
    collateral_volume DECIMAL(10, 4) DEFAULT NULL,
    collateral_blades DECIMAL(10, 4) DEFAULT NULL,
    settlement_note TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- loan_settlements
CREATE TABLE loan_settlements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    loan_id INT NOT NULL,
    settlement_type ENUM('cash', 'walk_in_gold', 'collateral') NOT NULL,
    amount_paid DECIMAL(15, 2) NOT NULL,
    principal_before DECIMAL(15, 2) NOT NULL,
    principal_after DECIMAL(15, 2) NOT NULL,
    gold_type ENUM('refined', 'balls') DEFAULT NULL,
    gold_grams_used DECIMAL(10, 4) DEFAULT NULL,
    price_per_blade DECIMAL(15, 2) DEFAULT NULL,
    total_blades DECIMAL(10, 4) DEFAULT NULL,
    volume DECIMAL(10, 4) DEFAULT NULL,
    current_local_price DECIMAL(15, 2) DEFAULT NULL,
    pounds DECIMAL(10, 4) DEFAULT NULL,
    density DECIMAL(10, 2) DEFAULT NULL,
    karat DECIMAL(10, 2) DEFAULT NULL,
    processed_by INT DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- gold_purchases (The Sales Desk)
CREATE TABLE gold_purchases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_ref VARCHAR(50) UNIQUE DEFAULT NULL,
    customer_id INT DEFAULT NULL,
    gold_type ENUM('refined', 'balls') NOT NULL,
    weight_grams DECIMAL(10, 4) NOT NULL,
    total_paid_ghs DECIMAL(15, 2) NOT NULL,
    local_price DECIMAL(15, 2) DEFAULT NULL,
    density DECIMAL(10, 2) DEFAULT NULL,
    karat DECIMAL(10, 2) DEFAULT NULL,
    pounds DECIMAL(10, 4) DEFAULT NULL,
    total_blades DECIMAL(10, 4) DEFAULT NULL,
    origin ENUM('walk_in', 'from_keeper', 'loan_offset') NOT NULL,
    notes VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- expenses
CREATE TABLE expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
