-- =====================================================
--  USER MANAGEMENT SYSTEM
-- =====================================================

-- Core users table - identity and account status
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified_at DATETIME(6),
    phone VARCHAR(20),
    phone_verified_at DATETIME(6),
    
    -- Account status (0=ACTIVE, 1=INACTIVE, 2=SUSPENDED, 3=PENDING_VERIFICATION, 4=LOCKED)
    status TINYINT NOT NULL DEFAULT 3,
    is_active BOOLEAN DEFAULT true,
    deleted_at DATETIME(6),
    is_verified BOOLEAN DEFAULT false,
    
    -- Audit fields
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by BIGINT,
    updated_by BIGINT,
    
    -- Constraints
    CONSTRAINT chk_username_length CHECK (LENGTH(username) >= 3),
    CONSTRAINT chk_email_format CHECK (email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_phone_format CHECK (phone IS NULL OR phone REGEXP '^\\+91[6-9][0-9]{9}$'),
    
    -- Foreign keys
    CONSTRAINT fk_users_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_users_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User roles mapping
CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    assigned_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    assigned_by BIGINT,
    expires_at DATETIME(6),
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    
    -- Constraints
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT chk_role_expiry CHECK (expires_at IS NULL OR expires_at > assigned_at),
    
    -- Foreign keys
    CONSTRAINT fk_user_roles_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role_id FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
