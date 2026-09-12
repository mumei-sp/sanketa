import type { AudienceReach } from '@/config/audience'
export type NoticeCategory =
  | 'Academic'
  | 'Events'
  | 'Maintenance'
  | 'Arts'
  | 'Finance'
  | 'Notice'
  | 'Training'
  | 'Announcement'

export type NoticeStatus = 'Active' | 'Scheduled' | 'Draft' | 'Expired' | 'Cancelled'

export interface NoticeAttachment {
  name: string
  type: string
  size: string
}

export interface NoticeBoardEntry {
  id: string
  title: string
  tags: { label: NoticeCategory; color: string }[]
  /** Who it is addressed to, as the school wrote it. What everyone reads. */
  audience: string
  /**
   * The same thing, in terms the app can match on. Absent means the whole
   * board — see `config/audience.ts` for why that is the resting state, and
   * for what a reach deliberately cannot express.
   */
  reach?: AudienceReach
  postDate: string
  expiryDate: string
  dateLabel?: string
  dateEndValue?: string
  createdBy: string
  status: NoticeStatus
  thumbnail: string
  content: string
  attachments: NoticeAttachment[]
  views: number
  pinned?: boolean
}
