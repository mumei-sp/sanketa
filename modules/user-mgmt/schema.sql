-- =====================================================
--  USER MANAGEMENT SYSTEM
-- =====================================================

-- User status enumeration
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending_verification', 'locked');

-- Gender enumeration
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');

-- Profile types enumeration
CREATE TYPE profile_type_enum AS ENUM ('student', 'teacher', 'parent', 'admin', 'staff', 'guardian');


-- Core users table - identity and account status
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username CITEXT UNIQUE,
    email CITEXT UNIQUE NOT NULL,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    phone VARCHAR(20),
    phone_verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Account status
    status user_status DEFAULT 'pending_verification',
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP WITH TIME ZONE,
    is_verified BOOLEAN DEFAULT false,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    
    -- Constraints
    CONSTRAINT chk_username_length CHECK (LENGTH(username) >= 3),
    CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_phone_format CHECK (phone IS NULL OR phone ~* '^\+91[6-9]\d{9}$')
);

-- User roles mapping
CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES users(id),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    
    -- Constraints
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT chk_role_expiry CHECK (expires_at IS NULL OR expires_at > assigned_at)
);

-- User profiles - essential information only
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    profile_type profile_type_enum NOT NULL,
    
    -- Personal information
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    preferred_name VARCHAR(100),
    display_name VARCHAR(200),
    date_of_birth DATE,
    gender gender_type,
    
    -- Contact information
    primary_phone VARCHAR(20),
    secondary_phone VARCHAR(20),
    emergency_phone VARCHAR(20),
    preferred_contact_method contact_method_enum DEFAULT 'email',
    
    -- Address information
    address_line1 VARCHAR(200),
    address_line2 VARCHAR(200),
    city VARCHAR(100),
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    
    -- Profile media
    profile_picture_url VARCHAR(500),
    bio TEXT,
    
    -- Privacy settings
    is_public BOOLEAN DEFAULT false,
    show_email BOOLEAN DEFAULT false,
    show_phone BOOLEAN DEFAULT false,
    
    -- Extensibility for custom fields
    custom_fields JSONB DEFAULT '{}',
    
    -- Status and metadata
    last_profile_update TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id),
    
    -- Constraints
    CONSTRAINT chk_name_length CHECK (LENGTH(first_name) >= 1 AND LENGTH(last_name) >= 1),
    CONSTRAINT chk_date_of_birth CHECK (date_of_birth IS NULL OR date_of_birth <= CURRENT_DATE),
    CONSTRAINT chk_phone_format CHECK (
        primary_phone IS NULL OR primary_phone ~* '^(\+91|91)?[6-9]\d{9}$'
    ),
    CONSTRAINT chk_secondary_phone_format CHECK (
        secondary_phone IS NULL OR secondary_phone ~* '^(\+91|91)?[6-9]\d{9}$'
    ),
    CONSTRAINT chk_emergency_phone_format CHECK (
        emergency_phone IS NULL OR emergency_phone ~* '^(\+91|91)?[6-9]\d{9}$'
    ),
    UNIQUE(user_id)
);


-- =====================================================
--  SPECIALIZED PROFILES
-- =====================================================

-- Student profiles - extends user_profiles
CREATE TABLE students (
    profile_id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    admission_number VARCHAR(50) UNIQUE,
    admission_date DATE,
    roll_number VARCHAR(20),
    grade_level VARCHAR(50),
    section VARCHAR(20),
    
    -- Constraints
    CONSTRAINT chk_admission_date CHECK (admission_date IS NULL OR admission_date <= CURRENT_DATE),
    CONSTRAINT chk_student_id_format CHECK (student_id ~* '^[A-Z0-9]+$'),
    CONSTRAINT chk_student_profile_type CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = profile_id AND up.profile_type = 'student'
        )
    )
);

-- Teacher profiles - extends user_profiles
CREATE TABLE teachers (
    profile_id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    
    -- Professional information
    qualification TEXT[],
    specialization VARCHAR(100)[],
    joining_date DATE,
    department VARCHAR(100),
    
    -- Professional information
    professional_info JSONB DEFAULT '{}',
    
    -- Constraints
    CONSTRAINT chk_joining_date CHECK (joining_date IS NULL OR joining_date <= CURRENT_DATE),
    CONSTRAINT chk_employee_id_format CHECK (employee_id ~* '^[A-Z0-9]+$'),
    CONSTRAINT chk_teacher_profile_type CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = profile_id AND up.profile_type = 'teacher'
        )
    )
);

