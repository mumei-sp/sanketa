/**
 * What one school's folder provides.
 *
 * A school's schema starts empty and is filled by its seed script. This is
 * that script's contents, per school — the rows, never the tables.
 *
 * Everything is optional except the students, because a school with no roster
 * is not a school anyone can demonstrate. A school that supplies nothing else
 * gets the built-in roles every school gets and the same starting data for the
 * features whose fixtures are not yet school-specific.
 */

import type { Student } from '@/features/students/types'
import type { Role } from '@/config/permissions'

export interface TenantFixtures {
  students: Student[]
  /**
   * Roles this school invented, on top of the built-in set.
   *
   * The built-ins are the app's, not a school's — every school gets Admin,
   * Teacher, Parent and the rest, and `reconcile` keeps them current across
   * releases. What a school adds is its own: a Librarian at one school and not
   * at another is the whole point of roles being tenant data.
   */
  extraRoles?: Role[]
}
