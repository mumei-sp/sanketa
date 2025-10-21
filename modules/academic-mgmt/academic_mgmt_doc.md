# Academic Management System

### Core Tables
- **`academic_years`** - Academic year configuration with policies and enrollment periods
- **`terms`** - Academic terms/semesters within academic years
- **`grade_levels`** - Grade levels with academic requirements and ordering
- **`subjects`** - Subject/course catalog with department classification
- **`class_sections`** - Class sections with enrollment capacity and teacher assignment

## Key Features

### Indexes
- Academic years: status, current, dates
- Terms: academic_year_id, current, dates
- Grade levels: type, order
- Class sections: grade_level, academic_year, term, status, teacher, active
- Subjects: type, department, active

### Views
- **`current_academic_year`** - Current academic year with term count
- **`active_class_sections`** - Active sections with enrollment and academic info

### Triggers
- **`update_updated_at_column()`** - Auto-update timestamps for all tables

### Constraints
- Date validation (end_date > start_date)
- Capacity limits (1-100 students per section)
- Enrollment tracking (current_enrollment ≤ capacity)
- Working days validation (1-365 days)
- Unique constraints on codes and combinations

## Configuration
- **Grade Scale**: JSONB config for percentage/letter/points/pass_fail
- **Attendance Policy**: JSONB config for minimum attendance requirements
- **Enrollment Periods**: Start/end dates for student enrollment
- **Exam Periods**: Term-specific exam scheduling
