CREATE DATABASE IF NOT EXISTS gold_ledger;
USE gold_ledger;

-- users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'staff', 'salesperson') NOT NULL DEFAULT 'staff',
    status ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- api_tokens
CREATE TABLE IF NOT EXISTS api_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(128) UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    action VARCHAR(100) NOT NULL,
    table_affected VARCHAR(100) NOT NULL,
    record_id INT NOT NULL DEFAULT 0,
    old_data JSON DEFAULT NULL,
    new_data JSON DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
    handler_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (handler_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- capital_ledger (The Single Source of Truth for Cash)
CREATE TABLE capital_ledger (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_type ENUM('loan_issued', 'loan_repaid', 'gold_purchase', 'expense', 'out_sale_revenue', 'external_capital_in', 'expense_refunded', 'purchase_reversal', 'capital_withdrawal') NOT NULL,
    amount_ghs DECIMAL(15, 2) NOT NULL,
    running_balance DECIMAL(15, 2) NOT NULL,
    reference_id INT DEFAULT NULL, -- Links to specific loan, purchase, or expense ID
    description VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_reference_id (reference_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- gold_vault (The Physical Gold Tracker)
CREATE TABLE gold_vault (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gold_type ENUM('refined', 'balls') NOT NULL,
    ownership_status ENUM('company_owned', 'keeper_held') NOT NULL,
    weight_grams DECIMAL(10, 4) NOT NULL,
    volume DECIMAL(10, 4) DEFAULT NULL,
    total_blades DECIMAL(10, 2) DEFAULT NULL,
    current_location ENUM('office_vault', 'sold_main_market', 'converted', 'on_hold') NOT NULL DEFAULT 'office_vault',
    guessed_value_ghs DECIMAL(15, 2) DEFAULT 0, -- Calculated formula value at the exact time of purchase
    purchase_id INT DEFAULT NULL, -- Links vault record back to its origin purchase (if bought)
    sale_id INT DEFAULT NULL, -- Links vault record to market_sales ID
    customer_id INT DEFAULT NULL, -- NULL if company owned, linked if keeper_held
    parent_ball_id INT DEFAULT NULL, -- Links refined gold back to original balls
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_ball_id) REFERENCES gold_vault(id) ON DELETE SET NULL
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
    notes TEXT DEFAULT NULL,
    settlement_note TEXT DEFAULT NULL,
    is_cleared_from_profile BOOLEAN NOT NULL DEFAULT FALSE,
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

-- market_sales
CREATE TABLE market_sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_uid VARCHAR(50) UNIQUE DEFAULT NULL,
    gold_type ENUM('balls', 'refined', 'mixed') NOT NULL,
    total_grams DECIMAL(10,4) NOT NULL,
    total_blades DECIMAL(10,4) DEFAULT 0,
    total_volume DECIMAL(10,4) DEFAULT 0,
    estimated_cash DECIMAL(15,2) NOT NULL,
    estimated_local_price DECIMAL(15,2) DEFAULT NULL,
    actual_local_price DECIMAL(15,2) DEFAULT NULL,
    actual_grams_market DECIMAL(10,4) DEFAULT NULL,
    actual_volume_market DECIMAL(10,4) DEFAULT NULL,
    actual_blades_market DECIMAL(10,4) DEFAULT NULL,
    actual_cash DECIMAL(15,2) DEFAULT NULL,
    net_profit_ghs DECIMAL(15,2) DEFAULT 0,
    is_merged BOOLEAN DEFAULT FALSE,
    merged_into_id INT DEFAULT NULL,
    status ENUM('pending', 'completed') DEFAULT 'pending',
    notes TEXT DEFAULT NULL,
    handler_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (handler_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- gold_purchases (The Sales Desk)
CREATE TABLE gold_purchases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_ref VARCHAR(50) UNIQUE DEFAULT NULL,
    customer_id INT DEFAULT NULL,
    gold_type ENUM('refined', 'balls') NOT NULL,
    weight_grams DECIMAL(10, 4) NOT NULL,
    volume DECIMAL(10, 4) DEFAULT NULL,
    total_paid_ghs DECIMAL(15, 2) NOT NULL,
    local_price DECIMAL(15, 2) DEFAULT NULL,
    density DECIMAL(10, 2) DEFAULT NULL,
    raw_karat DECIMAL(10, 2) DEFAULT NULL,
    karat DECIMAL(10, 2) DEFAULT NULL,
    discount_percent DECIMAL(5, 2) DEFAULT NULL,
    pounds DECIMAL(10, 4) DEFAULT NULL,
    total_blades DECIMAL(10, 4) DEFAULT NULL,
    origin ENUM('walk_in', 'from_keeper', 'loan_offset', 'collateral_offset', 'collateral_purchase') NOT NULL,
    handler_id INT DEFAULT NULL,
    notes VARCHAR(255) DEFAULT NULL,
    is_cleared_from_profile BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_transaction_ref (transaction_ref),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (handler_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- expenses
CREATE TABLE expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    date DATE NOT NULL,
    status ENUM('active', 'voided') NOT NULL DEFAULT 'active',
    handler_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (handler_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- system_settings
CREATE TABLE IF NOT EXISTS system_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    description VARCHAR(255) DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO system_settings (setting_key, setting_value, description) VALUES 
('purity_discount_percent', '0.7', 'Purity discount percentage deducted for refined gold calculations'),
('calculation_formula', 'mayrocy', 'Refined gold valuation calculation formula standard (mayrocy or nwdgc)'),
('company_name', 'Qwik Gold', 'Company Name'),
('company_tagline', 'Enterprise Precious Metals Ledger', 'Company Tagline / Subtitle'),
('company_address', 'Accra Gold Market, Greater Accra, Ghana', 'Physical Address'),
('company_phone', '+233 24 123 4567', 'Phone Number'),
('company_email', 'info@qwikgold.com', 'Email Address'),
('company_website', 'https://qwikgold.com', 'Website URL'),
('company_currency', 'GHS', 'Currency Symbol / Code'),
('company_logo', 'assets/img/logo.png', 'Company Logo URL or Path'),
('company_receipt_footer', 'Thank you for doing business with Qwik Gold!', 'Receipt Footer Note');

