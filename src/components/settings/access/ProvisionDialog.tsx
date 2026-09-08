/**
 * ProvisionDialog — give the people the school already knows an account.
 *
 * Accounts come from records, not from a blank form. A school knows who its
 * students and their parents are long before it knows their email addresses,
 * and typing a name that already exists creates a second person rather than an
 * account for the first.
 *
 * ── Why this is a list and not a button ────────────────────────────────
 * "Create accounts for 9A" is the obvious design and it cannot work here:
 * nothing in the school's records carries an email. Students have no address
 * field at all, and a guardian seeded from a student's contact details has a
 * phone and nothing else — while sign-in resolves an account by address. So
 * the work is one address per person, and the honest surface is a list that
 * says who is missing one rather than a button that silently skips them.
 *
 * Everything created here starts disabled. The services still return every row
 * and filter in the browser, so a family account that could sign in would
 * receive other children's records and merely not draw them. The store enforces
 * that from the profile type; this dialog says so out loud.
 */

import * as React from 'react'
import { UserPlus, Check, Info } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { border, text } from '@/theme/colors'
import { getInitials } from '@/utils/format'
import { useAppToast } from '@/hooks/use-app-toast'
import { fetchParents, fetchParentLinks, type Parent } from '@/api/services/parent-service'
import { createUser, type SchoolUser } from '@/api/services/user-service'
import { usePermissions } from '@/features/auth/PermissionContext'

/** One row: somebody who could have an account and does not. */
interface Candidate {
  parent: Parent
  children: number
}

function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

interface ProvisionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Accounts that already exist, so the list can exclude them. */
  users: SchoolUser[]
  /** Called after each successful creation so the People list refreshes. */
  onCreated: (user: SchoolUser) => void
}

