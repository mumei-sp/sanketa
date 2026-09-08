/**
 * Transport API Service
 *
 * Mock path (the in-browser transport tables under `src/mocks/transport`) +
 * HTTP path (apiClient).
 *
 * Five entities, one service, because they are one backend area and the tabs
 * that use them sit behind one route. Each pair of endpoints follows the same
 * shape the rest of `src/api/services` uses, so the day a real transport API
 * exists this file's mock arms empty out and nothing above it changes.
 */

import apiClient from '@/api/client'
import { mockOrHttp } from './_adapter'
import { withLatency } from '@/mocks/_shared'
import * as mockServer from '@/mocks/transport/store'
import type {
  StudentTransportAssignment,
  TransportAlert,
  TransportDriver,
  TransportFeeStructure,
  TransportRoute,
  Vehicle,
} from '@/features/transport/types'

// ── Routes ────────────────────────────────────────────────────────────

/** @apiRoute GET /api/v1/transport/routes */
export async function fetchRoutes(): Promise<TransportRoute[]> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return mockServer.listRoutes()
    },
    async () => {
      const { data } = await apiClient.get<TransportRoute[]>('/transport/routes')
      return data
    },
  )
}

/**
 * Create or update a route.
 *
 * One endpoint for both because the form is one form: a sheet that does not
 * know whether it is adding or editing would have to be told, and the id it
 * already carries says it. The HTTP arm splits it back into POST and PATCH,
 * which is what a REST backend wants.
 *
 * @apiRoute POST /api/v1/transport/routes | PATCH /api/v1/transport/routes/{id}
 */
export async function saveRoute(input: Partial<TransportRoute>): Promise<TransportRoute> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return mockServer.saveRoute(input)
    },
    async () => {
      const { data } = input.id
        ? await apiClient.patch<TransportRoute>(`/transport/routes/${input.id}`, input)
        : await apiClient.post<TransportRoute>('/transport/routes', input)
      return data
    },
  )
}

/** @apiRoute DELETE /api/v1/transport/routes/{id} */
export async function deleteRoute(id: string): Promise<boolean> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return mockServer.deleteRoute(id)
    },
    async () => {
      await apiClient.delete(`/transport/routes/${id}`)
      return true
    },
  )
}

// ── Vehicles ──────────────────────────────────────────────────────────

/** @apiRoute GET /api/v1/transport/vehicles */
export async function fetchVehicles(): Promise<Vehicle[]> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return mockServer.listVehicles()
    },
    async () => {
      const { data } = await apiClient.get<Vehicle[]>('/transport/vehicles')
      return data
    },
  )
}

/** @apiRoute POST /api/v1/transport/vehicles | PATCH /api/v1/transport/vehicles/{id} */
export async function saveVehicle(input: Partial<Vehicle>): Promise<Vehicle> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return mockServer.saveVehicle(input)
    },
    async () => {
      const { data } = input.id
        ? await apiClient.patch<Vehicle>(`/transport/vehicles/${input.id}`, input)
        : await apiClient.post<Vehicle>('/transport/vehicles', input)
      return data
    },
  )
}

/** @apiRoute DELETE /api/v1/transport/vehicles/{id} */
export async function deleteVehicle(id: string): Promise<boolean> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return mockServer.deleteVehicle(id)
    },
    async () => {
      await apiClient.delete(`/transport/vehicles/${id}`)
      return true
    },
  )
}

// ── Drivers ───────────────────────────────────────────────────────────

/** @apiRoute GET /api/v1/transport/drivers */
export async function fetchDrivers(): Promise<TransportDriver[]> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return mockServer.listDrivers()
    },
    async () => {
      const { data } = await apiClient.get<TransportDriver[]>('/transport/drivers')
      return data
    },
  )
}

/** @apiRoute POST /api/v1/transport/drivers | PATCH /api/v1/transport/drivers/{id} */
export async function saveDriver(input: Partial<TransportDriver>): Promise<TransportDriver> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return mockServer.saveDriver(input)
    },
    async () => {
      const { data } = input.id
        ? await apiClient.patch<TransportDriver>(`/transport/drivers/${input.id}`, input)
        : await apiClient.post<TransportDriver>('/transport/drivers', input)
      return data
    },
  )
}

