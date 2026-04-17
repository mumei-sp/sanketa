import { noticeBoardEntries } from '@/mocks/notices'
import type { NoticeBoardEntry } from '@/features/notice-board/types'
import type { NoticeFormValues } from '@/features/notice-board/schemas/notice-schema'

const CATEGORY_COLORS: Record<string, string> = {
  Academic: '#E8D5F5',
  Events: '#D4EDDA',
  Maintenance: '#CDEAF0',
  Arts: '#FFE0CC',
  Finance: '#FFF3CD',
  Notice: '#E2E3E5',
  Training: '#D4EDDA',
  Announcement: '#CDEAF0',
}

function randomDelay(): Promise<void> {
  const delay = Math.floor(Math.random() * 300) + 200
  return new Promise(resolve => setTimeout(resolve, delay))
}

export async function fetchNoticeBoardEntries(): Promise<NoticeBoardEntry[]> {
  await randomDelay()
  return [...noticeBoardEntries]
}

export async function createNoticeBoardEntry(data: NoticeFormValues): Promise<NoticeBoardEntry> {
  await randomDelay()
  // TODO: Replace with actual API call, e.g.:
  // return await api.post('/notices', data)
  const newEntry: NoticeBoardEntry = {
    id: `nb-${Date.now()}`,
    title: data.title,
    tags: [{ label: data.category as NoticeBoardEntry['tags'][0]['label'], color: CATEGORY_COLORS[data.category] || '#E2E3E5' }],
    audience: data.audience,
    postDate: new Date(data.postDate.includes('T') ? data.postDate : data.postDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    expiryDate: data.dateValue ? new Date(data.dateValue.includes('T') ? data.dateValue : data.dateValue + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
    dateLabel: data.dateLabel,
    dateEndValue: data.dateEndValue ? new Date(data.dateEndValue.includes('T') ? data.dateEndValue : data.dateEndValue + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : undefined,
    createdBy: 'Surya Admin',
    status: data.status as NoticeBoardEntry['status'],
    thumbnail: data.thumbnail || '',
    content: data.content,
    attachments: [],
    views: 0,
    pinned: data.pinned ?? false,
  }
  noticeBoardEntries.unshift(newEntry)
  return newEntry
}

export async function updateNoticeBoardEntry(id: string, data: NoticeFormValues): Promise<NoticeBoardEntry> {
  await randomDelay()
  // TODO: Replace with actual API call, e.g.:
  // return await api.put(`/notices/${id}`, data)
  const entry = noticeBoardEntries.find(n => n.id === id)
  if (!entry) throw new Error('Notice not found')
  // Title is not editable
  entry.tags = [{ label: data.category as NoticeBoardEntry['tags'][0]['label'], color: CATEGORY_COLORS[data.category] || '#E2E3E5' }]
  entry.audience = data.audience
  entry.expiryDate = data.dateValue ? new Date(data.dateValue.includes('T') ? data.dateValue : data.dateValue + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''
  entry.dateLabel = data.dateLabel
  entry.dateEndValue = data.dateEndValue ? new Date(data.dateEndValue.includes('T') ? data.dateEndValue : data.dateEndValue + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : undefined
  entry.status = data.status as NoticeBoardEntry['status']
  entry.thumbnail = data.thumbnail || ''
  entry.content = data.content
  if (data.pinned !== undefined) entry.pinned = data.pinned
  return { ...entry }
}

export async function incrementNoticeViews(id: string): Promise<number> {
  // TODO: Replace with actual API call, e.g.:
  // return await api.post(`/notices/${id}/views`)
  const entry = noticeBoardEntries.find(n => n.id === id)
  if (entry) {
    entry.views += 1
    return entry.views
  }
  return 0
}

export async function toggleNoticePin(id: string): Promise<NoticeBoardEntry> {
  await randomDelay()
  const entry = noticeBoardEntries.find(n => n.id === id)
  if (!entry) throw new Error('Notice not found')
  entry.pinned = !entry.pinned
  return { ...entry }
}

export async function deleteNoticeBoardEntry(id: string): Promise<void> {
  await randomDelay()
  // TODO: Replace with actual API call, e.g.:
  // await api.delete(`/notices/${id}`)
  const index = noticeBoardEntries.findIndex(n => n.id === id)
  if (index !== -1) {
    noticeBoardEntries.splice(index, 1)
  }
}
