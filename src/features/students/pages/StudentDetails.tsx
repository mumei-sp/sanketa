import * as React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { DetailPageLayout } from '@/components/ui/detail-page-layout'
import { spacing } from '@/config/spacing'
import { useStudentById } from '@/features/students/hooks/use-student-by-id'
import { useStudentDetailData } from '@/features/students/hooks/use-student-detail-data'
import { getDisplayName } from '@/features/students/utils/formatting'
import { getStudentBreadcrumbs } from '../utils/breadcrumbs'
import { STUDENT_MESSAGES } from '../constants'

import { StudentProfileCard } from '../components/StudentProfileCard'
import { StudentDocuments } from '../components/StudentDocuments'
import { StudentAttendanceCalendar } from '../components/StudentAttendanceCalendar'
import { StudentScholarships } from '../components/StudentScholarships'
import { StudentHealthInfo } from '../components/StudentHealthInfo'
import { AcademicPerformance } from '../components/AcademicPerformance'
import { StudentExtracurricular } from '../components/StudentExtracurricular'
import { StudentBehaviorLog } from '../components/StudentBehaviorLog'

// CRUD dialogs
import { HealthRecordFormSheet } from '../components/detail-crud/HealthRecordFormSheet'
import { ScholarshipFormSheet } from '../components/detail-crud/ScholarshipFormSheet'
import { ExtracurricularFormSheet } from '../components/detail-crud/ExtracurricularFormSheet'
import { BehaviorFormSheet } from '../components/detail-crud/BehaviorFormSheet'
import { DocumentUploadFormSheet } from '../components/detail-crud/DocumentUploadFormSheet'
import { DeleteConfirmDialog } from '../components/detail-crud/DeleteConfirmDialog'

// Services
import * as detailService from '@/api/services/student-detail-service'

import type { StudentDetailData, StudentHealthRecord, StudentScholarship, StudentActivity, StudentBehaviorEntry } from '../types'
import type { DocumentItem } from '@/components/ui/documents-list'

// ── Modal state discriminated union ──

type ModalState =
  | { type: 'health'; record: StudentHealthRecord | null }
  | { type: 'scholarship'; record: StudentScholarship | null }
  | { type: 'extracurricular'; record: StudentActivity | null }
  | { type: 'behavior'; record: StudentBehaviorEntry | null }
  | { type: 'document' }
  | null

interface DeleteTarget {
  section: 'health' | 'scholarship' | 'extracurricular' | 'behavior' | 'document'
  id: string
  label: string
}

/**
 * StudentDetails page component
 * Displays comprehensive student information in a 3-column layout (desktop),
 * 2-column (tablet), or single column (mobile).
 */
