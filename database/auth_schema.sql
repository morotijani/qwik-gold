USE gold_ledger;

-- 1) users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'staff', 'salesperson') NOT NULL DEFAULT 'staff',
    status ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2) api_tokens table
CREATE TABLE IF NOT EXISTS api_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default admin user with password: password123
-- Using PHP's default bcrypt algorithm
INSERT INTO users (name, username, password_hash, role) 
VALUES (
    'System Administrator', 
    'admin', 
    '$2y$10$hK9x7PuRD7Dvh9OjJkgMU.dGNEXkDwPQ8/ewC09wVi3/0nnLNmj.G', 
    'admin'
)
ON DUPLICATE KEY UPDATE id=id;
