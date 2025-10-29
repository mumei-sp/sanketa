# Multi-Tenant Learning Management System
**Scope:** End-to-end architecture for a hybrid multi-tenant school management system that uses a Global (auth/routing) database and per-school isolated databases (schema-per-tenant or DB-per-tenant).

### Functionalities

- Single-sign on for users across multiple schools
- Support users with multiple roles across tenants (teacher, parent, staff)
- Strong isolation for tenant data; independent backups and migrations
- Scalable GlobalDB using caching, read replicas and sharding patterns


## Data Model (GlobalDB)
**Principle:** GlobalDB stores identity and lightweight mapping data only. No heavy domain data (students, marks, attendance).

## Tenant Data Model (SchoolDB)
**Principle:** All domain relationships live inside the tenant DB. This allows standard RDBMS foreign keys, constraints, and transactions for domain operations.
- Do not model domain FK relationships across GlobalDB and SchoolDBs.
- Question❓ Do I need to store roles in GlobalDB?

### Example Tables

- **students** (id PK, name, dob, roll_no, class_id, ...)
- **teachers** (id PK, name, email, subject_ids...)
- **classes** (id PK, name, teacher_id FK)
- **attendance** (id, student_id FK, class_id FK, date, status)
- **marks, fees, timetables, reports, attachments**
