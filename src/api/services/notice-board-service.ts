/**
 * Notice Board API Service
 *
 * Mock path (in-memory noticeBoardEntries) + HTTP path (apiClient).
 */
import apiClient from '@/api/client'
import { mockOrHttp } from './_adapter'
import { withLatency, newId, displayDate } from '@/mocks/_shared'
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

/** Accept either `YYYY-MM-DD` or full ISO and return the "Apr 16, 2026" display variant. */
function toDisplayDate(raw: string): string {
  const normalised = raw.includes('T') ? raw : `${raw}T00:00:00`
  return displayDate(new Date(normalised))
}

/**
 * Fetch all notice-board entries.
 *
 * @apiRoute GET /api/v1/notices
 */
export async function fetchNoticeBoardEntries(): Promise<NoticeBoardEntry[]> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 200, max: 500 })
      return [...noticeBoardEntries]
    },
    async () => {
      const { data } = await apiClient.get<NoticeBoardEntry[]>('/notices')
      return data
    },
  )
}

/**
 * Create a new notice.
 *
 * @apiRoute POST /api/v1/notices
 */
export async function createNoticeBoardEntry(data: NoticeFormValues): Promise<NoticeBoardEntry> {
  return mockOrHttp(
    async () => {
      await withLatency()
      const newEntry: NoticeBoardEntry = {
        id: newId('nb'),
        title: data.title,
        tags: [{ label: data.category as NoticeBoardEntry['tags'][0]['label'], color: CATEGORY_COLORS[data.category] || '#E2E3E5' }],
        audience: data.audience,
        postDate: toDisplayDate(data.postDate),
        expiryDate: data.dateValue ? toDisplayDate(data.dateValue) : '',
        dateLabel: data.dateLabel,
        dateEndValue: data.dateEndValue ? toDisplayDate(data.dateEndValue) : undefined,
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
    },
    async () => {
      const { data: created } = await apiClient.post<NoticeBoardEntry>('/notices', data)
      return created
    },
  )
}

/**
 * Update an existing notice.
 *
 * @apiRoute PUT /api/v1/notices/{id}
 */
export async function updateNoticeBoardEntry(
  id: string,
  data: NoticeFormValues,
): Promise<NoticeBoardEntry> {
  return mockOrHttp(
    async () => {
      await withLatency()
      const entry = noticeBoardEntries.find(n => n.id === id)
      if (!entry) throw new Error('Notice not found')
      // Title is intentionally immutable on edit.
      entry.tags = [{ label: data.category as NoticeBoardEntry['tags'][0]['label'], color: CATEGORY_COLORS[data.category] || '#E2E3E5' }]
      entry.audience = data.audience
      entry.expiryDate = data.dateValue ? toDisplayDate(data.dateValue) : ''
      entry.dateLabel = data.dateLabel
      entry.dateEndValue = data.dateEndValue ? toDisplayDate(data.dateEndValue) : undefined
      entry.status = data.status as NoticeBoardEntry['status']
      entry.thumbnail = data.thumbnail || ''
      entry.content = data.content
      if (data.pinned !== undefined) entry.pinned = data.pinned
      return { ...entry }
    },
    async () => {
      const { data: updated } = await apiClient.put<NoticeBoardEntry>(`/notices/${id}`, data)
      return updated
    },
  )
}

/**
 * Increment the view counter on a notice.
 *
 * @apiRoute POST /api/v1/notices/{id}/views
 */
export async function incrementNoticeViews(id: string): Promise<number> {
  return mockOrHttp(
    () => {
      const entry = noticeBoardEntries.find(n => n.id === id)
      if (entry) {
        entry.views += 1
        return entry.views
      }
      return 0
    },
    async () => {
      const { data } = await apiClient.post<{ views: number }>(`/notices/${id}/views`)
      return data.views
    },
  )
}

/**
 * Toggle pinned state.
 *
 * @apiRoute POST /api/v1/notices/{id}/pin
 */
export async function toggleNoticePin(id: string): Promise<NoticeBoardEntry> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 150, max: 350 })
      const entry = noticeBoardEntries.find(n => n.id === id)
      if (!entry) throw new Error('Notice not found')
      entry.pinned = !entry.pinned
      return { ...entry }
    },
    async () => {
      const { data } = await apiClient.post<NoticeBoardEntry>(`/notices/${id}/pin`)
      return data
    },
  )
}

/**
 * Delete a notice.
 *
 * @apiRoute DELETE /api/v1/notices/{id}
 */
export async function deleteNoticeBoardEntry(id: string): Promise<void> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 150, max: 400 })
      const index = noticeBoardEntries.findIndex(n => n.id === id)
      if (index !== -1) noticeBoardEntries.splice(index, 1)
    },
    async () => {
      await apiClient.delete(`/notices/${id}`)
    },
  )
}
