/**
 * The active school's notice board.
 *
 * ── What moved out of here ─────────────────────────────────────────────
 * Nine notices, written out and shared, so both schools posted the same
 * board — the same choir rehearsal postponed for the same auditorium
 * renovation, at a school in Bangalore and a school in Mysuru four hours
 * apart. A notice is the most local thing a school produces; there is nothing
 * about one that another school could also have said.
 *
 * They live in the schools' own folders now. Vidya Mandir's board carries
 * Dasara holidays, a Kannada Rajyotsava programme and a revised bus timing
 * for the Vijayanagar route, none of which a Bangalore school would post.
 */

import type { NoticeBoardEntry } from '@/features/notice-board/types'
import { tenantFixtures } from '@/mocks/tenants'

export const noticeBoardEntries: NoticeBoardEntry[] = tenantFixtures().notices.map(entry => ({
  ...entry,
  tags: entry.tags.map(tag => ({ ...tag })),
  attachments: entry.attachments?.map(file => ({ ...file })),
}))
