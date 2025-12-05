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