-- Parent profiles - extends user_profiles
CREATE TABLE parents (
    profile_id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Basic professional info
    occupation VARCHAR(100),
    workplace VARCHAR(200),
    
    -- Parent information
    parent_info JSONB DEFAULT '{}',
    
    -- Constraints
    CONSTRAINT chk_parent_profile_type CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = profile_id AND up.profile_type IN ('parent', 'guardian')
        )
    )
);

-- Student-Parent relationships
CREATE TABLE student_parents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_profile_id UUID NOT NULL REFERENCES students(profile_id) ON DELETE CASCADE,
    parent_profile_id UUID NOT NULL REFERENCES parents(profile_id) ON DELETE CASCADE,
    relationship VARCHAR(50) NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(student_profile_id, parent_profile_id)
);

-- =====================================================
--  INDEXES FOR PERFORMANCE
-- =====================================================

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NOT NULL;


-- User profiles indexes
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_profile_type ON user_profiles(profile_type);

-- Student indexes
CREATE INDEX idx_students_profile_id ON students(profile_id);
CREATE INDEX idx_students_student_id ON students(student_id);
CREATE INDEX idx_students_grade_level ON students(grade_level);

-- Teacher indexes
CREATE INDEX idx_teachers_profile_id ON teachers(profile_id);
CREATE INDEX idx_teachers_employee_id ON teachers(employee_id);
CREATE INDEX idx_teachers_department ON teachers(department);

-- Parent indexes
CREATE INDEX idx_parents_profile_id ON parents(profile_id);

-- Student-Parent relationship indexes
CREATE INDEX idx_student_parents_student_profile_id ON student_parents(student_profile_id);
CREATE INDEX idx_student_parents_parent_profile_id ON student_parents(parent_profile_id);


-- User roles indexes (essential for role-based queries)
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_roles_expires_at ON user_roles(expires_at) WHERE expires_at IS NOT NULL;

-- Essential indexes for common queries
CREATE INDEX idx_students_section ON students(section);

-- =====================================================
--  TRIGGERS FOR DATA INTEGRITY
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



-- Function to update last_profile_update
CREATE OR REPLACE FUNCTION update_last_profile_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_profile_update = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_last_update BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_last_profile_update();

-- =====================================================
--  VIEWS FOR COMMON QUERIES
-- =====================================================

-- Active users with profile information
CREATE VIEW active_users_with_profiles AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.status,
    u.created_at,
    up.first_name,
    up.last_name,
    up.display_name,
    up.profile_type,
    up.profile_picture_url
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE u.is_active = true 
  AND u.deleted_at IS NULL;

-- Students with parent information
CREATE VIEW students_with_parents AS
SELECT 
    s.profile_id as student_profile_id,
    s.student_id,
    s.grade_level,
    s.section,
    u.email,
    up.first_name,
    up.last_name,
    p.profile_id as parent_profile_id,
    pp.first_name as parent_first_name,
    pp.last_name as parent_last_name,
    sp.relationship,
    sp.is_primary
FROM students s
JOIN user_profiles up ON s.profile_id = up.id
JOIN users u ON up.user_id = u.id
LEFT JOIN student_parents sp ON s.profile_id = sp.student_profile_id
LEFT JOIN parents p ON sp.parent_profile_id = p.profile_id
LEFT JOIN user_profiles pp ON p.profile_id = pp.id
WHERE u.is_active = true AND u.deleted_at IS NULL;

-- Active users only (excludes soft deleted)
CREATE VIEW active_users AS
SELECT * FROM users 
WHERE is_active = true AND deleted_at IS NULL;

-- =====================================================
--  COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE users IS 'Core user accounts with identity and status information';
COMMENT ON TABLE user_profiles IS 'User profile information and preferences';
COMMENT ON TABLE students IS 'Student-specific information and academic data';
COMMENT ON TABLE teachers IS 'Teacher-specific information and professional data';
COMMENT ON TABLE parents IS 'Parent/Guardian information';
COMMENT ON TABLE student_parents IS 'Relationships between students and their parents/guardians';

COMMENT ON COLUMN user_profiles.custom_fields IS 'JSONB field for storing custom profile data';
COMMENT ON COLUMN teachers.professional_info IS 'JSONB field for storing professional-specific information';
COMMENT ON COLUMN parents.parent_info IS 'JSONB field for storing parent-specific information';