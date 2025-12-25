# Sanketa — The Bridge Between Communication and Insight

**Sanketa** is a comprehensive school management system that bridges communication and insight across educational institutions.  
It centralizes student, staff, and administrative operations into a single unified platform — improving collaboration, transparency, and efficiency in daily school management.

## Vision

To empower schools and educational institutions with intelligent, connected, and data-driven tools that enhance communication, streamline operations, and inspire better learning outcomes.

## Project Structure

```
src/
├── components/           # Global reusable UI components
│   ├── ui/               # shadcn-generated components
│   ├── form/             # Form abstractions & wrappers
│   ├── inputs/           # Input components (EmailInput, PhoneInput)
│   ├── layout/           # Page/section layout components
│   └── cards/            # Card-like structural components
│
├── features/             # Feature-based domain modules
│   └── students/
│       ├── components/   # Page-specific components (StudentFormSection)
│       ├── hooks/        # Custom hooks (useStudentForm)
│       ├── types/        # Domain data models
│       └── pages/
│           └── AddStudent.tsx
│
├── pages/                # Routing layer (React Router pages)
│
├── lib/                  # Utilities, form validators, formatters
│   └── utils.ts
│
├── hooks/                # Global reusable hooks
│
├── types/                # Global/shared TypeScript types
│
├── data/                 # Data types and mock data
│   ├── mocks/            # Mock data for development/testing
│   │   ├── students.ts          # Mock student data
│   │   └── student-dashboard.ts # Mock student dashboard data (attendance, enrollment)
│   └── dashboard.ts      # Dashboard data type definitions
│
├── api/                  # API client & service functions
│   └── services/
│
├── store/                # State management (Zustand/Redux)
│
├── constants/            # App-wide constants
│
├── providers/            # React context providers
│
└── assets/               # Static assets (images, icons, etc.)
```

### Architecture Principles

- **Feature-based organization**: Domain logic is grouped by feature (e.g., `students/`, `staff/`, `classes/`)
- **Component hierarchy**: Global components at root `components/`, feature-specific in `features/*/components/`
- **Separation of concerns**: UI, business logic, data fetching, and state management are clearly separated
- **Reusability**: Shared utilities, hooks, and components are placed at the root level

## Naming Conventions

This project follows consistent naming conventions to maintain code clarity and consistency across the codebase.

### File Naming

- **React Components**: Use PascalCase for component files
  - ✅ `StudentForm.tsx`, `DataTable.tsx`, `PageHeader.tsx`
  - ❌ `student-form.tsx`, `data-table.tsx`

- **Service Files**: Use kebab-case with `-service.ts` suffix
  - ✅ `dashboard-service.ts`, `student-service.ts`
  - ❌ `dashboardService.ts`, `student.service.ts`

- **Data Files**: Use kebab-case with `-data.ts` suffix
  - ✅ `student-data.ts`, `dashboard-data.ts`
  - ❌ `student.data.ts`, `studentData.ts`

- **Type Files**: Use kebab-case with `-types.ts` suffix
  - ✅ `student-types.ts`, `api-types.ts`
  - ❌ `student.types.ts`, `studentTypes.ts`

- **Schema Files**: Use kebab-case with `-schema.ts` suffix
  - ✅ `student-schema.ts`, `user-schema.ts`
  - ❌ `student.schema.ts`, `studentSchema.ts`

- **Hooks**: Use kebab-case with `use-` prefix
  - ✅ `use-mobile.ts`, `use-student-form.ts`
  - ❌ `useMobile.ts`, `useStudentForm.ts`

- **Utility Files**: Use kebab-case
  - ✅ `error-handler.ts`, `query-params.ts`, `auth.ts`
  - ❌ `errorHandler.ts`, `queryParams.ts`

- **UI Components (shadcn)**: Use kebab-case (maintained from shadcn/ui)
  - ✅ `dropdown-menu.tsx`, `radio-group.tsx`, `button.tsx`
  - ❌ `DropdownMenu.tsx`, `RadioGroup.tsx`

### Directory Naming

- Use lowercase with kebab-case for multi-word directories
  - ✅ `components/`, `features/`, `student-management/`
  - ❌ `Components/`, `StudentManagement/`

### Summary

| File Type        | Convention                 | Example                            |
| ---------------- | -------------------------- | ---------------------------------- |
| React Components | PascalCase                 | `StudentForm.tsx`                  |
| Services         | kebab-case + `-service.ts` | `dashboard-service.ts`             |
| Data             | kebab-case + `-data.ts`    | `student-data.ts`                  |
| Types            | kebab-case + `-types.ts`   | `student-types.ts`                 |
| Schemas          | kebab-case + `-schema.ts`  | `student-schema.ts`                |
| Hooks            | kebab-case + `use-` prefix | `use-mobile.ts`                    |
| Utilities        | kebab-case                 | `error-handler.ts`                 |
| UI Components    | kebab-case                 | `dropdown-menu.tsx`                |
| Directories      | lowercase/kebab-case       | `features/`, `student-management/` |
