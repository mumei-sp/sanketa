/**
 * Turning the guardians on a student record into guardians and links.
 *
 * This is the mock's equivalent of a migration, and it lives on its own for a
 * reason that is entirely about import order.
 *
 * `user_profiles` is the person — the name, the date of birth, the number they
 * answer — and every capacity table now reads those columns from it rather
 * than keeping a second copy. So `profiles/store.ts` has to know about every
 * person at the school *before* `guardians/store.ts` exists, including the
 * guardians. If it asked the guardians table for them it would be asking a table
 * that is waiting on it.
 *
 * So the derivation is a pure function of the fixtures: given the roster, it
 * says who the guardians are and which child is whose. Both the profiles store
 * (for the person columns) and the guardians store (for the `guardians` and
 * `student_parents` rows) call it, and neither has to import the other.
 *
 * It matches guardians across students on name *and* phone, so siblings share
 * one guardian row rather than producing one per child.
 */

import { tenantFixtures } from '@/mocks/schools'
import { seedSignature } from '@/mocks/_shared/seed-signature'
import { onTenantSwitch } from '@/mocks/_shared/tenant-context'

/** One guardian's link to one student. The schema's `student_parents`. */
export interface StudentGuardian {
  id: string
  studentProfileId: string
  guardianProfileId: string
  /** 'Father', 'Mother', 'Guardian' — free text, as in the schema. */
  relationship: string
  /** The one the school rings first. At most one per student. */
  isPrimary: boolean
}

/**
 * What the roster says about a guardian.
 *
 * Both fields are `user_profiles` columns, which is why this is a derivation
 * result and not the `guardians` row: the row itself is `profile_id` and the
 * handful of columns the schema actually gives it.
 */
export interface DerivedGuardian {
  profileId: string
  fullName: string
  phone?: string
}

/** Last ten digits — how a number is compared anywhere in this file. */
export const digitsOf = (value?: string) => (value ?? '').replace(/\D/g, '').slice(-10)

/** Same person? Name and phone together, both loosely compared. */
export function sameHuman(
  a: { fullName: string; phone?: string },
  b: { fullName: string; phone?: string },
): boolean {
  const name = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ')
  if (name(a.fullName) !== name(b.fullName)) return false
  // A shared name with no phone on either side is a guess, not a match — two
  // families can hold the same name. A shared name and a shared number is not.
  if (!digitsOf(a.phone) || !digitsOf(b.phone)) return false
  return digitsOf(a.phone) === digitsOf(b.phone)
}

/**
 * A fingerprint of what this derivation produces.
 *
 * Over the *output*, not the guardian blocks it reads. The obvious version
 * fingerprinted the input, and missed a whole class of change: renaming the id
 * prefix from `P-` to `G-` altered every row this table holds and left the
 * signature identical, so a browser that had already run the app went on
 * serving the old ids. A seed's fingerprint has to cover everything that
 * decides the rows, and here that includes this file.
 *
 * Cheap because `deriveFamilies` is memoised per school — a load checks the
 * signature once, and seeding reuses the same result.
 */
export function familiesSignature(): string {
  return seedSignature(deriveFamilies())
}

/**
 * One derivation per school per page load.
 *
 * Three callers want it — this table's seed, its fingerprint, and the profiles
 * store's — and walking 441 students three times to get the same answer is a
 * silly way to pay for the split.
 */
let memo: { guardians: DerivedGuardian[]; links: StudentGuardian[] } | null = null
onTenantSwitch(() => {
  memo = null
})

/**
 * Every guardian the roster implies, and every child they belong to.
 *
 * A guardian the school has already told us is somebody else here — the member
 * of staff whose child attends — keeps that profile id instead of being minted
 * a new one. One person, one `user_profiles.id`, with a teacher row and a
 * guardian row hanging off it, which is what the schema says and what makes her
 * teaching and her parenthood the same person's.
 */
export function deriveFamilies(): { guardians: DerivedGuardian[]; links: StudentGuardian[] } {
  if (memo) return memo
  const guardians: DerivedGuardian[] = []
  const links: StudentGuardian[] = []
  let sequence = 0

  const fixtures = tenantFixtures()
  const alreadyAProfile = new Map(
    (fixtures.access?.staffGuardians ?? []).map(entry => [digitsOf(entry.phone), entry.profileId]),
  )

  fixtures.students.forEach(student => {
    // The embedded blocks on the student record — the old shape this reads.
    const onRecord = student.guardians
    if (!onRecord) return

    const entries: { relationship: string; name?: string; phone?: string }[] = [
      { relationship: 'Father', name: onRecord.father?.name, phone: onRecord.father?.phone },
      { relationship: 'Mother', name: onRecord.mother?.name, phone: onRecord.mother?.phone },
      {
        relationship: onRecord.alternativeGuardian?.relation || 'Guardian',
        name: onRecord.alternativeGuardian?.name,
        phone: onRecord.alternativeGuardian?.phone,
      },
    ]

    let primaryTaken = false
    entries.forEach(entry => {
      if (!entry.name?.trim()) return
      const candidate = { fullName: entry.name.trim(), phone: entry.phone }

      let guardian = guardians.find(existing => sameHuman(existing, candidate))
      if (!guardian) {
        const known = alreadyAProfile.get(digitsOf(candidate.phone))
        if (known) {
          guardian = { profileId: known, fullName: candidate.fullName, phone: candidate.phone }
        } else {
          sequence += 1
          guardian = {
            profileId: `G-${String(2000 + sequence)}`,
            fullName: candidate.fullName,
            phone: candidate.phone,
          }
        }
        guardians.push(guardian)
      }

      links.push({
        id: `SG-${links.length + 1}`,
        studentProfileId: String(student.id),
        guardianProfileId: guardian.profileId,
        relationship: entry.relationship,
        isPrimary: !primaryTaken,
      })
      primaryTaken = true
    })
  })

  memo = { guardians, links }
  return memo
}
