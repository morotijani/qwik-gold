CREATE DATABASE IF NOT EXISTS gold_ledger;
USE gold_ledger;

-- customers (Individuals & Groups)
CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type ENUM('individual', 'group', 'keeper') NOT NULL DEFAULT 'individual',
    contact_info VARCHAR(255),
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
    current_location ENUM('office_vault', 'sold_main_market') NOT NULL DEFAULT 'office_vault',
    customer_id INT DEFAULT NULL, -- NULL if company owned, linked if keeper_held
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- loans
CREATE TABLE loans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    principal_amount DECIMAL(15, 2) NOT NULL,
    type ENUM('standard', 'collateral') NOT NULL DEFAULT 'standard',
    status ENUM('active', 'settled') NOT NULL DEFAULT 'active',
    settlement_note TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- gold_purchases (The Sales Desk)
CREATE TABLE gold_purchases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT DEFAULT NULL,
    gold_type ENUM('refined', 'balls') NOT NULL,
    weight_grams DECIMAL(10, 4) NOT NULL,
    total_paid_ghs DECIMAL(15, 2) NOT NULL,
    origin ENUM('walk_in', 'from_keeper', 'loan_offset') NOT NULL,
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
