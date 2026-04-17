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
 *         return paginate(studentsData, params)
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

export function mockOrHttp<T>(
  mockFn: () => T | Promise<T>,
  httpFn: () => Promise<T>,
): Promise<T> {
  return getEnvConfig().useMockApi
    ? Promise.resolve().then(mockFn)
    : httpFn()
}
