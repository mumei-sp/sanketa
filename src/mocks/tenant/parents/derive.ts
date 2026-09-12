/**
 * Turning the guardians on a student record into parents and links.
 *
 * This is the mock's equivalent of a migration, and it lives on its own for a
 * reason that is entirely about import order.
 *
 * `user_profiles` is the person — the name, the date of birth, the number they
 * answer — and every capacity table now reads those columns from it rather
 * than keeping a second copy. So `profiles/store.ts` has to know about every
 * person at the school *before* `parents/store.ts` exists, including the
 * parents. If it asked the parents table for them it would be asking a table
 * that is waiting on it.
 *
 * So the derivation is a pure function of the fixtures: given the roster, it
 * says who the parents are and which child is whose. Both the profiles store
 * (for the person columns) and the parents store (for the `parents` and
 * `student_parents` rows) call it, and neither has to import the other.
 *
 * It matches guardians across students on name *and* phone, so siblings share
 * one parent row rather than producing one per child.
 */

import { tenantFixtures } from '@/mocks/schools'
import { seedSignature } from '@/mocks/_shared/seed-signature'

/** One parent's link to one student. The schema's `student_parents`. */
export interface StudentParent {
  id: string
  studentProfileId: string
  parentProfileId: string
  /** 'Father', 'Mother', 'Guardian' — free text, as in the schema. */
  relationship: string
  /** The one the school rings first. At most one per student. */
  isPrimary: boolean
}

/**
 * What the roster says about a parent.
 *
 * Both fields are `user_profiles` columns, which is why this is a derivation
 * result and not the `parents` row: the row itself is `profile_id` and the
 * handful of columns the schema actually gives it.
 */
export interface DerivedParent {
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
 * A fingerprint of the guardians this derivation reads.
 *
 * Taken over the guardian blocks rather than the whole record, so correcting a
 * mark does not rebuild the family tree. Over the fixtures rather than the
 * live directory for the reason in `_shared/seed-signature.ts`.
 */
export function familiesSignature(): string {
  return seedSignature(
    tenantFixtures().students.map(student => [String(student.id), student.guardians]),
  )
}

/**
 * Every parent the roster implies, and every child they belong to.
 *
 * A guardian the school has already told us is somebody else here — the member
 * of staff whose child attends — keeps that profile id instead of being minted
 * a new one. One person, one `user_profiles.id`, with a teacher row and a
 * parent row hanging off it, which is what the schema says and what makes her
 * teaching and her parenthood the same person's.
 */
export function deriveFamilies(): { parents: DerivedParent[]; links: StudentParent[] } {
  const parents: DerivedParent[] = []
  const links: StudentParent[] = []
  let sequence = 0

  const fixtures = tenantFixtures()
  const alreadyAProfile = new Map(
    (fixtures.access?.staffGuardians ?? []).map(entry => [digitsOf(entry.phone), entry.profileId]),
  )

  fixtures.students.forEach(student => {
    const guardians = student.guardians
    if (!guardians) return

    const entries: { relationship: string; name?: string; phone?: string }[] = [
      { relationship: 'Father', name: guardians.father?.name, phone: guardians.father?.phone },
      { relationship: 'Mother', name: guardians.mother?.name, phone: guardians.mother?.phone },
      {
        relationship: guardians.alternativeGuardian?.relation || 'Guardian',
        name: guardians.alternativeGuardian?.name,
        phone: guardians.alternativeGuardian?.phone,
      },
    ]

    let primaryTaken = false
    entries.forEach(entry => {
      if (!entry.name?.trim()) return
      const candidate = { fullName: entry.name.trim(), phone: entry.phone }

      let parent = parents.find(existing => sameHuman(existing, candidate))
      if (!parent) {
        const known = alreadyAProfile.get(digitsOf(candidate.phone))
        if (known) {
          parent = { profileId: known, fullName: candidate.fullName, phone: candidate.phone }
        } else {
          sequence += 1
          parent = {
            profileId: `P-${String(2000 + sequence)}`,
            fullName: candidate.fullName,
            phone: candidate.phone,
          }
        }
        parents.push(parent)
      }

      links.push({
        id: `SP-${links.length + 1}`,
        studentProfileId: String(student.id),
        parentProfileId: parent.profileId,
        relationship: entry.relationship,
        isPrimary: !primaryTaken,
      })
      primaryTaken = true
    })
  })

  return { parents, links }
}
