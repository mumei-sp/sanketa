/**
 * The bar that explains an empty app.
 *
 * Holding a membership to a school and holding a *role* there are different
 * things, and the gap between them is a real state: somebody is enrolled at a
 * second school before anyone has decided what they do there. The access model
 * answers that honestly — no roles means no permissions means every list comes
 * back empty — and an app that is correctly empty looks exactly like an app
 * that is broken.
 *
 * So this says which it is. Rendered outside every permission gate, for the
 * same reason `PreviewBanner` is: a person with no permissions here can reach
 * no screen that could tell them why.
 */

import { Info } from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { listTenants } from '@/mocks/global'
import { resolveTenantAccess } from '@/mocks/profiles'
import { activeTenant } from '@/mocks/_shared/tenant-context'

export function NoRoleHereNotice() {
  const currentUser = useCurrentUser()
  if (!currentUser) return null

  const schema = activeTenant()
  const { roleIds } = resolveTenantAccess(currentUser.id)
  if (roleIds.length > 0) return null

  // Somebody holding no role anywhere is a different problem — an account
  // nobody has finished setting up — and sign-in already refuses a login with
  // no school at all. This bar is specifically about *this* school being the
  // wrong one to be standing in.
  const held = currentUser.tenantCodes ?? []
  if (held.length < 2) return null

  const name = listTenants().find(tenant => tenant.schema === schema)?.name ?? 'this school'

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]"
      style={{ pointerEvents: 'none' }}
    >
      <div
        className="flex max-w-full items-center gap-2.5 rounded-full border px-3 py-1.5 shadow-lg"
        style={{
          pointerEvents: 'auto',
          backgroundColor: 'var(--card)',
          borderColor: 'var(--border)',
        }}
      >
        <Info className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <p className="text-caption">
          You have no role at <span className="font-semibold">{name}</span> yet, so there is
          nothing here to show. Switch school, or ask an administrator there to give you one.
        </p>
      </div>
    </div>
  )
}
