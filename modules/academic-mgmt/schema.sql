-- =====================================================
--  ACADEMIC MANAGEMENT SYSTEM
-- =====================================================

-- Academic year status
CREATE TYPE academic_year_status AS ENUM ('planning', 'active', 'completed', 'archived');

-- Term type enumeration
CREATE TYPE term_type AS ENUM ('semester', 'trimester', 'quarter', 'annual');

-- Grade level type
CREATE TYPE grade_level_type AS ENUM ('elementary', 'middle', 'high', 'special');

-- Subject type enumeration
CREATE TYPE subject_type AS ENUM ('core', 'elective', 'extracurricular', 'remedial', 'advanced');

-- Grade scale types
CREATE TYPE grade_scale_type AS ENUM ('percentage', 'letter', 'points', 'pass_fail');

-- Class section status
CREATE TYPE section_status AS ENUM ('planning', 'active', 'completed', 'suspended', 'cancelled');


-- Academic years
CREATE TABLE academic_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status academic_year_status DEFAULT 'planning',
    is_current BOOLEAN DEFAULT false,
    
    -- Core academic year details
    total_working_days INTEGER DEFAULT 200,
    total_holidays INTEGER DEFAULT 0,
    graduation_date DATE,
    enrollment_start_date DATE,
    enrollment_end_date DATE,
    
    -- Essential configuration (simplified JSONB)
    grade_scale_config JSONB DEFAULT '{"scale": "percentage", "passing_grade": 60}',
    attendance_policy JSONB DEFAULT '{"min_attendance": 75}',
    
    -- Metadata
    description TEXT,
    
    -- Audit fields
    created_by UUID REFERENCES users(id),   
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Essential constraints only
    CONSTRAINT chk_academic_year_dates CHECK (end_date > start_date),
    CONSTRAINT chk_working_days CHECK (total_working_days > 0 AND total_working_days <= 365),
    CONSTRAINT chk_holidays CHECK (total_holidays >= 0 AND total_holidays <= 100),
    CONSTRAINT chk_enrollment_dates CHECK (enrollment_start_date IS NULL OR enrollment_end_date IS NULL OR enrollment_end_date >= enrollment_start_date)
);

-- School terms/semesters
CREATE TABLE terms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    term_type term_type DEFAULT 'semester',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false,
    
    -- Core term details
    exam_period_start DATE,
    exam_period_end DATE,
    
    -- Metadata
    description TEXT,
    
    -- Audit fields
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_term_dates CHECK (end_date > start_date),
    CONSTRAINT chk_exam_period CHECK (exam_period_start IS NULL OR exam_period_end IS NULL OR exam_period_end >= exam_period_start),
    UNIQUE(academic_year_id, code)
);

-- Grade levels/classes
CREATE TABLE grade_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    level_order INTEGER NOT NULL,
    grade_level_type grade_level_type DEFAULT 'elementary',
    
    -- Metadata
    description TEXT,
    
    -- Audit fields
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_level_order CHECK (level_order > 0)
);

-- Class sections
CREATE TABLE class_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grade_level_id UUID NOT NULL REFERENCES grade_levels(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    code VARCHAR(20) NOT NULL,
    
    -- Capacity and enrollment
    capacity INTEGER DEFAULT 30,
    current_enrollment INTEGER DEFAULT 0,
    
    -- Academic year and term
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    term_id UUID REFERENCES terms(id) ON DELETE CASCADE,
    
    -- Section configuration
    status section_status DEFAULT 'planning',
    
    -- Teaching staff
    class_teacher_id UUID REFERENCES users(id),
    
    -- Status and tracking
    is_active BOOLEAN DEFAULT true,
    
    -- Audit fields
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_capacity CHECK (capacity > 0 AND capacity <= 100),
    CONSTRAINT chk_enrollment CHECK (current_enrollment >= 0 AND current_enrollment <= capacity),
    UNIQUE(grade_level_id, code, academic_year_id)
);

