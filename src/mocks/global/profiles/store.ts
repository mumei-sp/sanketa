/**
 * `GlobalDB.user_profiles` — the person, once, for the whole platform.
 *
 * The source of truth behind the copy every tenant holds.
 * `DENORMALIZED_PROFILE_ARCHITECTURE.md` is explicit about the split: this row
 * is the full schema, the tenant row is a read replica of a column subset, and
 * triggers keep the second current. A class list has to render without a
 * cross-database join per student, which is the one thing the architecture
 * rules out.
 *
 * ── One row per *account*, not per person at a school ──────────────────
 * `user_id` is `UNIQUE NOT NULL` with a foreign key to `users`, so a row here
 * requires a login. That is the whole difference between this table and the
 * tenant one: a school of 1,127 people has five who can sign in, so this holds
 * five rows where Kendriya's `user_profiles` holds 1,129. Everybody else
 * exists at a school and nowhere else, which is correct — the platform has no
 * reason to know a seven-year-old's date of birth, only her school does.
 *
 * ── What is here and not replicated ────────────────────────────────────
 * Address, second and emergency numbers, contact preference, bio, the privacy
 * flags, `custom_fields`. None of it is on a school screen, so none of it is
 * worth copying into every tenant a person belongs to. The twelve columns that
 * *are* replicated are listed in `REPLICATED_COLUMNS`, which `sync.ts` reads —
 * the subset is stated once rather than being a fact you check by diffing two
 * interfaces.
 */

import { globalKey } from '@/mocks/_shared/tenant-context'
import { seedSignature } from '@/mocks/_shared/seed-signature'
import { newId } from '@/mocks/_shared'
import { PHONE_COUNTRY_CODE } from '@/mocks/_shared/constants'

export interface GlobalProfile {
  /** `user_profiles.id`. Nothing points at it: the tenant replica keys on `user_id`. */
  id: string
  /** `UNIQUE NOT NULL` → `users.id`. No login, no row. */
  userId: string

  // ── Replicated down to every tenant the user belongs to ──
  firstName?: string
  middleName?: string
  lastName?: string
  fullName: string
  preferredName?: string
  displayName?: string
  dateOfBirth?: string
  /** 0=MALE, 1=FEMALE, 2=OTHER, 3=PREFER_NOT_TO_SAY. */
  gender?: 0 | 1 | 2 | 3
  primaryPhone?: string
  /** Not a schema column; carried so the replica can render `+91 98451 23457`. */
  phoneCountryCode?: string
  profilePictureUrl?: string

  // ── Global only ──
  secondaryPhone?: string
  emergencyPhone?: string
  preferredContactMethod?: 'email' | 'phone' | 'sms'
  city?: string
  stateProvince?: string
  postalCode?: string
  country?: string
  bio?: string
  isPublic?: boolean
  showEmail?: boolean
  showPhone?: boolean
  customFields?: Record<string, unknown>
  lastProfileUpdate?: string
}

/**
 * The subset the tenant replica carries.
 *
 * Stated once, here, because `sync.ts` copies exactly these and the point of
 * the design is that it is a *subset* — a column added below this line must be
 * a deliberate decision to push it into every school, not something that
 * happens because someone spread the whole object.
 */
export const REPLICATED_COLUMNS = [
  'firstName',
  'middleName',
  'lastName',
  'fullName',
  'preferredName',
  'displayName',
  'dateOfBirth',
  'gender',
  'primaryPhone',
  'phoneCountryCode',
  'profilePictureUrl',
] as const

const TABLE = 'user_profiles'

interface Database {
  rows: GlobalProfile[]
  seed?: string
}

let db: Database | null = null

/**
 * The five people who can sign in, and what the platform knows about them.
 *
 * Their names have to agree with the tenant fixtures, because the sync writes
 * this row over that one: `Meera Iyengar` here is `t-6` at Kendriya, and her
 * date of birth and number are the faculty fixture's. That agreement is the
 * invariant worth watching — a seed that disagreed with itself would show up
 * as a name changing the first time somebody signed in.
 *
 * The global-only columns are filled in for two of them so the subset is
 * visible rather than theoretical: Rohan's address and second number live
 * here, are never copied to Kendriya or Vidya Mandir, and neither school has
 * anywhere to put them.
 */
