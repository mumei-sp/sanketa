/**
 * Student Detail CRUD Service
 *
 * Mock service functions for creating, updating, and deleting
 * student detail records (health, documents, extracurricular,
 * behavior, scholarships). Each function simulates a network
 * delay and returns the result.
 *
 * When the backend is ready, replace the setTimeout mocks with
 * real API calls — the function signatures stay the same.
 */

import type {
  StudentHealthRecord,
  StudentActivity,
  StudentBehaviorEntry,
  StudentScholarship,
} from '@/features/students/types'
import type { DocumentItem } from '@/components/ui/documents-list'

// ── Helpers ──

let counter = Date.now()
function nextId(prefix: string): string {
  return `${prefix}-${++counter}`
}

function mockDelay(): Promise<void> {
  const ms = Math.floor(Math.random() * 300) + 300
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ── Health Records ──

export async function addHealthRecord(
  _studentId: string,
  data: Omit<StudentHealthRecord, 'id'>,
): Promise<StudentHealthRecord> {
  await mockDelay()
  return { id: nextId('hr'), ...data }
}

export async function updateHealthRecord(
  _studentId: string,
  record: StudentHealthRecord,
): Promise<StudentHealthRecord> {
  await mockDelay()
  return { ...record }
}

export async function deleteHealthRecord(
  _studentId: string,
  _recordId: string,
): Promise<void> {
  await mockDelay()
}

// ── Documents ──

export async function addDocument(
  _studentId: string,
  data: Omit<DocumentItem, 'id'>,
): Promise<DocumentItem> {
  await mockDelay()
  return { id: nextId('doc'), ...data }
}

export async function deleteDocument(
  _studentId: string,
  _documentId: string,
): Promise<void> {
  await mockDelay()
}

// ── Extracurricular Activities ──

export async function addActivity(
  _studentId: string,
  data: Omit<StudentActivity, 'id'>,
): Promise<StudentActivity> {
  await mockDelay()
  return { id: nextId('ec'), ...data }
}

export async function updateActivity(
  _studentId: string,
  activity: StudentActivity,
): Promise<StudentActivity> {
  await mockDelay()
  return { ...activity }
}

export async function deleteActivity(
  _studentId: string,
  _activityId: string,
): Promise<void> {
  await mockDelay()
}

// ── Behavior Log ──

export async function addBehaviorEntry(
  _studentId: string,
  data: Omit<StudentBehaviorEntry, 'id'>,
): Promise<StudentBehaviorEntry> {
  await mockDelay()
  return { id: nextId('bl'), ...data }
}

export async function updateBehaviorEntry(
  _studentId: string,
  entry: StudentBehaviorEntry,
): Promise<StudentBehaviorEntry> {
  await mockDelay()
  return { ...entry }
}

export async function deleteBehaviorEntry(
  _studentId: string,
  _entryId: string,
): Promise<void> {
  await mockDelay()
}

// ── Scholarships ──

export async function addScholarship(
  _studentId: string,
  data: Omit<StudentScholarship, 'id'>,
): Promise<StudentScholarship> {
  await mockDelay()
  return { id: nextId('sch'), ...data }
}

export async function updateScholarship(
  _studentId: string,
  scholarship: StudentScholarship,
): Promise<StudentScholarship> {
  await mockDelay()
  return { ...scholarship }
}

export async function deleteScholarship(
  _studentId: string,
  _scholarshipId: string,
): Promise<void> {
  await mockDelay()
}