-- Subjects
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    subject_type subject_type DEFAULT 'core',
    
    -- Core subject details
    description TEXT,
    department VARCHAR(100),
    
    -- Status and tracking
    is_active BOOLEAN DEFAULT true,
    
    -- Audit fields
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Academic years indexes
CREATE INDEX idx_academic_years_status ON academic_years(status);
CREATE INDEX idx_academic_years_current ON academic_years(is_current) WHERE is_current = true;
CREATE INDEX idx_academic_years_dates ON academic_years(start_date, end_date);

-- Terms indexes
CREATE INDEX idx_terms_academic_year ON terms(academic_year_id);
CREATE INDEX idx_terms_current ON terms(is_current) WHERE is_current = true;
CREATE INDEX idx_terms_dates ON terms(start_date, end_date);

-- Grade levels indexes
CREATE INDEX idx_grade_levels_type ON grade_levels(grade_level_type);
CREATE INDEX idx_grade_levels_order ON grade_levels(level_order);

-- Class sections indexes
CREATE INDEX idx_class_sections_grade_level ON class_sections(grade_level_id);
CREATE INDEX idx_class_sections_academic_year ON class_sections(academic_year_id);
CREATE INDEX idx_class_sections_term ON class_sections(term_id);
CREATE INDEX idx_class_sections_status ON class_sections(status);
CREATE INDEX idx_class_sections_teacher ON class_sections(class_teacher_id);
CREATE INDEX idx_class_sections_active ON class_sections(is_active) WHERE is_active = true;

-- Subjects indexes
CREATE INDEX idx_subjects_type ON subjects(subject_type);
CREATE INDEX idx_subjects_department ON subjects(department);
CREATE INDEX idx_subjects_active ON subjects(is_active) WHERE is_active = true;


-- Audit trail indexes
CREATE INDEX idx_academic_years_created_by ON academic_years(created_by);
CREATE INDEX idx_academic_years_updated_by ON academic_years(updated_by);
CREATE INDEX idx_terms_created_by ON terms(created_by);
CREATE INDEX idx_terms_updated_by ON terms(updated_by);
CREATE INDEX idx_grade_levels_created_by ON grade_levels(created_by);
CREATE INDEX idx_grade_levels_updated_by ON grade_levels(updated_by);
CREATE INDEX idx_subjects_created_by ON subjects(created_by);
CREATE INDEX idx_subjects_updated_by ON subjects(updated_by);
CREATE INDEX idx_class_sections_created_by ON class_sections(created_by);
CREATE INDEX idx_class_sections_updated_by ON class_sections(updated_by);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for all tables
CREATE TRIGGER update_academic_years_updated_at BEFORE UPDATE ON academic_years FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_terms_updated_at BEFORE UPDATE ON terms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_grade_levels_updated_at BEFORE UPDATE ON grade_levels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_class_sections_updated_at BEFORE UPDATE ON class_sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Current academic year with terms
CREATE VIEW current_academic_year AS
SELECT 
    ay.*,
    COUNT(t.id) as term_count
FROM academic_years ay
LEFT JOIN terms t ON ay.id = t.academic_year_id
WHERE ay.is_current = true
GROUP BY ay.id;

-- Active class sections with enrollment info
CREATE VIEW active_class_sections AS
SELECT 
    cs.*,
    gl.name as grade_level_name,
    gl.code as grade_level_code,
    ay.name as academic_year_name,
    t.name as term_name
FROM class_sections cs
JOIN grade_levels gl ON cs.grade_level_id = gl.id
JOIN academic_years ay ON cs.academic_year_id = ay.id
LEFT JOIN terms t ON cs.term_id = t.id
WHERE cs.is_active = true;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE academic_years IS 'Academic years with their configuration and policies';
COMMENT ON TABLE terms IS 'Academic terms/semesters within academic years';
COMMENT ON TABLE grade_levels IS 'Grade levels with their academic requirements';
COMMENT ON TABLE subjects IS 'Subjects/courses offered by the institution';
COMMENT ON TABLE class_sections IS 'Class sections with enrollment and scheduling information';

COMMENT ON COLUMN academic_years.is_current IS 'Only one academic year should be current at a time';
COMMENT ON COLUMN terms.is_current IS 'Only one term should be current at a time';
COMMENT ON COLUMN class_sections.meeting_days IS 'Array of integers: 1=Monday, 2=Tuesday, ..., 7=Sunday';