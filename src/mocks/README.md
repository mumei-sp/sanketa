# Mock Data Layer

All in-memory seed data for the Sanketa UI lives under this directory. The layout is designed so that swapping to a real backend is an env-flag flip, not a codebase-wide rewrite.

---

## Directory layout

The tree is the architecture. Two databases, the seed data that fills them,
and the plumbing — not twenty-three sibling folders.

```
src/mocks/
├── SCHEMA.md        the target DB schema, and how much of it is mocked
├── SCHEMA-FIXES.md  what the backend still has to change
│
├── _shared/         plumbing every layer uses
│   ├── tenant-context.ts   activeTenant() · tenantKey() · globalKey()  ← the choke point
│   ├── seed-signature.ts   how a store notices its fixture changed
│   ├── caller.ts           who is asking, and what they may see
│   ├── date-helpers.ts · id-helpers.ts · pagination.ts · simulate-latency.ts
│   └── constants.ts
│
├── global/          the GLOBAL database — one row per *account*
│   ├── users/           login identity: email?, phone?, status. Nothing else
│   ├── profiles/        user_profiles — the person, and the source of the
│   │                    subset every school replicates · sync.ts pushes it
│   ├── memberships/     user_tenant_mapping — who is at which school
│   ├── tenants/         the schools themselves
│   └── sessions/
│
├── tenant/          the PER-SCHOOL database — shared tables, per-school rows
│   ├── academic/        academic_years · terms · grade_levels ·
│   │                    class_sections · subjects  ← what the rest hangs off
│   ├── scheduling/      time_slots · rooms · calendar_categories ·
│   │                    calendar_events · timetable · event_attendees
│   ├── profiles/        user_profiles · staff · profile_types · profile_roles
│   │                    ← the person: name, DOB, gender, phone, picture
│   ├── students/ teachers/ parents/         the capacity tables
│   │                    ← only what is true of them *here*
│   ├── roles/ access-log/
│   ├── attendance/ grades/ timetable/ fees/ expenses/ transport/
│   ├── notices/ calendar/ notifications/ reminders/ reimbursements/
│   └── dashboard/       aggregates over the above
│
├── schools/         THE SEED DATA — what each school's schema starts with
│   ├── types.ts         TenantFixtures: the contract a school folder fills
│   ├── _generate/       random · names · roster · faculty · transport ·
│   │                    expenses · calendar
│   ├── kendriya/        academic scheduling students teachers transport
│   │                    expenses config notices calendar todos index
│   └── vidya-mandir/    ← the same eleven files
│
└── auth/            sign-in, and the PASETO tenant-context token
```

`user_profiles` is in both, on purpose: the global row is the person, the
tenant row is a read replica of eleven of its columns. Five rows against 1,129,
because a global profile needs a login and most people at a school do not have
one. See SCHEMA.md.

`global/` and `tenant/` are the two databases. A store declares which it
belongs to by the key it asks for — `globalKey('users')` against
`tenantKey('students')` — and that is the whole of the boundary. Two schools
are two disjoint row sets rather than one set with a `tenant_id` column, so a
query cannot accidentally span schools; there is no filter to forget.

`schools/` is not a third database. It is the seed script, split per school: a
school does not get its own `students` table any more than it gets its own
`CREATE TABLE`, it gets its own rows.

Every folder ships an `index.ts` barrel — consumers should
`import { listStudents } from '@/mocks/tenant/students'` rather than reaching
into individual files.

### Adding a school

A folder under `schools/` with the eleven files, a line in `BY_CODE` in
`schools/index.ts`, and a row in the global `tenants` store. Nothing else: the
tables already exist.

### The person and the capacity

`user_profiles` owns the columns that describe a person — name parts, date of
birth, gender, primary phone, picture. `students`, `teachers` and `parents` own
only what is true of that person *at this school*: an admission number, an
employee id, a relationship. One id runs through all of them, because the
schema gives each capacity table `profile_id` as its own primary key.

The fixtures under `schools/` are still written as whole people, which is the
only readable way to write a seed. `splitPerson()` is where that becomes two
rows, and the capacity stores join them back on the way out — so
`listStudents()` returns a `Student` with her name on it, as it always did,
while the name itself is stored once.

That fixes the thing two copies always eventually do. Rename a teacher on the
People screen and the profile is what changed; before this, the faculty list
was reading its own stale copy.

### Two rules about imports

