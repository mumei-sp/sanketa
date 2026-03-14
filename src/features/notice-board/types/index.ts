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
  audience: string
  postDate: string
  expiryDate: string
  createdBy: string
  status: NoticeStatus
  thumbnail: string
  content: string
  attachments: NoticeAttachment[]
  views: number
}