export function ProvisionDialog({ open, onOpenChange, users, onCreated }: ProvisionDialogProps) {
  const { roles } = usePermissions()
  const { showSuccess, showError } = useAppToast()

  const [candidates, setCandidates] = React.useState<Candidate[] | null>(null)
  const [emails, setEmails] = React.useState<Record<string, string>>({})
  const [busy, setBusy] = React.useState<string | null>(null)
  const [done, setDone] = React.useState<Set<string>>(new Set())

  const parentRole = roles.find(role => role.id === 'parent')

  // Current without being a dependency — see the effect below.
  const usersRef = React.useRef(users)
  usersRef.current = users

  /**
   * Loaded once per opening, not once per change to `users`.
   *
   * Creating an account changes `users`, so depending on it here meant every
   * creation re-ran the effect, refetched, and reset `done` — which wiped the
   * running count and put the row that had just been created back in the list.
   * The accounts made in this sitting are tracked in `done` instead, and the
   * ones that existed beforehand are read through a ref so they are current
   * without being a dependency.
   */
  React.useEffect(() => {
    if (!open) return
    setDone(new Set())
    Promise.all([fetchParents(), fetchParentLinks()])
      .then(([parents, links]) => {
        const taken = new Set(usersRef.current.map(user => user.parentId).filter(Boolean))
        setCandidates(
          parents
            .filter(parent => !taken.has(parent.profileId))
            .map(parent => ({
              parent,
              children: links.filter(link => link.parentProfileId === parent.profileId).length,
            })),
        )
        setEmails(
          Object.fromEntries(parents.map(parent => [parent.profileId, parent.email ?? ''])),
        )
      })
      .catch(error => {
        console.error('Failed to load who could be given an account', error)
        setCandidates([])
      })
  }, [open])

  const provision = async (candidate: Candidate) => {
    const email = (emails[candidate.parent.profileId] ?? '').trim()
    if (!looksLikeEmail(email) || !parentRole) return

    setBusy(candidate.parent.profileId)
    try {
      // No `status` passed on purpose: the store derives it from the profile
      // type, so a family account is disabled whether or not a caller
      // remembers to ask for that.
      const created = await createUser({
        fullName: candidate.parent.fullName,
        email,
        roleId: parentRole.id,
        profileType: 'parent',
        parentId: candidate.parent.profileId,
      })
      if (!created) {
        showError('That email already has an account')
        return
      }
      setDone(current => new Set(current).add(candidate.parent.profileId))
      onCreated(created)
      showSuccess(`Account created for ${created.fullName}`, {
        description: 'Disabled until family sign-in is switched on.',
      })
    } catch (error) {
      console.error('Failed to create the account', error)
      showError('Could not create the account')
    } finally {
      setBusy(null)
    }
  }

  const waiting = candidates?.filter(candidate => !done.has(candidate.parent.profileId)) ?? []
  const withoutEmail = waiting.filter(candidate => !candidate.parent.email).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Give parents an account</DialogTitle>
          <DialogDescription>
            Everyone on file who does not have one yet. Accounts are created disabled — families
            cannot sign in until their records are filtered on the server.
          </DialogDescription>
        </DialogHeader>

        {candidates === null ? (
          <div className="space-y-2">
            {[0, 1, 2].map(row => (
              <Skeleton key={row} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : waiting.length === 0 ? (
          <p
            className="rounded-lg border border-dashed p-6 text-center text-caption"
            style={{ borderColor: border.default, color: text.muted }}
          >
            {candidates.length === 0
              ? 'Everyone on file already has an account.'
              : 'All done — every parent listed now has one.'}
          </p>
        ) : (
          <>
            {withoutEmail > 0 && (
              <p
                className="flex items-start gap-1.5 rounded-lg px-3 py-2 text-caption"
                style={{ backgroundColor: 'var(--muted)', color: text.muted }}
              >
                <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                {withoutEmail === 1
                  ? 'One of these has no email on file. '
                  : `${withoutEmail} of these have no email on file. `}
                The school's records carry a phone and no address, so one has to be typed in
                before an account can exist.
              </p>
            )}

            <div className="flex flex-col gap-2">
              {waiting.map(candidate => {
                const id = candidate.parent.profileId
                const email = emails[id] ?? ''
                const ready = looksLikeEmail(email)
                return (
                  <div
                    key={id}
                    className="flex flex-wrap items-center gap-2 rounded-lg border p-2.5"
                    style={{ borderColor: border.default }}
                  >
                    <span
                      aria-hidden
                      className="flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                      style={{ backgroundColor: 'var(--heading)', color: 'var(--card)' }}
                    >
                      {getInitials(candidate.parent.fullName)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-body font-medium"
                        style={{ color: 'var(--heading)' }}
                      >
                        {candidate.parent.fullName}
                      </span>
                      <span className="block text-caption" style={{ color: text.muted }}>
                        {candidate.children === 1 ? '1 child' : `${candidate.children} children`}
                        {candidate.parent.phone ? ` · ${candidate.parent.phone}` : ''}
                      </span>
                    </span>

                    <span className="flex items-center gap-2 max-md:w-full">
                      <Label htmlFor={`prov-${id}`} className="sr-only">
                        Email for {candidate.parent.fullName}
                      </Label>
                      <Input
                        id={`prov-${id}`}
                        type="email"
                        placeholder="email@example.com"
                        value={email}
                        disabled={busy === id}
                        onChange={event =>
                          setEmails(current => ({ ...current, [id]: event.target.value }))
                        }
                        className="h-control w-[210px] max-md:w-full"
                      />
                      <Button
                        size="sm"
                        className="shrink-0 gap-1.5"
                        disabled={!ready || busy === id || !parentRole}
                        onClick={() => void provision(candidate)}
                      >
                        <UserPlus className="size-3.5" />
                        {busy === id ? 'Creating…' : 'Create'}
                      </Button>
                    </span>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {done.size > 0 && (
          <p className="flex items-center gap-1.5 text-caption" style={{ color: text.muted }}>
            <Check className="size-3.5" aria-hidden />
            {done.size === 1 ? '1 account created' : `${done.size} accounts created`}
            <Badge variant="outline" className="ml-1 text-[10px]">
              Not yet active
            </Badge>
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