**A store imports another store, never its barrel.** A barrel re-exports the
derived modules beside the table — the dashboard series, the academic
performance chart — and those do work as they initialise, which comes back
round before the importing store's own `db` exists. It reads as `Cannot access
'db' before initialization` from a file that never mentions the table.

**The profiles store imports no capacity store.** The arrow runs one way now:
`students`, `teachers` and `parents` read the person from `profiles`, so
`profiles` cannot read them back. Two consequences live in the tree:
`parents/derive.ts` holds the guardian derivation both sides need, and
`profiles/capacities.ts` holds `capacitiesOf`, which is a join across four
tables rather than part of any one of them.

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
      return listStudents()
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

Everything a school *is* lives in its own folder under `schools/`. A store
fingerprints the fixture it seeded from, so an edit reseeds on the next load
rather than being shadowed by the copy already in `localStorage`.

- **A school's roster, faculty, buses or ledger** — edit the config in
  `schools/<school>/{students,teachers,transport,expenses}.ts`. These are
  generated, so you change the *shape* (how many sections, which localities,
  which departments to hire into) rather than typing rows.
- **A school's notices, calendar or to-dos** — edit the lists in
  `schools/<school>/{notices,calendar,todos}.ts`. These are written out,
  because a notice is the most local thing a school produces.
- **A school's class sections, subjects or curriculum** —
  `schools/<school>/academic.ts`. Everything downstream follows: the roster
  fills those sections, the timetable covers them and teaches those subjects
  for those many periods, and the faculty is sized for the result.
- **A school's rooms or bell times** — `schools/<school>/scheduling.ts`. How
  many labs and grounds it has is a hard limit on how many classes can take
  that subject at once, so the timetable follows from it.
- **A school's name** — `schools/<school>/config.ts`, which is now only what
  is genuinely a setting.
- **Who can sign in** — the `access` block in `schools/<school>/index.ts`
  attaches a login to a profile that already exists. The logins themselves are
  global: `global/users/store.ts`.
- **Currency, dialling code, school domain** — `_shared/constants.ts`.
- **Names** — `schools/_generate/names.ts`, grouped by community so a family
  stays coherent. Not a flat pool: drawn from one, you get *Fatima Iyengar*.

Dates are always relative to *today*, so screenshots stay current.

---

## Helpers cheat-sheet

### Dates (`_shared/date-helpers.ts`)

| Helper | Returns | Use when |
|---|---|---|
| `isoDate(date?)` | `"2026-04-17"` | Feeding form inputs, API params |
| `displayDate(date?)` | `"Apr 17, 2026"` | Table cells, notice cards |
| `relativeDate(offset)` | `Date` | Building anything from a day offset |
| `relativeIso(offset)` | `"2026-04-17"` | Same, as an ISO string |
| `relativeDisplay(offset)` | `"Apr 17, 2026"` | Same, as a display string |
| `currentAcademicYear()` | `"2025-26"` | Timetable `academicYear` field |
| `academicYearStart()` | `Date` | Apr 1 of the current AY |
| `yyyymm()` | `"202604"` | Transaction-id month segment |

### IDs (`_shared/id-helpers.ts`)

| Helper | Use |
|---|---|
| `makeId('S', 2101)` | `"S-2101"` — stable numeric series |
| `txnId(n)` | `"TXN-202604-0042"` — month segment auto-updates |
| `newId('stu')` | collision-free id for a freshly-created record |

### Generation (`schools/_generate/random.ts`)

Seeded, so two runs produce the same school. `Math.random()` would mean the
student you were looking at is somebody else after a refresh.

| Helper | Use |
|---|---|
| `rng('kendriya:roster')` | a named stream — name them per thing generated |
| `int` · `pick` · `chance` | an integer, an item, a coin |
| `weighted(source, items)` | respects a `weight` field |
| `bell(source, min, max)` | clustered, not flat — marks and class sizes bunch |

### The school's structure (`tenant/academic`)

| Helper | Use |
|---|---|
| `currentYear()` · `currentTerm()` | the year and term today falls in |
| `listSections()` · `findSectionByLabel('8B')` | the sections, with capacity and class teacher |
| `sectionsAsConfig()` | the flat `{ id, grade, section, label }` the UI speaks |
| `listSubjects()` · `curriculumFor('junior')` | what the school teaches, and how much |

### Rooms and the bell (`tenant/scheduling`)

| Helper | Use |
|---|---|
| `listRooms()` · `findRoom(id)` · `roomLabel(id)` | the rooms, with capacity and type |
| `listTeachingSlots()` | the periods actually taught in |
| `listTimetable()` | the weekly grid as rows |
| `listEvents()` · `attendeesOf(id)` | the calendar, and who was invited |

### Tenancy (`_shared/tenant-context.ts`)

| Helper | Use |
|---|---|
| `activeTenant()` | the active school's code |
| `tenantKey('students')` | `sanketa:mock-db:kendriya:students` |
| `globalKey('users')` | `sanketa:mock-db:global:users` |
| `onTenantSwitch(forget)` | a store dropping its cache when the school changes |

### Latency + pagination

| Helper | Use |
|---|---|
| `await withLatency()` | 200–600 ms delay in a mock adapter |
| `paginate(items, params)` | wrap `T[]` in `PaginatedResponse<T>` |

---

## Principles

1. **The tree is the architecture**. `global/` and `tenant/` are the two databases; `schools/` is the seed data that fills them. Nothing mock-shaped lives under `src/features/*/mocks/` or `src/data/mocks/`.
2. **Deterministic seeds, dynamic timestamps**. Names and IDs are stable across runs; dates are computed relative to `Date.now()` so nothing looks stale.
3. **Nothing is asserted that could be counted**. Fees, marks, registers, the workload chart and every dashboard tile are derived from the roster and the faculty rather than typed alongside them — so a number on one screen is the same number on the screen it links to. Tables that persist expose functions and keep their rows private; the rest are module constants rebuilt at import, which is fine because switching school reloads the page.
4. **Mock and HTTP paths live in the same service file**. Editing a mock lets you see the intended backend shape right next to it; swapping is an env flag, not a rewrite.
5. **Regionally real**. Kendriya Vidyalaya is in Bengaluru and Vidya Mandir in Mysuru: names are drawn per community so a household is coherent, phones are `+91`, currency is `₹`, addresses use real localities and their own PINs, and the Mysuru school's calendar has Dasara on it.
