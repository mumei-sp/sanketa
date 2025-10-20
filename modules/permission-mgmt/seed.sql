-- =====================================================
--  PERMISSION MANAGEMENT SYSTEM - SEED DATA
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
--  ROLES SEED DATA
-- =====================================================

-- Insert roles in hierarchy order (parent roles first)
-- Using uuid_generate_v4() for dynamic UUID generation
INSERT INTO roles (name, display_name, description, parent_role_id, hierarchy_level, is_system_role, is_active) VALUES
-- Level 0: Super Admin (Root role)
('super_admin', 'Super Administrator', 'Highest level system administrator with full access', NULL, 0, true, true),

-- Level 1: Admin (Child of Super Admin)
('admin', 'Administrator', 'System administrator with broad administrative privileges', NULL, 1, true, true),

-- Level 2: Principal and Staff (Children of Admin)
('principal', 'Principal', 'School principal with academic and administrative oversight', NULL, 2, false, true),
('staff', 'Staff Member', 'General staff member with specific departmental access', NULL, 2, false, true),

-- Level 3: Teacher and Specialized Staff (Children of Principal/Staff)
('teacher', 'Teacher', 'Classroom teacher with subject-specific permissions', NULL, 3, false, true),
('librarian', 'Librarian', 'Library staff with resource management permissions', NULL, 3, false, true),
('counselor', 'Counselor', 'Student counselor with access to student records', NULL, 3, false, true),
('coordinator', 'Coordinator', 'Academic coordinator with program management access', NULL, 3, false, true),

-- Level 4: Student and Parent (Independent roles)
('student', 'Student', 'Student with limited access to own records and assignments', NULL, 4, false, true),
('parent', 'Parent/Guardian', 'Parent with access to child''s academic information', NULL, 4, false, true);

-- Update parent_role_id relationships after all roles are inserted
UPDATE roles SET parent_role_id = (SELECT id FROM roles WHERE name = 'super_admin') WHERE name = 'admin';
UPDATE roles SET parent_role_id = (SELECT id FROM roles WHERE name = 'admin') WHERE name IN ('principal', 'staff');
UPDATE roles SET parent_role_id = (SELECT id FROM roles WHERE name = 'principal') WHERE name = 'teacher';
UPDATE roles SET parent_role_id = (SELECT id FROM roles WHERE name = 'staff') WHERE name IN ('librarian', 'counselor', 'coordinator');

-- =====================================================
--  PERMISSIONS SEED DATA
-- =====================================================

-- System Management Permissions
INSERT INTO permissions (name, description, category, module, inheritable, inheritance_rule, is_active) VALUES
('system.settings', 'Configure system-wide settings and preferences', 'administration', 'system', false, 'none', true),
('system.backup', 'Create and restore system backups', 'administration', 'system', false, 'none', true),
('system.logs', 'View system logs and audit trails', 'administration', 'system', false, 'none', true),
('system.maintenance', 'Perform system maintenance tasks', 'administration', 'system', false, 'none', true);

-- User Management Permissions
INSERT INTO permissions (name, description, category, module, inheritable, inheritance_rule, is_active) VALUES
('users.create', 'Create new user accounts', 'administration', 'users', true, 'direct_only', true),
('users.read', 'View user information and profiles', 'administration', 'users', true, 'all_children', true),
('users.update', 'Modify user information and settings', 'administration', 'users', true, 'direct_only', true),
('users.delete', 'Delete user accounts permanently', 'administration', 'users', false, 'none', true),
('users.activate', 'Activate or deactivate user accounts', 'administration', 'users', true, 'direct_only', true),
('users.reset_password', 'Reset user passwords', 'administration', 'users', true, 'direct_only', true);

