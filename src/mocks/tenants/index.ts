/**
 * The schools' seed data, one folder each.
 *
 * A school's tables are shared — there is one `students` store, not one per
 * school — and what differs is the rows it starts with. This resolves the
 * active school's set, so a store's `seed()` asks for "this school's students"
 * rather than importing one school's fixture and pretending it is everyone's.
 *
 * Adding a school is a folder and a line in `BY_CODE`, plus a row in the
 * global `tenants` table so it can be resolved at sign-in.
 */

import { activeTenant } from '@/mocks/_shared/tenant-context'
import { kendriya } from './kendriya'
import { vidyaMandir } from './vidya-mandir'
import type { TenantFixtures } from './types'

export type { TenantFixtures } from './types'

const BY_CODE: Record<string, TenantFixtures> = {
  kendriya,
  'vidya-mandir': vidyaMandir,
}

/**
 * The active school's seed data.
 *
 * A code with no folder falls back to an empty roster rather than to another
 * school's — a school whose fixtures were never written should look empty,
 * which is true, instead of looking like a copy of the school next door, which
 * is the kind of wrong that survives review.
 */
export function tenantFixtures(): TenantFixtures {
  return (
    BY_CODE[activeTenant()] ?? {
      students: [],
      teachers: [],
      transport: { drivers: [], vehicles: [], routes: [], feeStructures: [] },
    }
  )
}
