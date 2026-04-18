import type { NoticeBoardEntry } from '@/features/notice-board/types'
import { relativeDisplay } from '@/mocks/_shared/date-helpers'

/**
 * Mock notice-board entries with dates expressed relative to today.
 *
 * Each record uses `relativeDisplay(offset)` (e.g. `relativeDisplay(-5)` for
 * "five days ago") rather than hardcoded strings, so the board always shows
 * current content without a re-seed commit. The spread mimics a real school:
 * a few pinned upcoming events, several active announcements, one scheduled,
 * one expired, one cancelled, one draft.
 */
export const noticeBoardEntries: NoticeBoardEntry[] = [
  {
    id: 'nb-1',
    title: 'Midterm Exam Timetable Released',
    tags: [{ label: 'Academic', color: 'color-mix(in srgb, var(--primary) 55%, white)' }],
    audience: 'Students (Grade 7-9)',
    postDate: relativeDisplay(-3),
    expiryDate: relativeDisplay(10),
    createdBy: 'Academic Office',
    status: 'Active',
    thumbnail: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=120&h=120&fit=crop',
    content:
      'The official midterm exam timetable for Grades 7, 8, and 9 has been released. Students are advised to check their class schedules and prepare accordingly. Detailed subject-wise schedules are available in the attachments below.',
    attachments: [{ name: 'Midterm_Timetable.pdf', type: 'PDF', size: '2.4 MB' }],
    views: 542,
    pinned: true,
  },
  {
    id: 'nb-2',
    title: 'Parent-Teacher Meeting Invitation',
    tags: [{ label: 'Events', color: 'color-mix(in srgb, var(--accent) 65%, white)' }],
    audience: 'Parents & Teachers',
    postDate: relativeDisplay(-5),
    expiryDate: relativeDisplay(7),
    createdBy: "Principal's Office",
    status: 'Active',
    thumbnail: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=120&h=120&fit=crop',
    content:
      "You are invited to the upcoming Parent-Teacher Meeting. This is an opportunity to discuss your child's academic progress, social development, and any concerns.",
    attachments: [],
    views: 328,
  },
  {
    id: 'nb-3',
    title: 'Science Lab Maintenance Notice',
    tags: [{ label: 'Maintenance', color: 'color-mix(in srgb, var(--accent) 40%, white)' }],
    audience: 'Students & Teachers (Science Dept.)',
    postDate: relativeDisplay(-1),
    expiryDate: relativeDisplay(9),
    createdBy: 'Science Department',
    status: 'Scheduled',
    thumbnail: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=120&h=120&fit=crop',
    content:
      'The science lab on the 2nd floor will undergo maintenance next week. All classes scheduled in the lab will be relocated to Room 204.',
    attachments: [],
    views: 189,
  },
  {
    id: 'nb-4',
    title: 'School Choir Rehearsal Postponed',
    tags: [
      { label: 'Arts', color: 'color-mix(in srgb, var(--primary) 40%, white)' },
      { label: 'Events', color: 'color-mix(in srgb, var(--accent) 65%, white)' },
    ],
    audience: 'Choir Members',
    postDate: relativeDisplay(-2),
    expiryDate: relativeDisplay(18),
    createdBy: 'Music Department',
    status: 'Draft',
    thumbnail: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=120&h=120&fit=crop',
    content:
      'Due to auditorium renovations, the school choir rehearsals have been postponed until further notice. Members will be informed about the new schedule via email.',
    attachments: [],
    views: 76,
  },
  {
    id: 'nb-5',
    title: 'Fee Payment Reminder (Grade 9)',
    tags: [{ label: 'Finance', color: 'color-mix(in srgb, var(--accent) 80%, var(--heading) 8%)' }],
    audience: 'Grade 9 Students & Parents',
    postDate: relativeDisplay(-6),
    expiryDate: relativeDisplay(4),
    createdBy: 'Finance Office',
    status: 'Active',
    thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=120&h=120&fit=crop',
    content:
      'This is a reminder that the Term 2 fee payment deadline for Grade 9 students is approaching. Please ensure timely payment to avoid late fees.',
    attachments: [],
    views: 412,
  },
  {
    id: 'nb-6',
    title: 'National Holiday – School Closed',
    tags: [{ label: 'Notice', color: 'color-mix(in srgb, var(--primary) 80%, var(--heading) 8%)' }],
    audience: 'Entire School',
    postDate: relativeDisplay(-18),
    expiryDate: relativeDisplay(-2),
    createdBy: 'Admin Office',
    status: 'Cancelled',
    thumbnail: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=120&h=120&fit=crop',
    content:
      'The school will remain closed in observance of the national holiday. Regular classes will resume the next working day.',
    attachments: [],
    views: 621,
  },
  {
    id: 'nb-7',
    title: 'Teacher Development Workshop',
    tags: [{ label: 'Training', color: 'color-mix(in srgb, var(--accent) 55%, white)' }],
    audience: 'Teachers',
    postDate: relativeDisplay(-45),
    expiryDate: relativeDisplay(-25),
    createdBy: 'HR Department',
    status: 'Expired',
    thumbnail: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=120&h=120&fit=crop',
    content:
      'A professional development workshop for all teaching staff was held last month. Topics covered included classroom management and digital learning tools.',
    attachments: [],
    views: 295,
  },
  {
    id: 'nb-8',
    title: 'Annual Sports Competition',
    tags: [{ label: 'Events', color: 'color-mix(in srgb, var(--accent) 65%, white)' }],
    audience: 'Students',
    postDate: relativeDisplay(-4),
    expiryDate: relativeDisplay(8),
    createdBy: 'Sports Department',
    status: 'Active',
    thumbnail: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=120&h=120&fit=crop',
    content:
      'The annual inter-house sports competition will be held next week. Students interested in participating should register with their house captains.',
    attachments: [],
    views: 487,
    pinned: true,
  },
  {
    id: 'nb-9',
    title: 'Field Trip Consent Forms Due',
    tags: [{ label: 'Announcement', color: 'color-mix(in srgb, var(--primary) 65%, white)' }],
    audience: 'Grade 7 & 8 Students',
    postDate: relativeDisplay(-2),
    expiryDate: relativeDisplay(12),
    createdBy: 'Class Advisor',
    status: 'Active',
    thumbnail: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=120&h=120&fit=crop',
    content:
      'All Grade 7 and 8 students planning to attend the field trip must submit their consent forms by the end of next week.',
    attachments: [{ name: 'Field_Trip_Consent_Form.pdf', type: 'PDF', size: '1.1 MB' }],
    views: 203,
  },
]