-- Role Management Permissions
INSERT INTO permissions (name, description, category, module, inheritable, inheritance_rule, is_active) VALUES
('roles.create', 'Create new roles and role definitions', 'administration', 'roles', true, 'direct_only', true),
('roles.read', 'View role information and permissions', 'administration', 'roles', true, 'all_children', true),
('roles.update', 'Modify role properties and settings', 'administration', 'roles', true, 'direct_only', true),
('roles.delete', 'Delete roles permanently', 'administration', 'roles', false, 'none', true),
('roles.assign', 'Assign roles to users', 'administration', 'roles', true, 'direct_only', true),
('roles.permissions', 'Manage role permissions and access', 'administration', 'roles', true, 'direct_only', true);

-- Student Management Permissions
INSERT INTO permissions (name, description, category, module, inheritable, inheritance_rule, is_active) VALUES
('students.create', 'Enroll new students in the system', 'academic', 'students', true, 'direct_only', true),
('students.read', 'View student information and records', 'academic', 'students', true, 'all_children', true),
('students.update', 'Modify student records and information', 'academic', 'students', true, 'direct_only', true),
('students.delete', 'Remove students from the system', 'academic', 'students', false, 'none', true),
('students.promote', 'Promote students to next grade level', 'academic', 'students', true, 'direct_only', true),
('students.transfer', 'Transfer students between classes or sections', 'academic', 'students', true, 'direct_only', true);

-- Academic Management Permissions
INSERT INTO permissions (name, description, category, module, inheritable, inheritance_rule, is_active) VALUES
('grades.create', 'Create and assign grades to students', 'education', 'academic', true, 'conditional', true),
('grades.read', 'View grades and academic reports', 'education', 'academic', true, 'all_children', true),
('grades.update', 'Modify existing grades and assessments', 'education', 'academic', true, 'conditional', true),
('grades.delete', 'Delete grade records permanently', 'education', 'academic', false, 'none', true),
('attendance.mark', 'Mark student attendance', 'education', 'academic', true, 'conditional', true),
('attendance.read', 'View attendance records and reports', 'education', 'academic', true, 'all_children', true),
('assignments.create', 'Create assignments and assessments', 'education', 'academic', true, 'conditional', true),
('assignments.grade', 'Grade student assignments and submissions', 'education', 'academic', true, 'conditional', true);

-- Library Management Permissions
INSERT INTO permissions (name, description, category, module, inheritable, inheritance_rule, is_active) VALUES
('library.books.manage', 'Manage book inventory and catalog', 'resources', 'library', true, 'direct_only', true),
('library.books.issue', 'Issue books to students and staff', 'resources', 'library', true, 'all_children', true),
('library.books.return', 'Process book returns and renewals', 'resources', 'library', true, 'all_children', true),
('library.reports', 'Generate library reports and analytics', 'resources', 'library', true, 'direct_only', true);

-- Communication Permissions
INSERT INTO permissions (name, description, category, module, inheritable, inheritance_rule, is_active) VALUES
('messages.send', 'Send messages to users and groups', 'messaging', 'communication', true, 'all_children', true),
('messages.broadcast', 'Send broadcast messages to all users', 'messaging', 'communication', true, 'direct_only', true),
('announcements.create', 'Create announcements and notices', 'messaging', 'communication', true, 'direct_only', true),
('announcements.publish', 'Publish announcements to the system', 'messaging', 'communication', true, 'direct_only', true);

-- Reports and Analytics Permissions
INSERT INTO permissions (name, description, category, module, inheritable, inheritance_rule, is_active) VALUES
('reports.academic', 'Generate academic reports and transcripts', 'analytics', 'reports', true, 'conditional', true),
('reports.financial', 'Generate financial reports and statements', 'analytics', 'reports', false, 'none', true),
('reports.attendance', 'Generate attendance reports and summaries', 'analytics', 'reports', true, 'conditional', true),
('reports.performance', 'Generate performance analytics and insights', 'analytics', 'reports', true, 'conditional', true);

-- =====================================================
--  ROLE-PERMISSION MAPPINGS
-- =====================================================

-- Super Admin: All permissions
INSERT INTO role_permissions (role_id, permission_id, granted) 
SELECT (SELECT id FROM roles WHERE name = 'super_admin'), id, true FROM permissions WHERE is_active = true;

