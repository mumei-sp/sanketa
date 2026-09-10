/**
 * Vidya Mandir's notice board.
 *
 * Seven notices, its own. Shared, both schools posted the same nine — the
 * same choir rehearsal postponed for the same auditorium renovation, in two
 * cities four hours apart.
 *
 * The spread covers the statuses the board filters on: active, scheduled,
 * draft, expired. Two are pinned. Dates are relative to today, so the board
 * is current without a re-seed.
 *
 * The content is Mysuru's. Dasara shuts the city for ten days and the school
 * with it, and the Jumboo Savari procession day is a holiday nobody has to be
 * told about but every school posts anyway. A Bangalore school's board would
 * not carry any of this.
 */

import type { NoticeBoardEntry, NoticeCategory } from '@/features/notice-board/types'
import { relativeDisplay } from '@/mocks/_shared/date-helpers'

/** The tag palette, named once rather than repeated on every notice. */
type Tag = { label: NoticeCategory; color: string }

const ACADEMIC: Tag = { label: 'Academic', color: 'color-mix(in srgb, var(--primary) 55%, white)' }
const EVENTS: Tag = { label: 'Events', color: 'color-mix(in srgb, var(--accent) 65%, white)' }
const NOTICE: Tag = { label: 'Notice', color: 'color-mix(in srgb, var(--primary) 80%, var(--heading) 8%)' }
const FINANCE: Tag = { label: 'Finance', color: 'color-mix(in srgb, var(--accent) 80%, var(--heading) 8%)' }
const ANNOUNCEMENT: Tag = { label: 'Announcement', color: 'color-mix(in srgb, var(--primary) 65%, white)' }

export const noticeFixtures: NoticeBoardEntry[] = [
  {
    id: 'vm-nb-1',
    title: 'Dasara Holidays — School Closed',
    tags: [NOTICE],
    audience: 'Entire School',
    postDate: relativeDisplay(-6),
    expiryDate: relativeDisplay(16),
    createdBy: 'Admin Office',
    status: 'Active',
    thumbnail: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=120&h=120&fit=crop',
    content:
      'The school will remain closed for the Dasara holidays. Classes resume the working day after Vijayadashami. Buses will not run during the holidays, and the office will be open on weekdays between 10 AM and 1 PM for fee payments.',
    attachments: [{ name: 'Dasara_Holiday_Circular.pdf', type: 'PDF', size: '0.6 MB' }],
    views: 704,
    pinned: true,
  },
  {
    id: 'vm-nb-2',
    title: 'Half Yearly Examination Timetable',
    tags: [ACADEMIC],
    audience: 'Classes 6 to 10',
    postDate: relativeDisplay(-4),
    expiryDate: relativeDisplay(14),
    createdBy: 'Examination Cell',
    status: 'Active',
    thumbnail: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=120&h=120&fit=crop',
    content:
      'The half yearly examination timetable is now available. Papers begin at 9:30 AM; students must be seated by 9:15. The Kannada and Hindi third-language papers are on separate days, and students should check which applies to them.',
    attachments: [{ name: 'HalfYearly_Timetable.pdf', type: 'PDF', size: '1.8 MB' }],
    views: 486,
    pinned: true,
  },
  {
    id: 'vm-nb-3',
    title: 'Field Visit — Mysuru Palace and Chamundi Hill',
    tags: [ANNOUNCEMENT, EVENTS],
    audience: 'Classes 6 & 7',
    postDate: relativeDisplay(-2),
    expiryDate: relativeDisplay(9),
    createdBy: 'Class Advisor',
    status: 'Active',
    thumbnail: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=120&h=120&fit=crop',
    content:
      'Consent forms for the field visit must reach the class teacher by Friday. Students travelling by school bus should assemble at the gate by 8 AM. A packed lunch is compulsory; the Chamundi Hill climb is optional and parents may say so on the form.',
    attachments: [{ name: 'Consent_Form_FieldVisit.pdf', type: 'PDF', size: '0.9 MB' }],
    views: 231,
  },
  {
    id: 'vm-nb-4',
    title: 'Term 2 Fee — Last Date Without Penalty',
    tags: [FINANCE],
    audience: 'All Parents',
    postDate: relativeDisplay(-8),
    expiryDate: relativeDisplay(6),
    createdBy: 'Accounts Office',
    status: 'Active',
    thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=120&h=120&fit=crop',
    content:
      'Term 2 fees are due. Payment may be made online through the parent portal, or by cheque at the accounts office until 1 PM on working days. A late fee applies from the following Monday. Families with two or more children enrolled should apply the sibling concession before paying.',
    attachments: [],
    views: 592,
  },
  {
    id: 'vm-nb-5',
    title: 'Kannada Rajyotsava — Programme and Rehearsals',
    tags: [EVENTS],
    audience: 'Entire School',
    postDate: relativeDisplay(-1),
    expiryDate: relativeDisplay(20),
    createdBy: 'Cultural Committee',
    status: 'Scheduled',
    thumbnail: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=120&h=120&fit=crop',
    content:
      'The Rajyotsava assembly will be conducted entirely in Kannada. Class 8 will present a short play and the choir will sing the naadageethe. Rehearsals are during the games period from next week; participating students will be excused from that period only.',
    attachments: [],
    views: 118,
  },
  {
    id: 'vm-nb-6',
    title: 'Library — Reading Challenge for Classes 1 to 5',
    tags: [ANNOUNCEMENT],
    audience: 'Classes 1 to 5',
    postDate: relativeDisplay(-3),
    expiryDate: relativeDisplay(25),
    createdBy: 'Library',
    status: 'Draft',
    thumbnail: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=120&h=120&fit=crop',
    content:
      'A reading challenge will run through the term. Each child who finishes six books and talks about one of them in the library period receives a certificate at the annual day. Books may be borrowed in Kannada or English.',
    attachments: [],
    views: 64,
  },
  {
    id: 'vm-nb-7',
    title: 'Bus Route D — Revised Timings',
    tags: [NOTICE],
    audience: 'Parents — Vijayanagar Route',
    postDate: relativeDisplay(-34),
    expiryDate: relativeDisplay(-6),
    createdBy: 'Transport Office',
    status: 'Expired',
    thumbnail: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=120&h=120&fit=crop',
    content:
      'Following the Outer Ring Road diversion, pickup on Route D moved ten minutes earlier at every stop. The revised timings are now in effect and the old circular may be discarded.',
    attachments: [],
    views: 147,
  },
]
