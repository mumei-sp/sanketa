/**
 * Consent — the events that ask a family a question, and the answers.
 *
 * Mock path + HTTP path per endpoint, like every other service here.
 *
 * ── Two guards, because there are two subjects ────────────────────────
 * WHICH EVENTS ask a family anything is an audience question, answered by
 * `audienceReaches` exactly as it is for a notice — the event's own `reach`,
 * nothing new. A parent is asked about the museum trip because the trip is
 * addressed to Class 9 parents.
 *
 * WHOSE CHILD an answer is about is a scope question, answered on the Student
 * axis every role already carries. That is what stops a parent answering for
 * somebody else's child by passing their id, and it is the same axis the
 * callback requests and the transport card use. No `consent.read` exists,
 * because granting one to families is the mistake those two avoided.
 */

import apiClient from '@/api/client'
import { mockOrHttp } from './_adapter'
import { withLatency } from '@/mocks/_shared'
import { callerAudience } from '@/mocks/_shared/audience'
import { audienceReaches } from '@/config/audience'
import {
  visibleToCaller,
  visibleRecordToCaller,
  callerIsTheSubject,
} from '@/mocks/_shared/caller'
import * as consentServer from '@/mocks/tenant/consent/store'
import { mockCalendarEvents } from '@/mocks/tenant/calendar/calendar'
import { findStudent, listStudents } from '@/mocks/tenant/students'
import { classSectionOf } from '@/utils/class-section-helpers'
import type { CalendarEvent } from '@/features/calendar/types'
import type { ConsentAnswer, ConsentResponse } from '@/mocks/tenant/consent/store'

export type { ConsentAnswer, ConsentResponse }

/** An event that wants an answer, paired with this child's answer so far. */
export interface ConsentAsk {
  eventId: string
  title: string
  /** ISO start of the event itself. */
  start: string
  /** ISO date an answer is wanted by, when the school set one. */
  respondBy: string | null
  location: string | null
  studentId: string
  /** Null until the family answers. */
  answer: ConsentAnswer | null
  answeredByName: string | null
}

/** Events carrying `needsConsent` that this caller is actually addressed by. */
function asksReachingCaller(): CalendarEvent[] {
  const viewer = callerAudience('CalendarEvent')
  return mockCalendarEvents.filter(
    event =>
      event.extendedProps.needsConsent === true &&
      audienceReaches(event.extendedProps.reach, viewer),
  )
}

function scopeOf(studentId: string) {
  const student = findStudent(studentId)
  return {
    studentId,
    classSection: student ? classSectionOf(student) : undefined,
  }
}

/**
 * What this family still has to answer, and what they have already said.
 *
 * Takes the children explicitly rather than resolving them here: the caller
 * already knows which child is on screen, and a parent of two should not be
 * asked twice on one child's page.
 *
 * @apiRoute GET /api/v1/consent/asks?studentId={studentId}
 */
export async function fetchConsentAsks(studentId: string): Promise<ConsentAsk[]> {
  return mockOrHttp(
    async () => {
      await withLatency()
      const student = findStudent(studentId)
      if (!student) return []
      // The child has to be this caller's before we say what was asked about them.
      if (!visibleRecordToCaller(student, 'read', 'Student', row => ({
        studentId: String(row.id),
        classSection: classSectionOf(row),
      }))) {
        return []
      }

      // The Student axis is satisfied by BEING the child, and a pupil giving
      // their own permission for a trip is the one reading of "may you see this
      // record" that defeats the point of asking. Consent is a guardian's to
      // give. (The same hole was found in the callback service — see
      // `callerIsTheSubject` there.)
      if (callerIsTheSubject(studentId)) return []

      const mine = consentServer.listResponses({ studentId })
      return asksReachingCaller().map(event => {
        const answered = mine.find(row => row.eventId === event.id)
        return {
          eventId: event.id,
          title: event.title,
          start: String(event.start),
          respondBy: event.extendedProps.consentBy ?? null,
          location: event.extendedProps.location ?? null,
          studentId,
          answer: answered?.answer ?? null,
          answeredByName: answered?.answeredByName ?? null,
        }
      })
    },
    async () => {
      const { data } = await apiClient.get<ConsentAsk[]>('/consent/asks', {
        params: { studentId },
      })
      return data
    },
  )
}

/**
 * Answer for one child. Answering again replaces the answer rather than adding
 * one — see `recordResponse`.
 *
 * @apiRoute POST /api/v1/consent/responses
 */
export async function respondToConsent(input: {
  eventId: string
  studentId: string
  answer: ConsentAnswer
  answeredById: string
  answeredByName: string
}): Promise<ConsentResponse | null> {
  return mockOrHttp(
    async () => {
      await withLatency()
      const student = findStudent(input.studentId)
      if (!student) return null
      if (!visibleRecordToCaller(student, 'read', 'Student', row => ({
        studentId: String(row.id),
        classSection: classSectionOf(row),
      }))) {
        return null
      }
      // A child may not consent for themselves — see `fetchConsentAsks`. This
      // is the write, so it matters more here than there.
      if (callerIsTheSubject(input.studentId)) return null
      // And the event must actually be asking this family — otherwise an answer
      // could be recorded against an event nobody put to them.
      if (!asksReachingCaller().some(event => event.id === input.eventId)) return null

      return consentServer.recordResponse(input)
    },
    async () => {
      const { data } = await apiClient.post<ConsentResponse>('/consent/responses', input)
      return data
    },
  )
}

/** One child's line on the trip list. */
export interface ConsentTallyRow {
  studentId: string
  studentName: string
  answer: ConsentAnswer | null
  answeredByName: string | null
  answeredAt: string | null
}

/**
 * Who has answered, for the people running the trip.
 *
 * Narrowed by child, so a class teacher sees their own pupils' lines and an
 * admin sees everyone's — the same rule the register and the grade sheet
 * follow. "No answer yet" is a row rather than an absence, because the whole
 * point of this list is the children nobody has heard about.
 *
 * @apiRoute GET /api/v1/consent/events/{eventId}/responses
 */
export async function fetchConsentTally(eventId: string): Promise<ConsentTallyRow[]> {
  return mockOrHttp(
    async () => {
      await withLatency()
      const event = mockCalendarEvents.find(row => row.id === eventId)
      if (!event || event.extendedProps.needsConsent !== true) return []

      // Who was ASKED comes off the event's own reach rather than from the
      // caller: a trip addressed to grades 7 and 9 asks those families and no
      // others, and resolving that here is what makes "no answer yet" mean
      // something. Absent grades means the whole school, as everywhere else.
      const grades = event.extendedProps.reach?.grades
      const asked = listStudents().filter(
        student => !grades?.length || (student.gradeLevel ? grades.includes(student.gradeLevel) : false),
      )

      const answers = consentServer.listResponses({ eventId })
      const rows: ConsentTallyRow[] = asked.flatMap(student => {
        const studentId = String(student.id)
        const answered = answers.find(row => row.studentId === studentId)
        return [
          {
            studentId,
            studentName: [student.firstName, student.lastName].filter(Boolean).join(' '),
            answer: answered?.answer ?? null,
            answeredByName: answered?.answeredByName ?? null,
            answeredAt: answered?.answeredAt ?? null,
          },
        ]
      })
      return visibleToCaller(rows, 'read', 'Student', row => scopeOf(row.studentId))
    },
    async () => {
      const { data } = await apiClient.get<ConsentTallyRow[]>(
        `/consent/events/${eventId}/responses`,
      )
      return data
    },
  )
}
