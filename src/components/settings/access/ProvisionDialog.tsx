/**
 * ProvisionDialog — give the people the school already knows an account.
 *
 * Accounts come from records, not from a blank form. A school knows who its
 * students and their parents are long before it knows their email addresses,
 * and typing a name that already exists creates a second person rather than an
 * account for the first.
 *
 * ── Why this is a list and not a button ────────────────────────────────
 * It used to be that nothing in the school's records carried an email while
 * sign-in resolved an account by address, so the work was one address per
 * person. Sign-in takes a mobile number now, and the records are full of
 * those — most rows here need nothing typed into them at all.
 *
 * It stays a list for the two cases that survive. A parent with no number on
 * file still needs an address. And a number belongs to one account, so the
 * second parent sharing a family mobile needs one too — the row says which,
 * rather than a button silently skipping them.
 *
 * Everything created here starts disabled, and someone activates it on the
 * People screen afterwards. Not because the app cannot yet be trusted with a
 * live family account — the services filter by the caller's scope now — but
 * because nothing has checked that the address typed in belongs to that
 * family. Until somebody has, an active account is a stranger's login into a
 * child's records. The store enforces the disabled start from the profile
 * type; this dialog says so out loud.
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
import { createUser, identifierTaken, type SchoolUser } from '@/api/services/user-service'
import { usePermissions } from '@/features/auth/PermissionContext'

/** One row: somebody who could have an account and does not. */
interface Candidate {
  parent: Parent
  children: number
}

function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

/**
 * Same number? Last ten digits, so a country code or a space cannot hide a
 * clash — the same comparison the directory itself makes.
 */
function samePhone(a: string | null | undefined, b: string | null | undefined): boolean {
  const digits = (value: string | null | undefined) => (value ?? '').replace(/\D/g, '').slice(-10)
  return digits(a).length === 10 && digits(a) === digits(b)
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

  /**
   * Whether this parent's own number can be the account's identifier.
   *
   * Read off the accounts already in hand rather than asked of the server per
   * row: the dialog is given the directory, and forty round trips to learn
   * what forty rows in memory already say would be a strange way to open a
   * dialog.
   */
  const phoneFor = React.useCallback(
    (parent: Parent): string | undefined => {
      if (!parent.phone) return undefined
      const claimed = usersRef.current.some(user => samePhone(user.phone, parent.phone))
      return claimed ? undefined : parent.phone
    },
    [],
  )

  const provision = async (candidate: Candidate) => {
    const email = (emails[candidate.parent.profileId] ?? '').trim()
    const phone = phoneFor(candidate.parent)
    // Either identifier will do. Both when both are there — the number is what
    // they will type, the address is where the school can reach them.
    if (!phone && !looksLikeEmail(email)) return
    if (!parentRole) return

    setBusy(candidate.parent.profileId)
    try {
      // No `status` passed on purpose: the store derives it from the profile
      // type, so a family account is disabled whether or not a caller
      // remembers to ask for that.
      const created = await createUser({
        fullName: candidate.parent.fullName,
        email: looksLikeEmail(email) ? email : null,
        phone,
        roleId: parentRole.id,
        profileType: 'parent',
        parentId: candidate.parent.profileId,
      })
      if (!created) {
        const taken = await identifierTaken({ email: email || null, phone })
        showError(
          taken === 'phone'
            ? 'That number already signs in to another account'
            : 'That email already has an account',
        )
        return
      }
      setDone(current => new Set(current).add(candidate.parent.profileId))
      onCreated(created)
      showSuccess(`Account created for ${created.fullName}`, {
        description: 'Created disabled — activate it on the People screen to let them sign in.',
      })
    } catch (error) {
      console.error('Failed to create the account', error)
      showError('Could not create the account')
    } finally {
      setBusy(null)
    }
  }

  const waiting = candidates?.filter(candidate => !done.has(candidate.parent.profileId)) ?? []
  // The rows that still need a human to type something: no number on file, or
  // a number that already signs in to somebody else.
  const needTyping = waiting.filter(candidate => !phoneFor(candidate.parent)).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Give parents an account</DialogTitle>
          <DialogDescription>
            Everyone on file who does not have one yet. Most sign in with the mobile number
            already on their record. Accounts are created disabled — activate each one on the
            People screen once you know the number reaches the family.
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
            {needTyping > 0 && (
              <p
                className="flex items-start gap-1.5 rounded-lg px-3 py-2 text-caption"
                style={{ backgroundColor: 'var(--muted)', color: text.muted }}
              >
                <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                {needTyping === 1
                  ? 'One of these needs an email address: '
                  : `${needTyping} of these need an email address: `}
                either the school has no number on file, or the number already signs in to
                another account — a mobile can only belong to one.
              </p>
            )}

            <div className="flex flex-col gap-2">
              {waiting.map(candidate => {
                const id = candidate.parent.profileId
                const email = emails[id] ?? ''
                const phone = phoneFor(candidate.parent)
                const ready = phone !== undefined || looksLikeEmail(email)
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
                        {phone
                          ? ` · signs in with ${phone}`
                          : candidate.parent.phone
                            ? ` · ${candidate.parent.phone} is taken`
                            : ' · no number on file'}
                      </span>
                    </span>

                    <span className="flex items-center gap-2 max-md:w-full">
                      <Label htmlFor={`prov-${id}`} className="sr-only">
                        Email for {candidate.parent.fullName}
                      </Label>
                      <Input
                        id={`prov-${id}`}
                        type="email"
                        placeholder={phone ? 'email@example.com (optional)' : 'email@example.com'}
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
