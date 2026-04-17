# Mock Data Layer

All in-memory seed data for the Sanketa UI lives under this directory. The layout is designed so that swapping to a real backend is an env-flag flip, not a codebase-wide rewrite.

---

## Directory layout

```
src/mocks/
├── _shared/                   Utilities used by every feature mock
│   ├── constants.ts           SCHOOL_DOMAIN, PHONE_COUNTRY_CODE, CURRENCY, ID_BASE
│   ├── date-helpers.ts        relativeDate / scatterPastDates / currentAcademicYear / …
│   ├── id-helpers.ts          makeId / seriesIds / txnId / newId / shortUuid
│   ├── fake.ts                Indian-leaning names, Bangalore addresses, phone10(), emailFor()
│   ├── simulate-latency.ts    withLatency() helper for mock adapters
│   ├── pagination.ts          paginate() — wraps T[] in the project ApiListResponse envelope
│   └── index.ts               barrel
├── students/                  studentsData + dashboard + details + academic-performance + programs
├── teachers/                  teachersData + statistics + workload + details
├── attendance/                attendance + daily + overview
├── timetable/                 subjects / classSections / classTimetables / exceptions
├── grades/                    gradeSubmissions + helpers
├── calendar/                  mockCalendarEvents
├── notices/                   noticeBoardEntries
├── fees/                      feeCollectionData + paymentTransactions + trends + helpers
├── expenses/                  expensesData + reimbursementsData + trend / breakdown
├── transport/                 mockDrivers + mockVehicles + mockRoutes + assignments + alerts
├── auth/                      mockLogin / mockRegister
└── dashboard/                 dashboardStats + chart datasets + todos + recent activity
```

Every feature folder ships an `index.ts` barrel — consumers should `import { studentsData } from '@/mocks/students'` rather than reaching into individual files.

---

## The adapter pattern

Every service in `src/api/services/*-service.ts` pairs an in-memory mock path with a real HTTP path via a tiny helper:

```ts
// src/api/services/_adapter.ts
export function mockOrHttp<T>(
  mockFn: () => T | Promise<T>,
  httpFn: () => Promise<T>,
): Promise<T> {
  return getEnvConfig().useMockApi
    ? Promise.resolve().then(mockFn)
    : httpFn()
}
```

A typical service function looks like:

```ts
// src/api/services/students-service.ts
export async function fetchStudents(): Promise<Student[]> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return [...studentsData]
    },
    async () => {
      const { data } = await apiClient.get<Student[]>('/students')
      return data
    },
  )
}
```

Both code paths live side-by-side so the intended HTTP shape is visible when you edit the mock. When the backend is ready, flip one environment variable and the HTTP paths activate.

---

## Swapping to a real backend

1. Copy `.env.example` to `.env.local`:
   ```
   VITE_API_BASE_URL=https://api.sanketa.edu/v1
   VITE_USE_MOCK_API=false
   ```
2. Restart the dev server.
3. Services now route through the `httpFn` branch of every `mockOrHttp()` call. The mock paths stay in the codebase (they're still useful for Playwright tests and offline dev).

Each service function's JSDoc `@apiRoute` tag documents the REST path the backend is expected to expose. Audit trail for the backend team:

```bash
grep -rE "@apiRoute" src/api/services
```

---

## Editing seed data

- **Add a student / teacher**: append to `src/mocks/{students,teachers}/*.ts`. Downstream mocks that use the canonical data (fees, expenses, dashboard stats) pick up the change automatically — see `resolveStudent()` in `src/mocks/fees/fees.ts` and the reimbursement / dashboard loops.
- **Change date distribution**: tweak the `scatterPastDates(count, days)` calls in `src/mocks/{expenses,notices}/*.ts` or the `relativeDisplay(offset)` constants in `src/mocks/notices/notices.ts`. Dates are always relative to *today*, so screenshots stay current indefinitely.
- **Change currency / country code / school domain**: edit `src/mocks/_shared/constants.ts`. Every mock that builds phone numbers or emails reads from there, so a single edit propagates.
- **Add a new regional identifier**: extend `INDIAN_FIRST_NAMES` / `INDIAN_LAST_NAMES` / `BANGALORE_LOCALITIES` in `src/mocks/_shared/fake.ts`.

---

## Helpers cheat-sheet

### Dates (`_shared/date-helpers.ts`)

| Helper | Returns | Use when |
|---|---|---|
| `isoDate(date?)` | `"2026-04-17"` | Feeding form inputs, API params |
| `displayDate(date?)` | `"Apr 17, 2026"` | Table cells, notice cards |
| `relativeDate(offset)` | `Date` | Building anything from a day offset |
| `relativeIso(offset)` | `"2026-04-17"` | Same as relativeDate but ISO string |
| `relativeDisplay(offset)` | `"Apr 17, 2026"` | Same as relativeDate but display string |
| `businessDaysAgo(n)` | `Date` | Skip weekends — attendance history |
| `scatterPastDates(count, days)` | `Date[]` | Evenly spread N records across a window |
| `scatterAroundToday(count, span)` | `Date[]` | Events centered on today |
| `currentAcademicYear()` | `"2025-26"` | Timetable `academicYear` field |
| `academicYearStart()` | `Date` | Apr 1 of current AY |
| `yyyymm()` | `"202604"` | Transaction ID month segment |

### IDs (`_shared/id-helpers.ts`)

| Helper | Use |
|---|---|
| `makeId('S', 2101)` | `"S-2101"` — stable numeric series |
| `seriesIds('S', 2101, 5)` | 5 consecutive ids from a seed |
| `txnId(n)` | `"TXN-202604-0042"` — month segment auto-updates |
| `newId('stu')` | collision-free id for freshly-created records |

### Fake data (`_shared/fake.ts`)

| Helper | Use |
|---|---|
| `personName(seed)` | `{ firstName, lastName }` (85% Indian) |
| `fullName(seed)` | `"Aarav Sharma"` |
| `phone10(seed)` | `"9845123456"` (valid TRAI prefix) |
| `phoneDisplay(seed)` | `"+91 98451 23456"` |
| `emailFor('Aarav','Sharma')` | `"aarav.sharma@sanketa.edu"` |
| `bangaloreAddress(seed)` | full address with real locality + 560xxx PIN |

### Latency + pagination

| Helper | Use |
|---|---|
| `await withLatency()` | 200–600ms delay in mock adapter |
| `await withLatency({ min, max })` | custom range |
| `paginate(items, params)` | wrap `T[]` in `PaginatedResponse<T>` |

---

## Principles

1. **Single source of truth**. Every mock file for a feature lives under `src/mocks/{feature}/` — never under `src/features/*/mocks/` or `src/data/mocks/`.
2. **Deterministic seeds, dynamic timestamps**. Names and IDs are stable across runs; dates are computed relative to `Date.now()` so nothing looks stale.
3. **Cross-feature references resolve at runtime**. Fees / expenses / dashboard stats look data up in `studentsData` / `teachersData` rather than hardcoding names, so a single edit ripples correctly.
4. **Mock and HTTP paths live in the same service file**. Editing a mock lets you see the intended backend shape right next to it; swapping is an env flag, not a rewrite.
5. **Regionally appropriate**. Sanketa is an Indian (Bangalore, Karnataka) school — names lean Indian, phones are `+91`, currency is `₹`, addresses use real Bangalore localities and 560xxx PINs.
