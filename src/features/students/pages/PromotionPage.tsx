/**
 * PromotionPage — Year-end student promotion workflow.
 *
 * Select class → review students with auto-recommendations → confirm promotion.
 * Route: /students/promotion
 */

import * as React from 'react'
import { ArrowUpCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { colors } from '@/theme/colors'
import { spacing } from '@/config/spacing'
import PageHeader from '@/components/layout/PageHeader'
import { Tile } from '@/components/tile'
import { Skeleton } from '@/components/ui/skeleton'
import { useSchoolConfig } from '@/config/SchoolConfigContext'
import { PromotionTable } from '../components/promotion/PromotionTable'
import { PromotionSummaryBar } from '../components/promotion/PromotionSummaryBar'
import { PromotionConfirmDialog } from '../components/promotion/PromotionConfirmDialog'
import {
  fetchClassesForPromotion,
  fetchPromotionCandidates,
  executePromotion,
} from '@/api/services/student-service'
import type { PromotionCandidate, PromotionDecision, ClassPromotionSummary } from '../types/promotion'

export function PromotionPage() {
  const { config } = useSchoolConfig()
  const passingThreshold = config.grading.passingThreshold

  // ── Reference data ──
  const [classes, setClasses] = React.useState<ClassPromotionSummary[]>([])
  const [selectedClass, setSelectedClass] = React.useState('')
  const [candidates, setCandidates] = React.useState<PromotionCandidate[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [isExecuting, setIsExecuting] = React.useState(false)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [isDone, setIsDone] = React.useState(false)

  // Load classes
  React.useEffect(() => {
    fetchClassesForPromotion().then(cls => {
      setClasses(cls)
      if (cls.length > 0) setSelectedClass(cls[0].classLabel)
    })
  }, [])

  // Load candidates when class changes
  React.useEffect(() => {
    if (!selectedClass) return
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setIsDone(false)
      try {
        const data = await fetchPromotionCandidates(selectedClass, passingThreshold)
        if (!cancelled) setCandidates(data)
      } catch (err) {
        console.error('Failed to load candidates:', err)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [selectedClass, passingThreshold])

  // ── Handlers ──

  const handleDecisionChange = React.useCallback((studentId: string, decision: PromotionDecision) => {
    setCandidates(prev => prev.map(c =>
      c.studentId === studentId ? { ...c, decision } : c,
    ))
  }, [])

  const handleExecute = React.useCallback(async (targetSection: string) => {
    setIsExecuting(true)
    try {
      await executePromotion(selectedClass, candidates, targetSection)
      const promoted = candidates.filter(c => c.decision === 'promote').length
      toast.success(`Promotion complete — ${promoted} students promoted`)
      setConfirmOpen(false)
      setIsDone(true)
    } catch (err) {
      console.error('Promotion failed:', err)
    } finally {
      setIsExecuting(false)
    }
  }, [selectedClass, candidates])

  // ── Computed ──
  const promoteCount = candidates.filter(c => c.decision === 'promote').length
  const retainCount = candidates.filter(c => c.decision === 'retain').length
  const atRiskCount = candidates.filter(c => c.performance === 'At Risk').length
  const sourceGrade = parseInt(selectedClass.replace(/[A-Z]/g, '') || '0')

  const breadcrumbs = React.useMemo(() => [
    { label: 'Dashboard', href: '/' },
    { label: 'Students', href: '/students/all' },
    { label: 'Promotion' },
  ], [])

  return (
    <div className="space-y-4">
      <PageHeader title="Student Promotion" breadcrumbs={breadcrumbs} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['4'] }}>
        {/* ═══ TOOLBAR ═══ */}
        <div
          className="rounded-lg border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap"
          style={{
            backgroundColor: colors.background.card,
            borderColor: colors.border.default,
            padding: spacing['3'],
          }}
        >
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="text-sm rounded-md border px-3 py-1.5 outline-none"
              style={{
                borderColor: colors.border.default,
                color: colors.text.heading,
                backgroundColor: colors.background.card,
              }}
            >
              {classes.map(cls => (
                <option key={cls.classLabel} value={cls.classLabel}>
                  Class {cls.classLabel} ({cls.studentCount} students)
                </option>
              ))}
            </select>

            <span className="text-xs" style={{ color: colors.text.muted }}>
              Academic Year 2035–36
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs" style={{ color: colors.text.muted }}>
            <ArrowUpCircle className="w-3.5 h-3.5" />
            <span>
              {selectedClass} → Class {sourceGrade + 1} · Pass threshold: {passingThreshold}%
            </span>
          </div>
        </div>

        {/* ═══ SUMMARY BANNER ═══ */}
        {!isLoading && candidates.length > 0 && !isDone && (
          <div
            className="rounded-lg border flex items-center gap-3 text-sm flex-wrap"
            style={{
              padding: `${spacing['2.5']} ${spacing['3']}`,
              borderColor: colors.accent.base,
              backgroundColor: colors.accent.base,
              color: colors.text.heading,
            }}
          >
            <span>
              <strong>{candidates.length}</strong> students in Class {selectedClass}
            </span>
            <span style={{ opacity: 0.4 }}>·</span>
            <span>
              <strong>{promoteCount}</strong> recommended for promotion
            </span>
            {atRiskCount > 0 && (
              <>
                <span style={{ opacity: 0.4 }}>·</span>
                <span style={{ color: colors.status.danger.text }}>
                  <strong>{atRiskCount}</strong> at risk
                </span>
              </>
            )}
          </div>
        )}

        {/* ═══ SUCCESS STATE ═══ */}
        {isDone && (
          <div
            className="rounded-lg flex items-center gap-3"
            style={{
              padding: spacing['4'],
              backgroundColor: colors.status.success.base,
              color: '#fff',
            }}
          >
            <CheckCircle className="w-5 h-5" />
            <div>
              <p style={{ fontWeight: 600, fontSize: '14px' }}>Promotion Complete</p>
              <p style={{ fontSize: '12px', opacity: 0.9 }}>
                {promoteCount} students promoted from Class {selectedClass} to Class {sourceGrade + 1}.
                {retainCount > 0 && ` ${retainCount} retained.`}
              </p>
            </div>
          </div>
        )}

        {/* ═══ CONTENT ═══ */}
        {isLoading ? (
          <Tile id="promotion-loading" layoutMode="block" background="card" borderRadius="lg" padding="p-6">
            <div className="space-y-4">
              {/* Toolbar skeleton */}
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-[160px]" />
                <Skeleton className="h-8 w-[120px]" />
              </div>
              {/* Table header skeleton */}
              <Skeleton className="h-10 w-full rounded" />
              {/* Row skeletons */}
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded" />
              ))}
            </div>
          </Tile>
        ) : candidates.length === 0 ? (
          <Tile id="promotion-empty" layoutMode="block" background="card" borderRadius="lg" padding="p-6">
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <ArrowUpCircle className="w-8 h-8" style={{ color: colors.text.muted }} />
              <span className="text-sm text-text-muted">No students found in Class {selectedClass}</span>
            </div>
          </Tile>
        ) : !isDone ? (
          <>
            <Tile
              id="promotion-table"
              layoutMode="block"
              background="card"
              borderRadius="lg"
              shadowed={false}
              padding="p-6"
              overflow="auto"
            >
              <PromotionTable
                candidates={candidates}
                onDecisionChange={handleDecisionChange}
              />
            </Tile>

            <PromotionSummaryBar
              candidates={candidates}
              isExecuting={isExecuting}
              onConfirm={() => setConfirmOpen(true)}
            />
          </>
        ) : null}
      </div>

      {/* ═══ CONFIRM DIALOG ═══ */}
      <PromotionConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        sourceClass={selectedClass}
        candidates={candidates}
        isExecuting={isExecuting}
        onExecute={handleExecute}
      />
    </div>
  )
}

export default PromotionPage