-- Admin: Most permissions except critical system functions
INSERT INTO role_permissions (role_id, permission_id, granted) VALUES
-- User Management
((SELECT id FROM roles WHERE name = 'admin'), (SELECT id FROM permissions WHERE name = 'users.create'), true),
((SELECT id FROM roles WHERE name = 'admin'), (SELECT id FROM permissions WHERE name = 'users.read'), true),
((SELECT id FROM roles WHERE name = 'admin'), (SELECT id FROM permissions WHERE name = 'users.update'), true),
((SELECT id FROM roles WHERE name = 'admin'), (SELECT id FROM permissions WHERE name = 'users.activate'), true),
((SELECT id FROM roles WHERE name = 'admin'), (SELECT id FROM permissions WHERE name = 'users.reset_password'), true),

-- Role Management
((SELECT id FROM roles WHERE name = 'admin'), (SELECT id FROM permissions WHERE name = 'roles.create'), true),
((SELECT id FROM roles WHERE name = 'admin'), (SELECT id FROM permissions WHERE name = 'roles.read'), true),
((SELECT id FROM roles WHERE name = 'admin'), (SELECT id FROM permissions WHERE name = 'roles.update'), true),
((SELECT id FROM roles WHERE name = 'admin'), (SELECT id FROM permissions WHERE name = 'roles.assign'), true),
((SELECT id FROM roles WHERE name = 'admin'), (SELECT id FROM permissions WHERE name = 'roles.permissions'), true),

-- Student Management
((SELECT id FROM roles WHERE name = 'admin'), (SELECT id FROM permissions WHERE name = 'students.create'), true),
((SELECT id FROM roles WHERE name = 'admin'), (SELECT id FROM permissions WHERE name = 'students.read'), true),
((SELECT id FROM roles WHERE name = 'admin'), (SELECT id FROM permissions WHERE name = 'students.update'), true),
((SELECT id FROM roles WHERE name = 'admin'), (SELECT id FROM permissions WHERE name = 'students.promote'), true),
((SELECT id FROM roles WHERE name = 'admin'), (SELECT id FROM permissions WHERE name = 'students.transfer'), true),

-- Academic Management
((SELECT id FROM roles WHERE name = 'admin'), (SELECT id FROM permissions WHERE name = 'grades.create'), true),
((SELECT id FROM roles WHERE name = 'admin'), (SELECT id FROM permissions WHERE name = 'grades.read'), true),
((SELECT id FROM roles WHERE name = 'admin'), (SELECT id FROM permissions WHERE name = 'grades.update'), true),
((SELECT id FROM roles WHERE name = 'admin'), (SELECT id FROM permissions WHERE name = 'attendance.mark'), true),
((SELECT id FROM roles WHERE name = 'admin'), (SELECT id FROM permissions WHERE name = 'attendance.read'), true),
((SELECT id FROM roles WHERE name = 'admin'), (SELECT id FROM permissions WHERE name = 'assignments.create'), true),
((SELECT id FROM roles WHERE name = 'admin'), (SELECT id FROM permissions WHERE name = 'assignments.grade'), true),

-- Library Management
((SELECT id FROM roles WHERE name = 'admin'), (SELECT id FROM permissions WHERE name = 'library.books.manage'), true),
((SELECT id FROM roles WHERE name = 'admin'), (SELECT id FROM permissions WHERE name = 'library.books.issue'), true),
((SELECT id FROM roles WHERE name = 'admin'), (SELECT id FROM permissions WHERE name = 'library.books.return'), true),
((SELECT id FROM roles WHERE name = 'admin'), (SELECT id FROM permissions WHERE name = 'library.reports'), true),

-- Communication
((SELECT id FROM roles WHERE name = 'admin'), (SELECT id FROM permissions WHERE name = 'messages.send'), true),
((SELECT id FROM roles WHERE name = 'admin'), (SELECT id FROM permissions WHERE name = 'messages.broadcast'), true),
((SELECT id FROM roles WHERE name = 'admin'), (SELECT id FROM permissions WHERE name = 'announcements.create'), true),
((SELECT id FROM roles WHERE name = 'admin'), (SELECT id FROM permissions WHERE name = 'announcements.publish'), true),

