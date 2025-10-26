# Time Table & Calendar Management System

## Tables

### Core Tables
- **`time_slots`** - Time periods in school day (periods, breaks, lunch)
- **`rooms`** - Physical locations for classes and events
- **`calendar_categories`** - Event categorization for organization and display
- **`calendar_events`** - Individual events/activities for teachers, students, and staff
- **`timetable`** - Weekly recurring patterns that generate calendar events
- **`event_attendees`** - Individual attendance tracking and RSVP management

## Table Relationships & Purpose

### 1. **`time_slots`**
- **Purpose**: Defines time periods in a school day
- **Contains**: Start time, end time, slot type (class/break/lunch), color for display
- **Used by**: `timetable` table to define when classes occur
- **Key Fields**: `start_time`, `end_time`, `slot_type`, `color`

### 2. **`rooms`**
- **Purpose**: Physical locations where classes/events take place
- **Contains**: Room number, building, capacity, room type (classroom/lab/library)
- **Used by**: Both `calendar_events` and `timetable` to specify location
- **Key Fields**: `room_number`, `building`, `capacity`, `room_type`

### 3. **`calendar_categories`**
- **Purpose**: Groups events by type for better organization and display
- **Contains**: Category name, color, icon, description
- **Used by**: `calendar_events` to categorize events
- **Key Fields**: `name`, `color`, `icon`, `description`

### 4. **`calendar_events`**
- **Purpose**: Individual events/activities for teachers, students, and staff
- **Contains**: Event details, timing, location, academic context, visibility
- **Types**: Classes, exams, meetings, holidays, special events
- **Used by**: `timetable` table references these events
- **Key Fields**: `title`, `start_datetime`, `end_datetime`, `event_type`, `visibility`

### 5. **`timetable`**
- **Purpose**: Weekly recurring patterns that generate calendar events
- **Contains**: Which class, subject, teacher, time slot, day of week, room
- **Relationship**: References `calendar_events` and `time_slots`
- **Key Fields**: `class_section_id`, `subject_id`, `teacher_id`, `time_slot_id`, `day_of_week`

### 6. **`event_attendees`**
- **Purpose**: Individual attendance tracking and RSVP management for events
- **Contains**: User attendance, response status, role assignment, response notes
- **Relationship**: Links `calendar_events` to `users` with attendance details
- **Key Fields**: `event_id`, `user_id`, `role`, `response_status`, `response_notes`

## Data Flow

```
time_slots + rooms + academic_data → timetable → calendar_events → event_attendees
```

1. **`timetable`** defines the weekly pattern (e.g., "Math class every Monday 8:00-8:45 in Room 101")
2. **`calendar_events`** are generated from timetable entries for specific dates
3. **`calendar_categories`** help organize and display these events
4. **`event_attendees`** tracks individual participation and responses for each event

## Event Attendees Management

### Purpose
The `event_attendees` table provides individual attendance tracking and RSVP management for events, allowing schools to:
- Track who is supposed to attend each event
- Manage RSVP responses (accept/decline/tentative)
- Assign different roles to attendees
- Record response notes and timestamps

### Key Features
- **Individual Tracking**: Track each person's attendance for specific events
- **RSVP System**: Users can accept, decline, or mark tentative for events
- **Role Assignment**: Distinguish between organizers, required attendees, and optional attendees
- **Response Notes**: Allow users to add notes when responding to events
- **Response Timestamps**: Track when users responded to invitations