/** @apiRoute DELETE /api/v1/transport/drivers/{id} */
export async function deleteDriver(id: string): Promise<boolean> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return mockServer.deleteDriver(id)
    },
    async () => {
      await apiClient.delete(`/transport/drivers/${id}`)
      return true
    },
  )
}

// ── Fee structures ────────────────────────────────────────────────────

/** @apiRoute GET /api/v1/transport/fee-structures */
export async function fetchFeeStructures(): Promise<TransportFeeStructure[]> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return mockServer.listFeeStructures()
    },
    async () => {
      const { data } = await apiClient.get<TransportFeeStructure[]>('/transport/fee-structures')
      return data
    },
  )
}

/** @apiRoute POST /api/v1/transport/fee-structures | PATCH .../{id} */
export async function saveFeeStructure(
  input: Partial<TransportFeeStructure>,
): Promise<TransportFeeStructure> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return mockServer.saveFeeStructure(input)
    },
    async () => {
      const { data } = input.id
        ? await apiClient.patch<TransportFeeStructure>(
            `/transport/fee-structures/${input.id}`,
            input,
          )
        : await apiClient.post<TransportFeeStructure>('/transport/fee-structures', input)
      return data
    },
  )
}

/** @apiRoute DELETE /api/v1/transport/fee-structures/{id} */
export async function deleteFeeStructure(id: string): Promise<boolean> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return mockServer.deleteFeeStructure(id)
    },
    async () => {
      await apiClient.delete(`/transport/fee-structures/${id}`)
      return true
    },
  )
}

// ── Student assignments ───────────────────────────────────────────────

/** @apiRoute GET /api/v1/transport/assignments */
export async function fetchAssignments(): Promise<StudentTransportAssignment[]> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return mockServer.listAssignments()
    },
    async () => {
      const { data } = await apiClient.get<StudentTransportAssignment[]>('/transport/assignments')
      return data
    },
  )
}

/** @apiRoute POST /api/v1/transport/assignments | PATCH .../{id} */
export async function saveAssignment(
  input: Partial<StudentTransportAssignment>,
): Promise<StudentTransportAssignment> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return mockServer.saveAssignment(input)
    },
    async () => {
      const { data } = input.id
        ? await apiClient.patch<StudentTransportAssignment>(
            `/transport/assignments/${input.id}`,
            input,
          )
        : await apiClient.post<StudentTransportAssignment>('/transport/assignments', input)
      return data
    },
  )
}

/**
 * Bulk create, for the CSV import.
 *
 * One request rather than one per row: a hundred-student import should be one
 * thing that either happened or did not, and a backend that took them one at a
 * time would leave a half-imported spreadsheet on any failure.
 *
 * @apiRoute POST /api/v1/transport/assignments/bulk
 */
export async function saveAssignments(
  inputs: Partial<StudentTransportAssignment>[],
): Promise<StudentTransportAssignment[]> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return mockServer.saveAssignments(inputs)
    },
    async () => {
      const { data } = await apiClient.post<StudentTransportAssignment[]>(
        '/transport/assignments/bulk',
        { assignments: inputs },
      )
      return data
    },
  )
}

/** @apiRoute DELETE /api/v1/transport/assignments/{id} */
export async function deleteAssignment(id: string): Promise<boolean> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return mockServer.deleteAssignment(id)
    },
    async () => {
      await apiClient.delete(`/transport/assignments/${id}`)
      return true
    },
  )
}

// ── Alerts ────────────────────────────────────────────────────────────

/**
 * Certificates lapsing, maintenance due, routes at capacity.
 *
 * Computed from the current fleet rather than stored, so an alert cannot
 * outlive the vehicle it is about. A real backend answers this with a query
 * for the same reason.
 *
 * @apiRoute GET /api/v1/transport/alerts
 */
export async function fetchTransportAlerts(): Promise<TransportAlert[]> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return mockServer.listAlerts()
    },
    async () => {
      const { data } = await apiClient.get<TransportAlert[]>('/transport/alerts')
      return data
    },
  )
}
