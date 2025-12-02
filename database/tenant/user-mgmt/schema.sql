-- =====================================================
--  USER MANAGEMENT SYSTEM
-- =====================================================

-- This tenant schema contains tenant-scoped domain data
-- (roles, students, teachers, parents, relationships, etc.)
-- plus denormalized profile data for performance.


-- =====================================================
--  DENORMALIZED PROFILE DATA (Read Replica)
-- =====================================================
--
-- This table is a denormalized copy of frequently-accessed profile columns
-- from GlobalDB.user_profiles. It's kept in sync via application-level
-- synchronization (event-driven or on-demand).
--
-- Purpose:
-- - Fast local reads (no cross-DB queries)
-- - Enable efficient JOINs with students/teachers/parents
-- - Reduce load on Global DB
--
-- Sync Strategy:
-- - On profile update in Global DB → sync to all tenant DBs where user exists
-- - On user joining tenant → sync profile to that tenant DB
-- - Periodic reconciliation job to catch any drift
--
-- Columns: Only frequently-accessed fields (not all columns from global)
CREATE TABLE user_profiles (
    id BIGINT PRIMARY KEY COMMENT 'References GlobalDB.user_profiles.id',
    user_id BIGINT NOT NULL COMMENT 'References GlobalDB.users.id',
    profile_type TINYINT NOT NULL COMMENT '0=STUDENT, 1=TEACHER, 2=PARENT, 3=ADMIN, 4=STAFF, 5=GUARDIAN',
    
    -- Personal information
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    preferred_name VARCHAR(100),
    display_name VARCHAR(200),
    date_of_birth DATE,
    gender TINYINT COMMENT '0=MALE, 1=FEMALE, 2=OTHER, 3=PREFER_NOT_TO_SAY',
    
    -- Contact information
    primary_phone VARCHAR(20),
    profile_picture_url VARCHAR(500),
    
    -- Sync metadata
    synced_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Last sync timestamp from Global DB',
    sync_version BIGINT DEFAULT 0 COMMENT 'Version number for conflict resolution',
    
    -- Indexes
    INDEX idx_user_profiles_profile_type (profile_type),
    
    -- Constraints
    CONSTRAINT chk_user_profiles_name_length CHECK (LENGTH(first_name) >= 1 AND LENGTH(last_name) >= 1),
    CONSTRAINT chk_user_profiles_date_of_birth CHECK (date_of_birth IS NULL OR date_of_birth <= CURDATE()),
    UNIQUE KEY uk_user_profiles_user_id (user_id) COMMENT 'One profile per user per tenant (enforced at DB level)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Denormalized profile data from GlobalDB.user_profiles (read replica)';

-- =====================================================
--  SPECIALIZED PROFILES
-- =====================================================

-- Student profiles - extends user_profiles
CREATE TABLE students (
    profile_id BIGINT PRIMARY KEY,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    admission_number VARCHAR(50) UNIQUE,
    admission_date DATE,
    roll_number VARCHAR(20),
    grade_level VARCHAR(50),
    section VARCHAR(20),
    
    -- Constraints
    CONSTRAINT chk_admission_date CHECK (admission_date IS NULL OR admission_date <= CURDATE()),
    CONSTRAINT chk_student_id_format CHECK (student_id REGEXP '^[A-Z0-9]+$'),
    
    -- Foreign keys
    CONSTRAINT fk_students_profile_id FOREIGN KEY (profile_id) REFERENCES user_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Teacher profiles - extends user_profiles
CREATE TABLE teachers (
    profile_id BIGINT PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    
    -- Professional information
    qualification JSON,
    specialization JSON,
    joining_date DATE,
    department VARCHAR(100),
    professional_info JSON DEFAULT ('{}'),
    
    -- Constraints
    CONSTRAINT chk_joining_date CHECK (joining_date IS NULL OR joining_date <= CURDATE()),
    CONSTRAINT chk_employee_id_format CHECK (employee_id REGEXP '^[A-Z0-9]+$'),
    
    -- Foreign keys
    CONSTRAINT fk_teachers_profile_id FOREIGN KEY (profile_id) REFERENCES user_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Parent profiles - extends user_profiles
CREATE TABLE parents (
    profile_id BIGINT PRIMARY KEY,
    
    -- Basic professional info
    occupation VARCHAR(100),
    workplace VARCHAR(200),
    
    -- Parent information
    parent_info JSON DEFAULT ('{}'),
    
    -- Foreign keys
    CONSTRAINT fk_parents_profile_id FOREIGN KEY (profile_id) REFERENCES user_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student-Parent relationships
CREATE TABLE student_parents (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_profile_id BIGINT NOT NULL,
    parent_profile_id BIGINT NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    
    -- Constraints
    UNIQUE(student_profile_id, parent_profile_id),
    
    -- Foreign keys
    CONSTRAINT fk_student_parents_student FOREIGN KEY (student_profile_id) REFERENCES students(profile_id) ON DELETE CASCADE,
    CONSTRAINT fk_student_parents_parent FOREIGN KEY (parent_profile_id) REFERENCES parents(profile_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
--  INDEXES FOR PERFORMANCE
-- =====================================================

-- Student indexes
CREATE INDEX idx_students_grade_level ON students(grade_level);
CREATE INDEX idx_students_section ON students(section);

-- Teacher indexes
CREATE INDEX idx_teachers_department ON teachers(department);

-- Student-Parent relationship indexes
CREATE INDEX idx_student_parents_student_profile_id ON student_parents(student_profile_id);
CREATE INDEX idx_student_parents_parent_profile_id ON student_parents(parent_profile_id);

-- =====================================================
--  COMMENTS FOR DOCUMENTATION
-- =====================================================

ALTER TABLE user_profiles COMMENT = 'Denormalized profile data from GlobalDB (read replica for performance)';
ALTER TABLE students COMMENT = 'Student-specific information and academic data';
ALTER TABLE teachers COMMENT = 'Teacher-specific information and professional data';
ALTER TABLE parents COMMENT = 'Parent/Guardian information';
ALTER TABLE student_parents COMMENT = 'Relationships between students and their parents/guardians';