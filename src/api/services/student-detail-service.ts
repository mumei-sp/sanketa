/**
 * Student Detail CRUD Service
 *
 * Separate from the main student service because it handles the sub-resources
 * (health, documents, extracurricular, behavior, scholarships) that live under
 * a student's detail page.
 *
 * Each function pairs an in-memory mock path with an HTTP path via the shared
 * mockOrHttp adapter. Components call these regardless of which path runs.
 */

import type {
  StudentHealthRecord,
  StudentActivity,
  StudentBehaviorEntry,
  StudentScholarship,
} from '@/features/students/types'
import type { DocumentItem } from '@/components/ui/documents-list'
import apiClient from '@/api/client'
import { mockOrHttp } from './_adapter'
import { withLatency, newId } from '@/mocks/_shared'

// ---------------------------------------------------------------------------
// Health Records
// ---------------------------------------------------------------------------

/** @apiRoute POST /api/v1/students/{studentId}/health-records */
export async function addHealthRecord(
  studentId: string,
  data: Omit<StudentHealthRecord, 'id'>,
): Promise<StudentHealthRecord> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 250, max: 500 })
      return { id: newId('hr'), ...data }
    },
    async () => {
      const { data: created } = await apiClient.post<StudentHealthRecord>(
        `/students/${studentId}/health-records`,
        data,
      )
      return created
    },
  )
}

/** @apiRoute PUT /api/v1/students/{studentId}/health-records/{recordId} */
export async function updateHealthRecord(
  studentId: string,
  record: StudentHealthRecord,
): Promise<StudentHealthRecord> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 250, max: 500 })
      return { ...record }
    },
    async () => {
      const { data: updated } = await apiClient.put<StudentHealthRecord>(
        `/students/${studentId}/health-records/${record.id}`,
        record,
      )
      return updated
    },
  )
}

/** @apiRoute DELETE /api/v1/students/{studentId}/health-records/{recordId} */
export async function deleteHealthRecord(studentId: string, recordId: string): Promise<void> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 250, max: 500 })
    },
    async () => {
      await apiClient.delete(`/students/${studentId}/health-records/${recordId}`)
    },
  )
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

/** @apiRoute POST /api/v1/students/{studentId}/documents */
export async function addDocument(
  studentId: string,
  data: Omit<DocumentItem, 'id'>,
): Promise<DocumentItem> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 250, max: 500 })
      return { id: newId('doc'), ...data }
    },
    async () => {
      const { data: created } = await apiClient.post<DocumentItem>(
        `/students/${studentId}/documents`,
        data,
      )
      return created
    },
  )
}

/** @apiRoute DELETE /api/v1/students/{studentId}/documents/{documentId} */
export async function deleteDocument(studentId: string, documentId: string): Promise<void> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 250, max: 500 })
    },
    async () => {
      await apiClient.delete(`/students/${studentId}/documents/${documentId}`)
    },
  )
}

// ---------------------------------------------------------------------------
// Extracurricular Activities
// ---------------------------------------------------------------------------

/** @apiRoute POST /api/v1/students/{studentId}/activities */
export async function addActivity(
  studentId: string,
  data: Omit<StudentActivity, 'id'>,
): Promise<StudentActivity> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 250, max: 500 })
      return { id: newId('ec'), ...data }
    },
    async () => {
      const { data: created } = await apiClient.post<StudentActivity>(
        `/students/${studentId}/activities`,
        data,
      )
      return created
    },
  )
}

/** @apiRoute PUT /api/v1/students/{studentId}/activities/{activityId} */
export async function updateActivity(
  studentId: string,
  activity: StudentActivity,
): Promise<StudentActivity> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 250, max: 500 })
      return { ...activity }
    },
    async () => {
      const { data: updated } = await apiClient.put<StudentActivity>(
        `/students/${studentId}/activities/${activity.id}`,
        activity,
      )
      return updated
    },
  )
}

/** @apiRoute DELETE /api/v1/students/{studentId}/activities/{activityId} */
export async function deleteActivity(studentId: string, activityId: string): Promise<void> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 250, max: 500 })
    },
    async () => {
      await apiClient.delete(`/students/${studentId}/activities/${activityId}`)
    },
  )
}

// ---------------------------------------------------------------------------
// Behavior Log
// ---------------------------------------------------------------------------

/** @apiRoute POST /api/v1/students/{studentId}/behavior */
export async function addBehaviorEntry(
  studentId: string,
  data: Omit<StudentBehaviorEntry, 'id'>,
): Promise<StudentBehaviorEntry> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 250, max: 500 })
      return { id: newId('bl'), ...data }
    },
    async () => {
      const { data: created } = await apiClient.post<StudentBehaviorEntry>(
        `/students/${studentId}/behavior`,
        data,
      )
      return created
    },
  )
}

/** @apiRoute PUT /api/v1/students/{studentId}/behavior/{entryId} */
export async function updateBehaviorEntry(
  studentId: string,
  entry: StudentBehaviorEntry,
): Promise<StudentBehaviorEntry> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 250, max: 500 })
      return { ...entry }
    },
    async () => {
      const { data: updated } = await apiClient.put<StudentBehaviorEntry>(
        `/students/${studentId}/behavior/${entry.id}`,
        entry,
      )
      return updated
    },
  )
}

/** @apiRoute DELETE /api/v1/students/{studentId}/behavior/{entryId} */
export async function deleteBehaviorEntry(studentId: string, entryId: string): Promise<void> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 250, max: 500 })
    },
    async () => {
      await apiClient.delete(`/students/${studentId}/behavior/${entryId}`)
    },
  )
}

// ---------------------------------------------------------------------------
// Scholarships
// ---------------------------------------------------------------------------

/** @apiRoute POST /api/v1/students/{studentId}/scholarships */
export async function addScholarship(
  studentId: string,
  data: Omit<StudentScholarship, 'id'>,
): Promise<StudentScholarship> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 250, max: 500 })
      return { id: newId('sch'), ...data }
    },
    async () => {
      const { data: created } = await apiClient.post<StudentScholarship>(
        `/students/${studentId}/scholarships`,
        data,
      )
      return created
    },
  )
}

/** @apiRoute PUT /api/v1/students/{studentId}/scholarships/{scholarshipId} */
export async function updateScholarship(
  studentId: string,
  scholarship: StudentScholarship,
): Promise<StudentScholarship> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 250, max: 500 })
      return { ...scholarship }
    },
    async () => {
      const { data: updated } = await apiClient.put<StudentScholarship>(
        `/students/${studentId}/scholarships/${scholarship.id}`,
        scholarship,
      )
      return updated
    },
  )
}

/** @apiRoute DELETE /api/v1/students/{studentId}/scholarships/{scholarshipId} */
export async function deleteScholarship(studentId: string, scholarshipId: string): Promise<void> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 250, max: 500 })
    },
    async () => {
      await apiClient.delete(`/students/${studentId}/scholarships/${scholarshipId}`)
    },
  )
}
