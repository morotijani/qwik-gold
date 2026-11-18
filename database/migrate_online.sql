-- database/migrate_online.sql
-- Safe, idempotent schema synchronization script for existing online databases.
-- Run this directly in your online phpMyAdmin -> SQL tab (select your database first).
-- It checks INFORMATION_SCHEMA before adding any column, so existing data is untouched
-- and already-present columns will not throw errors.

-- 1. Ensure gold_purchases has all required columns & origin ENUM values
SET @s = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'gold_purchases' AND COLUMN_NAME = 'raw_karat') = 0,
    'ALTER TABLE gold_purchases ADD COLUMN raw_karat DECIMAL(10, 2) DEFAULT NULL AFTER density',
    'SELECT "gold_purchases.raw_karat OK"'
);
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'gold_purchases' AND COLUMN_NAME = 'discount_percent') = 0,
    'ALTER TABLE gold_purchases ADD COLUMN discount_percent DECIMAL(5, 2) DEFAULT NULL AFTER karat',
    'SELECT "gold_purchases.discount_percent OK"'
);
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'gold_purchases' AND COLUMN_NAME = 'handler_id') = 0,
    'ALTER TABLE gold_purchases ADD COLUMN handler_id INT DEFAULT NULL AFTER origin',
    'SELECT "gold_purchases.handler_id OK"'
);
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'gold_purchases' AND COLUMN_NAME = 'is_cleared_from_profile') = 0,
    'ALTER TABLE gold_purchases ADD COLUMN is_cleared_from_profile BOOLEAN NOT NULL DEFAULT FALSE AFTER notes',
    'SELECT "gold_purchases.is_cleared_from_profile OK"'
);
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

ALTER TABLE gold_purchases
    MODIFY COLUMN origin ENUM('walk_in', 'from_keeper', 'loan_offset', 'collateral_offset', 'collateral_purchase') NOT NULL;

-- 2. Ensure customers has handler_id
SET @s = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'handler_id') = 0,
    'ALTER TABLE customers ADD COLUMN handler_id INT DEFAULT NULL AFTER address',
    'SELECT "customers.handler_id OK"'
);
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3. Ensure loans has is_cleared_from_profile
SET @s = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'loans' AND COLUMN_NAME = 'is_cleared_from_profile') = 0,
    'ALTER TABLE loans ADD COLUMN is_cleared_from_profile BOOLEAN NOT NULL DEFAULT FALSE AFTER settlement_note',
    'SELECT "loans.is_cleared_from_profile OK"'
);
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4. Ensure gold_vault has sale_id
SET @s = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'gold_vault' AND COLUMN_NAME = 'sale_id') = 0,
    'ALTER TABLE gold_vault ADD COLUMN sale_id INT DEFAULT NULL AFTER purchase_id',
    'SELECT "gold_vault.sale_id OK"'
);
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 5. Ensure market_sales matches API columns & strict mode compatibility
ALTER TABLE market_sales
    MODIFY COLUMN gold_type ENUM('balls', 'refined', 'mixed') NOT NULL;

SET @s = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'market_sales' AND COLUMN_NAME = 'sale_uid') = 0,
    'ALTER TABLE market_sales ADD COLUMN sale_uid VARCHAR(50) UNIQUE DEFAULT NULL AFTER id',
    'SELECT "market_sales.sale_uid OK"'
);
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'market_sales' AND COLUMN_NAME = 'actual_local_price') = 0,
    'ALTER TABLE market_sales ADD COLUMN actual_local_price DECIMAL(15, 2) DEFAULT NULL AFTER estimated_local_price',
    'SELECT "market_sales.actual_local_price OK"'
);
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'market_sales' AND COLUMN_NAME = 'actual_grams_market') = 0,
    'ALTER TABLE market_sales ADD COLUMN actual_grams_market DECIMAL(10, 4) DEFAULT NULL AFTER actual_local_price',
    'SELECT "market_sales.actual_grams_market OK"'
);
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'market_sales' AND COLUMN_NAME = 'actual_volume_market') = 0,
    'ALTER TABLE market_sales ADD COLUMN actual_volume_market DECIMAL(10, 4) DEFAULT NULL AFTER actual_grams_market',
    'SELECT "market_sales.actual_volume_market OK"'
);
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'market_sales' AND COLUMN_NAME = 'actual_blades_market') = 0,
    'ALTER TABLE market_sales ADD COLUMN actual_blades_market DECIMAL(10, 4) DEFAULT NULL AFTER actual_volume_market',
    'SELECT "market_sales.actual_blades_market OK"'
);
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'market_sales' AND COLUMN_NAME = 'actual_cash') = 0,
    'ALTER TABLE market_sales ADD COLUMN actual_cash DECIMAL(15, 2) DEFAULT NULL AFTER actual_blades_market',
    'SELECT "market_sales.actual_cash OK"'
);
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'market_sales' AND COLUMN_NAME = 'notes') = 0,
    'ALTER TABLE market_sales ADD COLUMN notes TEXT DEFAULT NULL AFTER status',
    'SELECT "market_sales.notes OK"'
);
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'market_sales' AND COLUMN_NAME = 'handler_id') = 0,
    'ALTER TABLE market_sales ADD COLUMN handler_id INT DEFAULT NULL AFTER notes',
    'SELECT "market_sales.handler_id OK"'
);
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Make legacy handled_by nullable if it exists so strict MySQL doesn't fail on inserts
SET @s = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'market_sales' AND COLUMN_NAME = 'handled_by') > 0,
    'ALTER TABLE market_sales MODIFY COLUMN handled_by INT DEFAULT NULL',
    'SELECT "market_sales.handled_by OK"'
);
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 6. Ensure audit_logs.record_id defaults safely to 0
SET @s = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'audit_logs' AND COLUMN_NAME = 'record_id') > 0,
    'ALTER TABLE audit_logs MODIFY COLUMN record_id INT NOT NULL DEFAULT 0',
    'SELECT "audit_logs OK"'
);
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 7. Ensure system_settings table & Mayrocy formula default exist
CREATE TABLE IF NOT EXISTS system_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    description VARCHAR(255) DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO system_settings (setting_key, setting_value, description) VALUES
('purity_discount_percent', '0.7', 'Purity discount percentage deducted for refined gold calculations'),
('calculation_formula', 'mayrocy', 'Refined gold valuation calculation formula standard (mayrocy or nwdgc)');
