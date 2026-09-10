/**
 * The active school's faculty.
 *
 * ── Why this file is four lines now ────────────────────────────────────
 * It used to be the faculty: eighteen literal rows, exported as a module
 * constant and imported by six modules. Which made it one staff room for both
 * schools — Priya Nair, `T-1002`, taught 9A Social Studies in Room 901 at
 * Kendriya and at Vidya Mandir, in the same period on the same day. The
 * timetable, the signature on a register, the name on a mark sheet, the
 * workload chart and every teacher's detail page were all built on it, so all
 * of them crossed the boundary that the roster, the fees and the marks
 * respected.
 *
 * A faculty is a fact about a school, so the rows moved into the schools'
 * folders and this resolves the active one — the same shape as
 * `mocks/students/store.ts` seeding from `tenantFixtures().students`.
 *
 * ── Why a constant and not a function ─────────────────────────────────
 * Read once at module load, like the other tenant-resolved fixtures, because
 * switching school reloads the page. Six consumers import the value; making it
 * a call would change all six for no gain while the switch is a navigation.
 */

import type { Teacher } from '@/features/teachers/types'
import { tenantFixtures } from '@/mocks/tenants'

export const teachersData: Teacher[] = tenantFixtures().teachers