-- Reports
((SELECT id FROM roles WHERE name = 'admin'), (SELECT id FROM permissions WHERE name = 'reports.academic'), true),
((SELECT id FROM roles WHERE name = 'admin'), (SELECT id FROM permissions WHERE name = 'reports.attendance'), true),
((SELECT id FROM roles WHERE name = 'admin'), (SELECT id FROM permissions WHERE name = 'reports.performance'), true);

-- Principal: Academic and administrative permissions
INSERT INTO role_permissions (role_id, permission_id, granted) VALUES
-- User Management (inherited from admin)
((SELECT id FROM roles WHERE name = 'principal'), (SELECT id FROM permissions WHERE name = 'users.read'), true),
((SELECT id FROM roles WHERE name = 'principal'), (SELECT id FROM permissions WHERE name = 'users.update'), true),
((SELECT id FROM roles WHERE name = 'principal'), (SELECT id FROM permissions WHERE name = 'users.activate'), true),

-- Student Management
((SELECT id FROM roles WHERE name = 'principal'), (SELECT id FROM permissions WHERE name = 'students.create'), true),
((SELECT id FROM roles WHERE name = 'principal'), (SELECT id FROM permissions WHERE name = 'students.read'), true),
((SELECT id FROM roles WHERE name = 'principal'), (SELECT id FROM permissions WHERE name = 'students.update'), true),
((SELECT id FROM roles WHERE name = 'principal'), (SELECT id FROM permissions WHERE name = 'students.promote'), true),
((SELECT id FROM roles WHERE name = 'principal'), (SELECT id FROM permissions WHERE name = 'students.transfer'), true),

-- Academic Management
((SELECT id FROM roles WHERE name = 'principal'), (SELECT id FROM permissions WHERE name = 'grades.create'), true),
((SELECT id FROM roles WHERE name = 'principal'), (SELECT id FROM permissions WHERE name = 'grades.read'), true),
((SELECT id FROM roles WHERE name = 'principal'), (SELECT id FROM permissions WHERE name = 'grades.update'), true),
((SELECT id FROM roles WHERE name = 'principal'), (SELECT id FROM permissions WHERE name = 'attendance.mark'), true),
((SELECT id FROM roles WHERE name = 'principal'), (SELECT id FROM permissions WHERE name = 'attendance.read'), true),
((SELECT id FROM roles WHERE name = 'principal'), (SELECT id FROM permissions WHERE name = 'assignments.create'), true),
((SELECT id FROM roles WHERE name = 'principal'), (SELECT id FROM permissions WHERE name = 'assignments.grade'), true),

-- Communication
((SELECT id FROM roles WHERE name = 'principal'), (SELECT id FROM permissions WHERE name = 'messages.send'), true),
((SELECT id FROM roles WHERE name = 'principal'), (SELECT id FROM permissions WHERE name = 'announcements.create'), true),
((SELECT id FROM roles WHERE name = 'principal'), (SELECT id FROM permissions WHERE name = 'announcements.publish'), true),

-- Reports
((SELECT id FROM roles WHERE name = 'principal'), (SELECT id FROM permissions WHERE name = 'reports.academic'), true),
((SELECT id FROM roles WHERE name = 'principal'), (SELECT id FROM permissions WHERE name = 'reports.attendance'), true),
((SELECT id FROM roles WHERE name = 'principal'), (SELECT id FROM permissions WHERE name = 'reports.performance'), true);

-- Staff: General staff permissions
INSERT INTO role_permissions (role_id, permission_id, granted) VALUES
-- User Management (read-only)
((SELECT id FROM roles WHERE name = 'staff'), (SELECT id FROM permissions WHERE name = 'users.read'), true),

-- Student Management (read-only)
((SELECT id FROM roles WHERE name = 'staff'), (SELECT id FROM permissions WHERE name = 'students.read'), true),

