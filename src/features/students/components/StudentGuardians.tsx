/**
 * StudentGuardians — the people who can be rung, and who can be given an
 * account.
 *
 * Distinct from the guardian *contact fields* on the student form, which stay
 * where they are: those are "who do we phone about this child", edited with
 * the rest of the record. This section is the link to the `parents` table, and
 * the difference matters because a parent is one person across their children.
 * Editing an address here reaches every sibling; editing it on the form would
 * not.
 *
 * The contact details are the interesting part. Sign-in takes a mobile number
 * or an email, so a guardian with either can be given an account and the phone
 * the school already holds is usually enough. One with neither cannot, and
 * saying so here is more useful than a provisioning screen that silently skips
 * them.
 */

import { Plus, Trash2, Star, Mail, Phone } from 'lucide-react'
import { SectionCard } from '@/components/ui/section-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { fontSizes } from '@/config/typography'
import { spacing } from '@/config/spacing'
import { text, background } from '@/theme/colors'
import type { ParentOfStudent } from '@/api/services/parent-service'

interface StudentGuardiansProps {
  guardians: ParentOfStudent[]
  /** Whether each guardian already has an account, by profile id. */
  hasAccount: (parentProfileId: string) => boolean
  onAdd?: () => void
  onEdit?: (guardian: ParentOfStudent) => void
  onUnlink?: (parentProfileId: string) => void
}

export function StudentGuardians({
  guardians,
  hasAccount,
  onAdd,
  onEdit,
  onUnlink,
}: StudentGuardiansProps) {
  const addButton = onAdd ? (
    <Button
      variant="ghost"
      size="icon"
      className="size-7"
      onClick={onAdd}
      aria-label="Add a parent or guardian"
      title="Add a parent or guardian"
    >
      <Plus className="size-4" aria-hidden />
    </Button>
  ) : undefined

  return (
    <SectionCard title="Parents & Guardians" showDivider action={addButton}>
      {guardians.length === 0 ? (
        <p className="py-4 text-center" style={{ fontSize: fontSizes.xs, color: text.muted }}>
          Nobody on file
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['3'] }}>
          {guardians.map(guardian => (
            <div
              key={guardian.profileId}
              className="group"
              style={{
                backgroundColor: background.page,
                borderRadius: spacing['2'],
                padding: spacing['3'],
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => onEdit?.(guardian)}
                  role={onEdit ? 'button' : undefined}
                  tabIndex={onEdit ? 0 : undefined}
                  onKeyDown={event => {
                    // Space as well as Enter: this carries role="button", and a
                    // button that ignores Space is one a keyboard user reports
                    // as broken rather than as inconsistent.
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      onEdit?.(guardian)
                    }
                  }}
                >
                  <p
                    className="flex flex-wrap items-center gap-1.5"
                    style={{ fontSize: fontSizes.sm, fontWeight: 600, color: 'var(--heading)' }}
                  >
                    {guardian.fullName}
                    {guardian.isPrimary && (
                      <Badge variant="outline" className="gap-1 text-[10px]">
                        <Star className="size-2.5" />
                        First contact
                      </Badge>
                    )}
                    {hasAccount(guardian.profileId) ? (
                      <Badge variant="secondary" className="text-[10px]">
                        Has an account
                      </Badge>
                    ) : (
                      guardian.email === null &&
                      !guardian.phone && (
                        <Badge
                          variant="outline"
                          className="text-[10px]"
                          title="Sign-in needs a mobile number or an email address, and this guardian has neither on file."
                        >
                          No contact details
                        </Badge>
                      )
                    )}
                  </p>
                  <p style={{ fontSize: fontSizes.xs, color: text.muted, marginTop: '2px' }}>
                    {guardian.relationship}
                  </p>
                  <div
                    className="flex flex-wrap items-center gap-3"
                    style={{ fontSize: fontSizes.xs, color: text.muted, marginTop: spacing['1.5'] }}
                  >
                    {guardian.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="size-3" aria-hidden />
                        {guardian.phone}
                      </span>
                    )}
                    {guardian.email && (
                      <span className="flex min-w-0 items-center gap-1">
                        <Mail className="size-3 shrink-0" aria-hidden />
                        <span className="truncate">{guardian.email}</span>
                      </span>
                    )}
                  </div>
                </div>

                {onUnlink && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                    onClick={event => {
                      event.stopPropagation()
                      onUnlink(guardian.profileId)
                    }}
                    // Unlink, not delete: the parent may have other children,
                    // and removing them from this student must not remove them
                    // from the school.
                    aria-label={`Unlink ${guardian.fullName} from this student`}
                    title="Unlink from this student"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}
