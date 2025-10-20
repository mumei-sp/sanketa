# User Management System

## Tables

### Core Tables
- **`users`** - User accounts with authentication, status, contact info
- **`user_profiles`** - Extended profile data (personal info, address, preferences)
- **`user_communication_preferences`** - Notification and communication settings

### Specialized Tables
- **`students`** - Student academic info (ID, grade, admission details)
- **`teachers`** - Teacher professional info (employee ID, qualifications, department)
- **`parents`** - Parent/guardian info (occupation, workplace)

### Relationship Tables
- **`student_parents`** - Student-parent relationships (many-to-many)
- **`user_roles`** - User role assignments from permission system

## Key Features

### Indexes
- Users: email, username, status, phone, created_at
- Profiles: user_id, profile_type
- Students: profile_id, student_id, grade_level
- Teachers: profile_id, employee_id, department
- User roles: user_id, role_id, expiration_date

### Views
- `active_users_with_profiles` - Active users with profile data
- `students_with_parents` - Students with parent information
- `active_users` - Non-deleted users
- `users_with_preferences` - Users with communication preferences

### Triggers
- `update_updated_at_column()` - Auto-update timestamps
- `update_last_profile_update()` - Profile update tracking

### Constraints
- Email/username format validation
- Phone number format (+91XXXXXXXXXX)
- Date validation (no future dates)
- Profile type validation
- Name length requirements (min 3 chars)

## Integration
- **Permission System**: Links to roles table
- **Communication**: Notification preferences
- **Academic**: Student/teacher academic data

