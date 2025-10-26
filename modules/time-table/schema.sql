
-- =====================================================
--  TIME TABLE & CALENDAR MANAGEMENT SYSTEM
-- =====================================================


CREATE TYPE slot_type_enum AS ENUM ('class', 'break', 'lunch', 'assembly', 'free');
CREATE TYPE event_type_enum AS ENUM ('class', 'exam', 'meeting', 'event', 'holiday', 'break');
CREATE TYPE event_status_enum AS ENUM ('scheduled', 'ongoing', 'completed', 'cancelled', 'postponed');
CREATE TYPE event_priority_enum AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE event_visibility_enum AS ENUM ('public', 'private', 'class_only', 'teachers_only');
CREATE TYPE attendee_role_enum AS ENUM ('organizer', 'attendee', 'optional', 'required');
CREATE TYPE response_status_enum AS ENUM ('pending', 'accepted', 'declined', 'tentative');
CREATE TYPE room_type_enum AS ENUM ('classroom', 'lab', 'library', 'auditorium', 'gym', 'office');

-- =====================================================
--  CORE SCHEDULING TABLES
-- =====================================================

-- Time slots - defines periods in school day
CREATE TABLE time_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_type slot_type_enum DEFAULT 'class',
    color VARCHAR(7), -- Hex color for calendar display
    is_active BOOLEAN DEFAULT true,
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_time_slot_duration CHECK (end_time > start_time)
);

-- Rooms - physical locations for classes and events
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_number VARCHAR(20) NOT NULL,
    room_name VARCHAR(100),
    building VARCHAR(100),
    floor INTEGER,
    capacity INTEGER,
    room_type room_type_enum DEFAULT 'classroom',
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_room_capacity CHECK (capacity > 0),
    UNIQUE(room_number, building)
);

-- Calendar categories - event categorization for organization and display
CREATE TABLE calendar_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL, -- Hex color code
    icon VARCHAR(50), -- Icon name for UI
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
--  CALENDAR EVENTS MANAGEMENT
-- =====================================================

-- Calendar events - main events table for all scheduled activities
CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_type event_type_enum NOT NULL,
    category_id UUID REFERENCES calendar_categories(id) ON DELETE SET NULL,
    
    -- Time and scheduling
    start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    is_all_day BOOLEAN DEFAULT false,
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Location and resources
    location VARCHAR(200),
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    
    -- Academic context
    class_section_id UUID REFERENCES class_sections(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    term_id UUID REFERENCES terms(id) ON DELETE CASCADE,
    
    -- Event details
    max_attendees INTEGER,
    is_mandatory BOOLEAN DEFAULT false,
    requires_attendance BOOLEAN DEFAULT false,
    is_online BOOLEAN DEFAULT false,
    meeting_link VARCHAR(500), -- For online events
    
    -- Visibility and permissions
    visibility event_visibility_enum DEFAULT 'public',
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Status and metadata
    status event_status_enum DEFAULT 'scheduled',
    priority event_priority_enum DEFAULT 'normal',
    
    -- Notification settings
    reminder_minutes INTEGER DEFAULT 15, -- Minutes before event to remind
    
    -- Audit fields
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_datetime CHECK (end_datetime > start_datetime),
    CONSTRAINT valid_reminder CHECK (reminder_minutes >= 0)
);

-- =====================================================
--  TIMETABLE MANAGEMENT
-- =====================================================

-- Timetable entries - weekly patterns that generate calendar events
CREATE TABLE timetable (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    calendar_event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
    class_section_id UUID NOT NULL REFERENCES class_sections(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    time_slot_id UUID NOT NULL REFERENCES time_slots(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL, -- 1=Monday, 7=Sunday
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    term_id UUID REFERENCES terms(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_day_of_week CHECK (day_of_week >= 1 AND day_of_week <= 7),
    UNIQUE(class_section_id, time_slot_id, day_of_week, academic_year_id)
);


-- =====================================================
--  EVENT ATTENDANCE MANAGEMENT
-- =====================================================

-- Event attendees - individual attendance tracking and RSVP management
CREATE TABLE event_attendees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role attendee_role_enum DEFAULT 'attendee',
    response_status response_status_enum DEFAULT 'pending',
    response_notes TEXT,
    responded_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(event_id, user_id)
);


-- =====================================================
--  INDEXES FOR PERFORMANCE
-- =====================================================

-- Time slots indexes
CREATE INDEX idx_time_slots_academic_year ON time_slots(academic_year_id);
CREATE INDEX idx_time_slots_type ON time_slots(slot_type);
CREATE INDEX idx_time_slots_active ON time_slots(is_active);

-- Rooms indexes
CREATE INDEX idx_rooms_building ON rooms(building);
CREATE INDEX idx_rooms_type ON rooms(room_type);
CREATE INDEX idx_rooms_active ON rooms(is_active);

-- Calendar events indexes
CREATE INDEX idx_calendar_events_start_datetime ON calendar_events(start_datetime);
CREATE INDEX idx_calendar_events_end_datetime ON calendar_events(end_datetime);
CREATE INDEX idx_calendar_events_type ON calendar_events(event_type);
CREATE INDEX idx_calendar_events_status ON calendar_events(status);
CREATE INDEX idx_calendar_events_visibility ON calendar_events(visibility);
CREATE INDEX idx_calendar_events_class_section ON calendar_events(class_section_id);
CREATE INDEX idx_calendar_events_teacher ON calendar_events(teacher_id);
CREATE INDEX idx_calendar_events_room ON calendar_events(room_id);
CREATE INDEX idx_calendar_events_academic_year ON calendar_events(academic_year_id);
CREATE INDEX idx_calendar_events_created_by ON calendar_events(created_by);

-- Timetable indexes
CREATE INDEX idx_timetable_class_section ON timetable(class_section_id);
CREATE INDEX idx_timetable_teacher ON timetable(teacher_id);
CREATE INDEX idx_timetable_time_slot ON timetable(time_slot_id);
CREATE INDEX idx_timetable_day_of_week ON timetable(day_of_week);
CREATE INDEX idx_timetable_academic_year ON timetable(academic_year_id);
CREATE INDEX idx_timetable_active ON timetable(is_active);

-- Event attendees indexes
CREATE INDEX idx_event_attendees_event ON event_attendees(event_id);
CREATE INDEX idx_event_attendees_user ON event_attendees(user_id);
CREATE INDEX idx_event_attendees_role ON event_attendees(role);
CREATE INDEX idx_event_attendees_status ON event_attendees(response_status);


-- =====================================================
--  TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all tables with updated_at column
CREATE TRIGGER update_time_slots_updated_at BEFORE UPDATE ON time_slots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timetable_updated_at BEFORE UPDATE ON timetable
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();