-- Academic Management (read-only)
((SELECT id FROM roles WHERE name = 'staff'), (SELECT id FROM permissions WHERE name = 'grades.read'), true),
((SELECT id FROM roles WHERE name = 'staff'), (SELECT id FROM permissions WHERE name = 'attendance.read'), true),

-- Communication
((SELECT id FROM roles WHERE name = 'staff'), (SELECT id FROM permissions WHERE name = 'messages.send'), true);

-- Teacher: Subject-specific academic permissions
INSERT INTO role_permissions (role_id, permission_id, granted) VALUES
-- Student Management (read-only)
((SELECT id FROM roles WHERE name = 'teacher'), (SELECT id FROM permissions WHERE name = 'students.read'), true),

-- Academic Management (conditional based on subject assignment)
((SELECT id FROM roles WHERE name = 'teacher'), (SELECT id FROM permissions WHERE name = 'grades.create'), true),
((SELECT id FROM roles WHERE name = 'teacher'), (SELECT id FROM permissions WHERE name = 'grades.read'), true),
((SELECT id FROM roles WHERE name = 'teacher'), (SELECT id FROM permissions WHERE name = 'grades.update'), true),
((SELECT id FROM roles WHERE name = 'teacher'), (SELECT id FROM permissions WHERE name = 'attendance.mark'), true),
((SELECT id FROM roles WHERE name = 'teacher'), (SELECT id FROM permissions WHERE name = 'attendance.read'), true),
((SELECT id FROM roles WHERE name = 'teacher'), (SELECT id FROM permissions WHERE name = 'assignments.create'), true),
((SELECT id FROM roles WHERE name = 'teacher'), (SELECT id FROM permissions WHERE name = 'assignments.grade'), true),

-- Communication
((SELECT id FROM roles WHERE name = 'teacher'), (SELECT id FROM permissions WHERE name = 'messages.send'), true);

-- Librarian: Library-specific permissions
INSERT INTO role_permissions (role_id, permission_id, granted) VALUES
-- Student Management (read-only)
((SELECT id FROM roles WHERE name = 'librarian'), (SELECT id FROM permissions WHERE name = 'students.read'), true),

-- Library Management
((SELECT id FROM roles WHERE name = 'librarian'), (SELECT id FROM permissions WHERE name = 'library.books.manage'), true),
((SELECT id FROM roles WHERE name = 'librarian'), (SELECT id FROM permissions WHERE name = 'library.books.issue'), true),
((SELECT id FROM roles WHERE name = 'librarian'), (SELECT id FROM permissions WHERE name = 'library.books.return'), true),
((SELECT id FROM roles WHERE name = 'librarian'), (SELECT id FROM permissions WHERE name = 'library.reports'), true),

-- Communication
((SELECT id FROM roles WHERE name = 'librarian'), (SELECT id FROM permissions WHERE name = 'messages.send'), true);

-- Counselor: Student support permissions
INSERT INTO role_permissions (role_id, permission_id, granted) VALUES
-- Student Management (read and limited update)
((SELECT id FROM roles WHERE name = 'counselor'), (SELECT id FROM permissions WHERE name = 'students.read'), true),
((SELECT id FROM roles WHERE name = 'counselor'), (SELECT id FROM permissions WHERE name = 'students.update'), true),

-- Academic Management (read-only)
((SELECT id FROM roles WHERE name = 'counselor'), (SELECT id FROM permissions WHERE name = 'grades.read'), true),
((SELECT id FROM roles WHERE name = 'counselor'), (SELECT id FROM permissions WHERE name = 'attendance.read'), true),

-- Communication
((SELECT id FROM roles WHERE name = 'counselor'), (SELECT id FROM permissions WHERE name = 'messages.send'), true);

-- Coordinator: Program management permissions
INSERT INTO role_permissions (role_id, permission_id, granted) VALUES
-- Student Management (read and limited update)
((SELECT id FROM roles WHERE name = 'coordinator'), (SELECT id FROM permissions WHERE name = 'students.read'), true),
((SELECT id FROM roles WHERE name = 'coordinator'), (SELECT id FROM permissions WHERE name = 'students.update'), true),

