USE gold_ledger;

-- audit_logs (The Global Audit Trail)
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL, -- The staff/admin who performed the action
    action VARCHAR(100) NOT NULL, -- e.g., 'ISSUE_LOAN', 'OFFSET_LOAN', 'LIQUIDATE_KEEPER'
    table_affected VARCHAR(100) NOT NULL,
    record_id INT NOT NULL,
    old_data JSON DEFAULT NULL, -- The state of the record BEFORE the action
    new_data JSON DEFAULT NULL, -- The state of the record AFTER the action
    ip_address VARCHAR(45) DEFAULT NULL, -- Supports IPv4 and IPv6
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- We use ON DELETE SET NULL rather than CASCADE so that if a staff member 
    -- is deleted from the system, their historical audit logs are permanently preserved.
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
