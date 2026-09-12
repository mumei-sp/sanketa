/**
 * Parents waiting for a call back.
 *
 * The other end of the two buttons on the family dashboard. A parent asks to be
 * rung about one child; this is where somebody at the school sees that they
 * asked, and says when it is done.
 *
 * ── Why it is here and not behind a nav item ──────────────────────────
 * The rows are about children, and this is the screen where staff already look
 * at the people who teach them. A Messages item in the sidebar would promise a
 * module — an inbox, threads, unread counts — that deliberately does not exist:
 * this is a callback request, not a conversation. See `callback-service`.
 *
 * ── It is absent, not empty, when there is nothing ────────────────────
 * A card reading "no requests" on every quiet day is a card people stop
 * reading, and most days are quiet. It renders only when somebody is actually
 * waiting — the same rule the family page's "Needs you" strip follows.
 */

import * as React from 'react'
import { PhoneCall } from 'lucide-react'
import { SectionCard } from '@/components/ui/section-card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StudentAvatar } from '@/components/shared/StudentAvatar'
import { text, border, accent } from '@/theme/colors'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useAppToast } from '@/hooks/use-app-toast'
import {
  fetchCallbacks,
  resolveCallback,
  type CallbackRequest,
} from '@/api/services/callback-service'

/** "2 hours ago", near enough — a request is stale in hours, not minutes. */
function since(iso: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (minutes < 60) return minutes <= 1 ? 'just now' : `${minutes} minutes ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return hours === 1 ? 'an hour ago' : `${hours} hours ago`
  const days = Math.round(hours / 24)
  return days === 1 ? 'yesterday' : `${days} days ago`
}

const REASON: Record<CallbackRequest['reason'], string> = {
  absence: 'About an absence',
  'classroom-note': 'Replying to a note',
  general: 'General',
}

export function CallbackRequests() {
  const currentUser = useCurrentUser()
  const toast = useAppToast()
  const [rows, setRows] = React.useState<CallbackRequest[] | null>(null)
  const [closing, setClosing] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    // Already narrowed to the children this caller may see — a class teacher
    // gets their own pupils and learns nothing about anyone else's.
    void fetchCallbacks({ openOnly: true })
      .then(found => {
        if (!cancelled) setRows(found)
      })
      .catch(error => {
        console.error('Failed to load callback requests', error)
        if (!cancelled) setRows([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleResolve = React.useCallback(
    async (row: CallbackRequest) => {
      setClosing(row.id)
      try {
        const done = await resolveCallback(row.id, currentUser?.fullName ?? 'Staff')
        if (!done) {
          toast.showError('That request could not be closed.')
          return
        }
        setRows(current => (current ?? []).filter(candidate => candidate.id !== row.id))
        toast.showSuccess(`Marked as called back — ${row.studentName}`)
      } catch (error) {
        console.error('Failed to close the request', error)
        toast.showError('That request could not be closed.')
      } finally {
        setClosing(null)
      }
    },
    [currentUser, toast],
  )

  // Still asking, or nobody is waiting. Neither is worth a card.
  if (rows === null) return <Skeleton className="h-[92px] w-full rounded-xl" />
  if (rows.length === 0) return null

  return (
    <SectionCard
      title="Parents waiting for a call"
      action={
        <span className="text-caption" style={{ color: text.muted }}>
          {rows.length} open
        </span>
      }
    >
      <div className="flex flex-col">
        {rows.map((row, index) => (
          <div
            key={row.id}
            className="flex items-start gap-3 py-3"
            style={index > 0 ? { borderTop: `1px solid ${border.default}` } : undefined}
          >
            <StudentAvatar name={row.studentName} size={34} />
            <span className="min-w-0 flex-1">
              <span className="block text-body font-semibold" style={{ color: 'var(--heading)' }}>
                {row.studentName}
              </span>
              <span className="block text-caption" style={{ color: text.muted }}>
                {REASON[row.reason]}
                {row.teacherName ? ` · for ${row.teacherName}` : ''} · {since(row.requestedAt)}
              </span>
              {row.note && (
                <span
                  className="mt-1.5 block rounded-md px-2.5 py-1.5 text-caption"
                  style={{ backgroundColor: accent.soft, color: text.body }}
                >
                  {row.note}
                </span>
              )}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={closing === row.id}
              onClick={() => void handleResolve(row)}
            >
              <PhoneCall className="size-3.5" />
              {closing === row.id ? 'Closing…' : 'Called back'}
            </Button>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}
