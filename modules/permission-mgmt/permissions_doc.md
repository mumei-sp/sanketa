# Permission Management System Documentation

## Role Hierarchy

```
Super Admin (Level 0)
├── Admin (Level 1)
│   ├── Principal (Level 2)
│   │   └── Teacher (Level 3)
│   └── Staff (Level 2)
│       ├── Librarian (Level 3)
│       ├── Counselor (Level 3)
│       └── Coordinator (Level 3)
├── Student (Level 4) - Independent
└── Parent (Level 4) - Independent
```

## Inheritance Logic

### How It Works:
1. **Direct Permissions**: Assigned directly to roles via `role_permissions` table
2. **Inherited Permissions**: Automatically inherited based on `inheritance_rule` and role hierarchy
3. **Conditional Inheritance**: Inherited based on specific conditions
4. **Security**: Dangerous permissions (delete, system admin) never inherited

### Inheritance Rules Explained:

#### `none`
- **Usage**: Critical system permissions
- **Behavior**: Never inherited, must be explicitly assigned
- **Examples**: `system.settings`, `users.delete`, `roles.delete`

#### `direct_only`
- **Usage**: Administrative permissions for immediate subordinates
- **Behavior**: Only direct children in hierarchy inherit
- **Examples**: `users.create`, `roles.assign`, `students.create`

#### `all_children`
- **Usage**: General access permissions
- **Behavior**: All descendants in hierarchy inherit
- **Examples**: `users.read`, `students.read`, `attendance.read`

#### `conditional`
- **Usage**: Context-dependent permissions
- **Behavior**: Inherited based on specific conditions (e.g., subject assignment, class responsibility)
- **Examples**: `grades.create`, `attendance.mark`, `assignments.grade`

## Permission Naming Convention

Format: `{module}.{resource}.{action}`

- **Module**: Functional area (system, users, students, etc.)
- **Resource**: Specific resource within module (books, grades, etc.)
- **Action**: Operation (create, read, update, delete, manage, etc.)

Examples:
- `users.create` - Create user accounts
- `library.books.issue` - Issue library books
- `academic.grades.update` - Update student grades