export default function StudentDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { student, isLoading, error } = useStudentById(id)
  const { detailData } = useStudentDetailData(id)

  const [calYear, setCalYear] = React.useState(() => new Date().getFullYear())
  const [calMonth, setCalMonth] = React.useState(() => new Date().getMonth())

  // ── Local data (optimistic updates) ──
  const [localData, setLocalData] = React.useState<StudentDetailData | null>(null)
  React.useEffect(() => {
    if (detailData) setLocalData({ ...detailData })
  }, [detailData])

  // ── Modal & delete state ──
  const [activeModal, setActiveModal] = React.useState<ModalState>(null)
  const [isSaving, setIsSaving] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<DeleteTarget | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const studentId = id ?? ''

  // ── Navigation ──
  const handleBack = React.useCallback(() => navigate('/students'), [navigate])

  const handleMonthChange = React.useCallback((year: number, month: number) => {
    setCalYear(year)
    setCalMonth(month)
  }, [])

  // ── CRUD Handlers ──

  // Health
  const handleSaveHealth = React.useCallback(async (data: Omit<StudentHealthRecord, 'id'>) => {
    setIsSaving(true)
    try {
      const editing = activeModal?.type === 'health' ? activeModal.record : null
      if (editing) {
        const updated = await detailService.updateHealthRecord(studentId, { ...editing, ...data })
        setLocalData(prev => prev ? { ...prev, healthRecords: prev.healthRecords.map(r => r.id === updated.id ? updated : r) } : prev)
        toast.success('Health record updated')
      } else {
        const created = await detailService.addHealthRecord(studentId, data)
        setLocalData(prev => prev ? { ...prev, healthRecords: [...prev.healthRecords, created] } : prev)
        toast.success('Health record added')
      }
      setActiveModal(null)
    } catch { toast.error('Failed to save health record') }
    finally { setIsSaving(false) }
  }, [activeModal, studentId])

  // Scholarships
  const handleSaveScholarship = React.useCallback(async (data: Omit<StudentScholarship, 'id'>) => {
    setIsSaving(true)
    try {
      const editing = activeModal?.type === 'scholarship' ? activeModal.record : null
      if (editing) {
        const updated = await detailService.updateScholarship(studentId, { ...editing, ...data })
        setLocalData(prev => prev ? { ...prev, scholarships: prev.scholarships.map(s => s.id === updated.id ? updated : s) } : prev)
        toast.success('Scholarship updated')
      } else {
        const created = await detailService.addScholarship(studentId, data)
        setLocalData(prev => prev ? { ...prev, scholarships: [...prev.scholarships, created] } : prev)
        toast.success('Scholarship added')
      }
      setActiveModal(null)
    } catch { toast.error('Failed to save scholarship') }
    finally { setIsSaving(false) }
  }, [activeModal, studentId])

  // Extracurricular
  const handleSaveActivity = React.useCallback(async (data: Omit<StudentActivity, 'id'>) => {
    setIsSaving(true)
    try {
      const editing = activeModal?.type === 'extracurricular' ? activeModal.record : null
      if (editing) {
        const updated = await detailService.updateActivity(studentId, { ...editing, ...data })
        setLocalData(prev => prev ? { ...prev, extracurriculars: prev.extracurriculars.map(a => a.id === updated.id ? updated : a) } : prev)
        toast.success('Activity updated')
      } else {
        const created = await detailService.addActivity(studentId, data)
        setLocalData(prev => prev ? { ...prev, extracurriculars: [...prev.extracurriculars, created] } : prev)
        toast.success('Activity added')
      }
      setActiveModal(null)
    } catch { toast.error('Failed to save activity') }
    finally { setIsSaving(false) }
  }, [activeModal, studentId])

  // Behavior
  const handleSaveBehavior = React.useCallback(async (data: Omit<StudentBehaviorEntry, 'id'>) => {
    setIsSaving(true)
    try {
      const editing = activeModal?.type === 'behavior' ? activeModal.record : null
      if (editing) {
        const updated = await detailService.updateBehaviorEntry(studentId, { ...editing, ...data })
        setLocalData(prev => prev ? { ...prev, behaviorLog: prev.behaviorLog.map(b => b.id === updated.id ? updated : b) } : prev)
        toast.success('Behavior entry updated')
      } else {
        const created = await detailService.addBehaviorEntry(studentId, data)
        setLocalData(prev => prev ? { ...prev, behaviorLog: [...prev.behaviorLog, created] } : prev)
        toast.success('Behavior entry logged')
      }
      setActiveModal(null)
    } catch { toast.error('Failed to save behavior entry') }
    finally { setIsSaving(false) }
  }, [activeModal, studentId])

  // Documents
  const handleSaveDocument = React.useCallback(async (data: Omit<DocumentItem, 'id'>) => {
    setIsSaving(true)
    try {
      const created = await detailService.addDocument(studentId, data)
      setLocalData(prev => prev ? { ...prev, documents: [...prev.documents, created] } : prev)
      toast.success('Document uploaded')
      setActiveModal(null)
    } catch { toast.error('Failed to upload document') }
    finally { setIsSaving(false) }
  }, [studentId])

  // Delete (shared)
  const handleConfirmDelete = React.useCallback(async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const { section, id: recordId } = deleteTarget
      switch (section) {
        case 'health':
          await detailService.deleteHealthRecord(studentId, recordId)
          setLocalData(prev => prev ? { ...prev, healthRecords: prev.healthRecords.filter(r => r.id !== recordId) } : prev)
          toast.success('Health record deleted')
          break
        case 'scholarship':
          await detailService.deleteScholarship(studentId, recordId)
          setLocalData(prev => prev ? { ...prev, scholarships: prev.scholarships.filter(s => s.id !== recordId) } : prev)
          toast.success('Scholarship deleted')
          break
        case 'extracurricular':
          await detailService.deleteActivity(studentId, recordId)
          setLocalData(prev => prev ? { ...prev, extracurriculars: prev.extracurriculars.filter(a => a.id !== recordId) } : prev)
          toast.success('Activity deleted')
          break
        case 'behavior':
          await detailService.deleteBehaviorEntry(studentId, recordId)
          setLocalData(prev => prev ? { ...prev, behaviorLog: prev.behaviorLog.filter(b => b.id !== recordId) } : prev)
          toast.success('Behavior entry deleted')
          break
        case 'document':
          await detailService.deleteDocument(studentId, recordId)
          setLocalData(prev => prev ? { ...prev, documents: prev.documents.filter(d => d.id !== recordId) } : prev)
          toast.success('Document deleted')
          break
      }
      setDeleteTarget(null)
    } catch { toast.error('Failed to delete') }
    finally { setIsDeleting(false) }
  }, [deleteTarget, studentId])

  // ── Derived data ──
  const monthKey = `${calYear}-${calMonth}`
  const currentAttendance = localData?.monthlyAttendance[monthKey]
  const calendarHighlights = currentAttendance?.highlights ?? []
  const attendanceSummary = currentAttendance?.summary

  const displayName = student ? getDisplayName(student) : 'Student Details'
  const breadcrumbs = React.useMemo(
    () => getStudentBreadcrumbs('details', displayName),
    [displayName],
  )

  return (
    <DetailPageLayout
      title="Student Details"
      breadcrumbs={breadcrumbs}
      showBackButton
      isLoading={isLoading}
      error={error || (!student && !isLoading ? STUDENT_MESSAGES.NOT_FOUND : null)}
      errorActionLabel={STUDENT_MESSAGES.BACK_TO_STUDENTS}
      onErrorAction={handleBack}
      loadingMessage={STUDENT_MESSAGES.LOADING_DETAILS}
    >
      {student && (
        <div
          className="grid grid-cols-1 md:grid-cols-[280px_1fr] xl:grid-cols-[25%_25%_1fr]"
          style={{ gap: spacing['4'] }}
        >
          {/* ═══ LEFT COLUMN ═══ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['4'] }}>
            <StudentProfileCard student={student} />
            <StudentDocuments
              documents={localData?.documents ?? []}
              onAdd={() => setActiveModal({ type: 'document' })}
              onDelete={docId => {
                const doc = localData?.documents.find(d => d.id === docId)
                setDeleteTarget({ section: 'document', id: docId, label: doc?.name ?? 'this document' })
              }}
            />
          </div>

          {/* ═══ MIDDLE COLUMN ═══ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['4'] }}>
            <StudentAttendanceCalendar
              year={calYear}
              month={calMonth}
              highlights={calendarHighlights}
              summary={attendanceSummary}
              onMonthChange={handleMonthChange}
            />
            <StudentScholarships
              scholarships={localData?.scholarships ?? []}
              onAdd={() => setActiveModal({ type: 'scholarship', record: null })}
              onEdit={sch => setActiveModal({ type: 'scholarship', record: sch })}
              onDelete={schId => {
                const sch = localData?.scholarships.find(s => s.id === schId)
                setDeleteTarget({ section: 'scholarship', id: schId, label: sch?.title ?? 'this scholarship' })
              }}
            />
            <StudentHealthInfo
              records={localData?.healthRecords ?? []}
              onAdd={() => setActiveModal({ type: 'health', record: null })}
              onEdit={rec => setActiveModal({ type: 'health', record: rec })}
              onDelete={recId => {
                const rec = localData?.healthRecords.find(r => r.id === recId)
                setDeleteTarget({ section: 'health', id: recId, label: rec?.title ?? 'this record' })
              }}
            />
          </div>

          {/* ═══ RIGHT COLUMN ═══ */}
          <div
            className="md:col-span-2 xl:col-span-1"
            style={{ display: 'flex', flexDirection: 'column', gap: spacing['4'] }}
          >
            <AcademicPerformance
              averageScore={student.gpa}
              maxScore={4}
              studentName={getDisplayName(student)}
            />
            <StudentExtracurricular
              activities={localData?.extracurriculars ?? []}
              onAdd={() => setActiveModal({ type: 'extracurricular', record: null })}
              onEdit={act => setActiveModal({ type: 'extracurricular', record: act })}
              onDelete={actId => {
                const act = localData?.extracurriculars.find(a => a.id === actId)
                setDeleteTarget({ section: 'extracurricular', id: actId, label: act?.club ?? 'this activity' })
              }}
            />
            <StudentBehaviorLog
              entries={localData?.behaviorLog ?? []}
              onAdd={() => setActiveModal({ type: 'behavior', record: null })}
              onEdit={entry => setActiveModal({ type: 'behavior', record: entry })}
              onDelete={entryId => {
                const entry = localData?.behaviorLog.find(b => b.id === entryId)
                setDeleteTarget({ section: 'behavior', id: entryId, label: entry?.details?.slice(0, 30) ?? 'this entry' })
              }}
            />
          </div>
        </div>
      )}

      {/* ═══ CRUD DIALOGS ═══ */}
      <HealthRecordFormSheet
        open={activeModal?.type === 'health'}
        onOpenChange={open => { if (!open) setActiveModal(null) }}
        record={activeModal?.type === 'health' ? activeModal.record : null}
        onSave={handleSaveHealth}
        isSaving={isSaving}
      />
      <ScholarshipFormSheet
        open={activeModal?.type === 'scholarship'}
        onOpenChange={open => { if (!open) setActiveModal(null) }}
        record={activeModal?.type === 'scholarship' ? activeModal.record : null}
        onSave={handleSaveScholarship}
        isSaving={isSaving}
      />
      <ExtracurricularFormSheet
        open={activeModal?.type === 'extracurricular'}
        onOpenChange={open => { if (!open) setActiveModal(null) }}
        record={activeModal?.type === 'extracurricular' ? activeModal.record : null}
        onSave={handleSaveActivity}
        isSaving={isSaving}
      />
      <BehaviorFormSheet
        open={activeModal?.type === 'behavior'}
        onOpenChange={open => { if (!open) setActiveModal(null) }}
        record={activeModal?.type === 'behavior' ? activeModal.record : null}
        onSave={handleSaveBehavior}
        isSaving={isSaving}
      />
      <DocumentUploadFormSheet
        open={activeModal?.type === 'document'}
        onOpenChange={open => { if (!open) setActiveModal(null) }}
        onSave={handleSaveDocument}
        isSaving={isSaving}
      />
      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={open => { if (!open) setDeleteTarget(null) }}
        title="Delete Record"
        description={`Are you sure you want to delete "${deleteTarget?.label}"? This action cannot be undone.`}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </DetailPageLayout>
  )
}
