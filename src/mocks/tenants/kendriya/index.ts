/**
 * Kendriya Vidyalaya's schema contents.
 *
 * The default school, and the one every screenshot and demo has been against:
 * forty students across grades 7 to 9, their guardians embedded on the
 * records the way the school's own records carry them.
 *
 * Only seed data lives here. The tables themselves are shared — a school does
 * not get its own `students` table any more than it gets its own `CREATE
 * TABLE`, it gets its own rows.
 */

import { studentFixtures } from './students'
import type { TenantFixtures } from '../types'

export const kendriya: TenantFixtures = {
  students: studentFixtures,
}
