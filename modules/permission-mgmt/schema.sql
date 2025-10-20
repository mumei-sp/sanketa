-- =====================================================
--  PERMISSION MANAGEMENT SYSTEM
-- =====================================================

-- Permission inheritance rules enumeration
CREATE TYPE inheritance_rule_type AS ENUM (
    'none',           -- Never inherited
    'direct_only',    -- Only direct children inherit
    'all_children',   -- All descendants inherit
    'conditional'     -- Inherit based on conditions
);


-- Permissions table with inheritance rules
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    module VARCHAR(50) NOT NULL,
    inheritable BOOLEAN DEFAULT false,
    inheritance_rule inheritance_rule_type DEFAULT 'none',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Roles table with hierarchy
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    hierarchy_level INTEGER DEFAULT 0,
    is_system_role BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_role_name_length CHECK (LENGTH(name) >= 2),
    CONSTRAINT chk_hierarchy_level CHECK (hierarchy_level >= 0)
);

-- Role permissions mapping
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(role_id, permission_id)
);
