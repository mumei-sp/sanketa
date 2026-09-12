/**
 * Kendriya Vidyalaya's settings.
 *
 * Only what is genuinely a *setting* — what an administrator would change on
 * the settings screen and what the app has no other opinion about. Its name,
 * and for now nothing else.
 *
 * Its class sections and subjects used to live here, which made a school's
 * academic structure a preference sitting in a UI blob. They are tables now:
 * see `./academic.ts` and `mocks/tenant/academic`. The settings screen still
 * edits them, and still should — what changed is which way the data flows.
 */

import type { SchoolConfig } from '@/config/school-config'

export const configFixture: Partial<SchoolConfig> = {
  schoolName: 'Kendriya Vidyalaya',
}