-- Academic Management
((SELECT id FROM roles WHERE name = 'coordinator'), (SELECT id FROM permissions WHERE name = 'grades.create'), true),
((SELECT id FROM roles WHERE name = 'coordinator'), (SELECT id FROM permissions WHERE name = 'grades.read'), true),
((SELECT id FROM roles WHERE name = 'coordinator'), (SELECT id FROM permissions WHERE name = 'grades.update'), true),
((SELECT id FROM roles WHERE name = 'coordinator'), (SELECT id FROM permissions WHERE name = 'attendance.mark'), true),
((SELECT id FROM roles WHERE name = 'coordinator'), (SELECT id FROM permissions WHERE name = 'attendance.read'), true),
((SELECT id FROM roles WHERE name = 'coordinator'), (SELECT id FROM permissions WHERE name = 'assignments.create'), true),
((SELECT id FROM roles WHERE name = 'coordinator'), (SELECT id FROM permissions WHERE name = 'assignments.grade'), true),

-- Communication
((SELECT id FROM roles WHERE name = 'coordinator'), (SELECT id FROM permissions WHERE name = 'messages.send'), true),
((SELECT id FROM roles WHERE name = 'coordinator'), (SELECT id FROM permissions WHERE name = 'announcements.create'), true),

-- Reports
((SELECT id FROM roles WHERE name = 'coordinator'), (SELECT id FROM permissions WHERE name = 'reports.academic'), true),
((SELECT id FROM roles WHERE name = 'coordinator'), (SELECT id FROM permissions WHERE name = 'reports.attendance'), true);

-- Student: Limited access to own records
INSERT INTO role_permissions (role_id, permission_id, granted) VALUES
-- Academic Management (own records only)
((SELECT id FROM roles WHERE name = 'student'), (SELECT id FROM permissions WHERE name = 'grades.read'), true),
((SELECT id FROM roles WHERE name = 'student'), (SELECT id FROM permissions WHERE name = 'attendance.read'), true),

-- Communication
((SELECT id FROM roles WHERE name = 'student'), (SELECT id FROM permissions WHERE name = 'messages.send'), true);

-- Parent: Access to child's academic information
INSERT INTO role_permissions (role_id, permission_id, granted) VALUES
-- Academic Management (child's records only)
((SELECT id FROM roles WHERE name = 'parent'), (SELECT id FROM permissions WHERE name = 'grades.read'), true),
((SELECT id FROM roles WHERE name = 'parent'), (SELECT id FROM permissions WHERE name = 'attendance.read'), true),

-- Communication
((SELECT id FROM roles WHERE name = 'parent'), (SELECT id FROM permissions WHERE name = 'messages.send'), true);

-- =====================================================
--  VERIFICATION QUERIES
-- =====================================================

-- Verify role hierarchy
SELECT 
    r.name as role_name,
    r.display_name,
    r.hierarchy_level,
    parent.name as parent_role,
    r.is_system_role
FROM roles r
LEFT JOIN roles parent ON r.parent_role_id = parent.id
ORDER BY r.hierarchy_level, r.name;

-- Verify permissions by category
SELECT 
    category,
    module,
    COUNT(*) as permission_count,
    STRING_AGG(name, ', ' ORDER BY name) as permissions
FROM permissions 
WHERE is_active = true
GROUP BY category, module
ORDER BY category, module;

-- Verify role-permission mappings
SELECT 
    r.name as role_name,
    r.hierarchy_level,
    COUNT(rp.permission_id) as permission_count,
    STRING_AGG(p.name, ', ' ORDER BY p.name) as permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id AND rp.granted = true
LEFT JOIN permissions p ON rp.permission_id = p.id
WHERE r.is_active = true
GROUP BY r.id, r.name, r.hierarchy_level
ORDER BY r.hierarchy_level, r.name;
