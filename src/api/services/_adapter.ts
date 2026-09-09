/**
 * Service adapter helper.
 *
 * Every service function pairs two implementations — an in-memory `mockFn`
 * and a real `httpFn` that calls the backend via axios. `mockOrHttp` picks
 * which one to run based on the `VITE_USE_MOCK_API` env flag (default: mock).
 *
 * Example — inside a service file:
 *
 *   export async function fetchStudents(params?: ListParams) {
 *     return mockOrHttp(
 *       async () => {
 *         await withLatency()
 *         return paginate(listStudents(), params)
 *       },
 *       async () => {
 *         const { data } = await apiClient.get('/students', { params })
 *         return data as ApiListResponse<Student>
 *       },
 *     )
 *   }
 *
 * Keeping the two paths side-by-side (rather than separate files) keeps the
 * intended HTTP shape visible when reading or editing a mock, so the real
 * backend swap is a matter of flipping the env flag — not grep-and-replace.
 */

import { getEnvConfig } from '@/api/utils/env'
import { authUtils } from '@/api/utils/auth'
import {
  TenantContextError,
  applyTenantContext,
  issueContextToken,
  readContextToken,
  storeContextToken,
} from '@/mocks/auth/tenant-context-token'

export interface MockOrHttpOptions {
  /**
   * Skip the tenant-context filter.
   *
   * For the calls a server would put behind `permitAll` — signing in, signing
   * out, refreshing — because they are how a caller *gets* a context token and
   * cannot be made to present one first.
   */
  anonymous?: boolean
}

/**
 * The tenant-context filter, for the mock path.
 *
 * Fabric runs `TenantContextTokenFilter` before every request: validate the
 * context token, resolve which school the call acts on, refuse one the caller
 * does not hold. The mock path never touches axios, so the adapter is the only
 * place that runs before every mock call — which makes it the filter.
 *
 * Signed out is not a refusal. Every mock read already narrows to the caller
 * through `visibleToCaller`, and a signed-out caller is narrowed to nothing;
 * demanding a token as well would turn the login screen's own lookups into
 * errors without protecting anything.
 */
function runTenantFilter(): void {
  const session = authUtils.getUser()
  if (!session) return

  try {
    applyTenantContext()
  } catch (error) {
    if (error instanceof TenantContextError && error.code === 'TOKEN_EXPIRED') {
      // The one place this mock is deliberately more forgiving than the
      // server. Fabric answers 401 and the client refreshes; the refresh
      // interceptor lives on `apiClient`, which the mock path does not go
      // through, so a strict 401 here would sign a developer out every fifteen
      // minutes and teach nothing. Re-mint from the live session instead —
      // which is what the interceptor would have achieved.
      storeContextToken(issueContextToken(session.id, session.tenantCodes ?? []))
      applyTenantContext()
      return
    }
    // A session with no token at all predates this mechanism. Mint one from
    // what the session already carries: the same claims the server would have
    // issued, since `tenantCodes` came from the server at sign-in.
    if (error instanceof TenantContextError && error.code !== 'TENANT_FORBIDDEN') {
      if (readContextToken() === null) {
        storeContextToken(issueContextToken(session.id, session.tenantCodes ?? []))
        applyTenantContext()
        return
      }
    }
    throw error
  }
}

export function mockOrHttp<T>(
  mockFn: () => T | Promise<T>,
  httpFn: () => Promise<T>,
  options?: MockOrHttpOptions,
): Promise<T> {
  if (!getEnvConfig().useMockApi) return httpFn()
  return Promise.resolve().then(() => {
    if (!options?.anonymous) runTenantFilter()
    return mockFn()
  })
}