const SEED_ROWS: GlobalProfile[] = [
  {
    id: 'GP-1',
    userId: '1',
    firstName: 'Surya',
    lastName: 'Admin',
    fullName: 'Surya Admin',
    displayName: 'Surya Admin',
    preferredContactMethod: 'email',
    country: 'India',
    isPublic: false,
  },
  {
    id: 'GP-2',
    userId: '2',
    firstName: 'Nandini',
    lastName: 'Rao',
    fullName: 'Nandini Rao',
    displayName: 'Nandini Rao',
    preferredContactMethod: 'email',
    country: 'India',
    isPublic: false,
  },
  {
    id: 'GP-3',
    userId: '3',
    firstName: 'Meera',
    lastName: 'Iyengar',
    fullName: 'Meera Iyengar',
    displayName: 'Meera Iyengar',
    dateOfBirth: '1990-02-14',
    gender: 1,
    primaryPhone: '9845332110',
    phoneCountryCode: PHONE_COUNTRY_CODE,
    profilePictureUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Meera',
    emergencyPhone: '9845332111',
    preferredContactMethod: 'phone',
    city: 'Bengaluru',
    stateProvince: 'Karnataka',
    postalCode: '560102',
    country: 'India',
    isPublic: false,
    showPhone: true,
  },
  {
    id: 'GP-4',
    userId: '4',
    firstName: 'Vikram',
    lastName: 'Shah',
    fullName: 'Vikram Shah',
    displayName: 'Vikram Shah',
    preferredContactMethod: 'email',
    country: 'India',
    isPublic: false,
  },
  {
    id: 'GP-5',
    userId: '5',
    firstName: 'Rohan',
    lastName: 'Sharma',
    fullName: 'Rohan Sharma',
    displayName: 'Rohan Sharma',
    // The number both schools name as his children's father's. It is the join
    // that makes him one man with two children rather than two namesakes.
    primaryPhone: '9845123457',
    phoneCountryCode: PHONE_COUNTRY_CODE,
    secondaryPhone: '8067451200',
    preferredContactMethod: 'sms',
    city: 'Bengaluru',
    stateProvince: 'Karnataka',
    postalCode: '560102',
    country: 'India',
    showPhone: true,
  },
]

function seed(): Database {
  return { rows: SEED_ROWS.map(row => ({ ...row })), seed: seedSignature(SEED_ROWS) }
}

function load(): Database {
  if (db) return db
  try {
    const raw = localStorage.getItem(globalKey(TABLE))
    if (raw) {
      const parsed = JSON.parse(raw) as Database
      if (
        Array.isArray(parsed.rows) &&
        parsed.rows.length > 0 &&
        parsed.seed === seedSignature(SEED_ROWS)
      ) {
        db = parsed
        return db
      }
    }
  } catch {
    // Unparseable or unavailable (private mode, cleared site data) — reseed.
  }
  db = seed()
  persist()
  return db
}

function persist(): void {
  if (!db) return
  try {
    localStorage.setItem(globalKey(TABLE), JSON.stringify(db))
  } catch {
    // Quota or private mode; the in-memory copy still serves this session.
  }
}

// ── Reads ─────────────────────────────────────────────────────────────

export function listGlobalProfiles(): GlobalProfile[] {
  return load().rows.map(row => ({ ...row }))
}

/** The platform's row for one account. */
export function globalProfileOf(userId: string): GlobalProfile | undefined {
  const found = load().rows.find(row => row.userId === String(userId))
  return found ? { ...found } : undefined
}

/**
 * Just the columns a tenant is allowed to hold.
 *
 * What a sync sends, and what a school would see if it asked. Undefined for an
 * account with no profile — which the schema forbids, and which this mock can
 * still reach through `provisionUser`, so callers check.
 */
export function replicaOf(userId: string): Partial<GlobalProfile> | undefined {
  const profile = globalProfileOf(userId)
  if (!profile) return undefined
  const subset: Record<string, unknown> = {}
  REPLICATED_COLUMNS.forEach(column => {
    subset[column] = profile[column]
  })
  return subset as Partial<GlobalProfile>
}

// ── Writes ────────────────────────────────────────────────────────────

/**
 * The row a new account gets.
 *
 * Separate from creating the `users` row on purpose: they are two tables, and
 * the profile's `user_id` foreign key means this one comes second.
 */
export function createGlobalProfile(
  userId: string,
  input: Omit<GlobalProfile, 'id' | 'userId'>,
): GlobalProfile {
  const database = load()
  const existing = database.rows.find(row => row.userId === String(userId))
  if (existing) {
    Object.assign(existing, input, { lastProfileUpdate: new Date().toISOString() })
    persist()
    return { ...existing }
  }
  const profile: GlobalProfile = {
    ...input,
    id: newId('GP'),
    userId: String(userId),
    lastProfileUpdate: new Date().toISOString(),
  }
  database.rows.push(profile)
  persist()
  return { ...profile }
}

/**
 * Correct what the platform knows about somebody.
 *
 * Does not sync. `sync.ts` does, and the caller says when — because the
 * decision of *which* tenants to push to belongs to whoever knows the
 * memberships, not to this table.
 */
export function updateGlobalProfile(
  userId: string,
  patch: Partial<Omit<GlobalProfile, 'id' | 'userId'>>,
): GlobalProfile | null {
  const database = load()
  const profile = database.rows.find(row => row.userId === String(userId))
  if (!profile) return null
  Object.assign(profile, patch, { lastProfileUpdate: new Date().toISOString() })
  persist()
  return { ...profile }
}
