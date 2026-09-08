/**
 * The mock transport server's database.
 *
 * Transport was the last feature in the app pretending to work. Five tabs —
 * routes, vehicles, drivers, fee structures, student assignments — each read a
 * mock array straight into `useState`, and every add, edit and delete changed
 * React state and showed a success toast. "Driver removed" was a sentence
 * about nothing: refresh the page and the driver was back. It also bypassed
 * the architecture every other feature follows, so there was no service to
 * point at a backend and no `@apiRoute` to implement.
 *
 * Five collections rather than five stores, because they are one backend area
 * and they refer to each other — a route names its vehicle and driver, an
 * assignment names its route and stop. One database keeps those readable
 * together and gives the eventual backend one module to replace.
 *
 * Same shape as every other mock table: rows with ids, reads and writes
 * through functions, `localStorage` as the disk, and only a service allowed to
 * import it.
 */

import { newId } from '@/mocks/_shared'
import type {
  StudentTransportAssignment,
  TransportAlert,
  TransportDriver,
  TransportFeeStructure,
  TransportRoute,
  Vehicle,
} from '@/features/transport/types'
import {
  mockDrivers,
  mockFeeStructures,
  mockRoutes,
  mockStudentAssignments,
  mockVehicles,
} from './transport'

const DB_KEY = 'sanketa:mock-db:transport'

interface Database {
  routes: TransportRoute[]
  vehicles: Vehicle[]
  drivers: TransportDriver[]
  feeStructures: TransportFeeStructure[]
  assignments: StudentTransportAssignment[]
}

/** Every collection's rows are identified the same way. */
interface Identified {
  id: string
}

let db: Database | null = null

function seed(): Database {
  return {
    routes: mockRoutes.map(row => ({ ...row })),
    vehicles: mockVehicles.map(row => ({ ...row })),
    drivers: mockDrivers.map(row => ({ ...row })),
    feeStructures: mockFeeStructures.map(row => ({ ...row })),
    assignments: mockStudentAssignments.map(row => ({ ...row })),
  }
}

function load(): Database {
  if (db) return db
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Database
      // Every collection has to be there. A half-written database would show
      // one tab full and another empty, which reads as data loss rather than
      // as the corruption it is.
      if (
        Array.isArray(parsed.routes) &&
        Array.isArray(parsed.vehicles) &&
        Array.isArray(parsed.drivers) &&
        Array.isArray(parsed.feeStructures) &&
        Array.isArray(parsed.assignments)
      ) {
        db = parsed
        return db
      }
    }
  } catch {
    // Unparseable or unavailable (private mode, cleared site data) — reseed.
  }
  db = seed()
  persist()
  return db
}

function persist(): void {
  if (!db) return
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db))
  } catch {
    // Quota or private mode; the in-memory copy still serves this session.
  }
}

// ── Generic collection operations ─────────────────────────────────────
//
// Five entities with identical CRUD is five chances to get one of them
// subtly wrong. These do the work once; the exported functions below give
// each collection a name a caller can read.

function readAll<T extends Identified>(rows: T[]): T[] {
  return rows.map(row => ({ ...row }))
}

/**
 * Insert or update, decided by whether the id is already there.
 *
 * The forms hand back a `Partial`, because a sheet that edits six of a
 * vehicle's eighteen fields has no reason to carry the other twelve. An
 * update merges onto the stored row; a create merges onto `template`, which
 * is what supplies the fields the form never asks about.
 */
function writeRow<T extends Identified>(
  rows: T[],
  input: Partial<T>,
  prefix: string,
  template: T,
): T {
  const existing = input.id ? rows.find(row => row.id === input.id) : undefined

  if (existing) {
    Object.assign(existing, input)
    persist()
    return { ...existing }
  }

  const created = { ...template, ...input, id: newId(prefix) } as T
  rows.push(created)
  persist()
  return { ...created }
}

function deleteRow<T extends Identified>(rows: T[], id: string): boolean {
  const index = rows.findIndex(row => row.id === id)
  if (index === -1) return false
  rows.splice(index, 1)
  persist()
  return true
}

/**
 * What a new row looks like before the form fills it in.
 *
 * Written out rather than copied from the first seeded row, which is what the
 * tabs used to do — a new driver inherited a real driver's licence number and
 * phone until every field was overwritten, and any field the form did not ask
 * about kept them.
 */
const BLANK_ROUTE: TransportRoute = {
  id: '', name: '', code: '', startLocation: '', endLocation: '', stops: [],
  vehicleId: '', vehicleName: '', driverId: '', driverName: '',
  type: 'two-way', distanceKm: 0, estimatedDuration: '', studentsAssigned: 0,
  capacity: 0, status: 'Active',
}

const BLANK_VEHICLE: Vehicle = {
  id: '', registrationNumber: '', type: 'Bus', make: '', model: '',
  year: new Date().getFullYear(), capacity: 0, currentOccupancy: 0,
  driverId: '', driverName: '', routeId: '', routeName: '',
  insuranceExpiry: '', fitnessExpiry: '', pucExpiry: '', status: 'Active',
  lastMaintenanceDate: '', nextMaintenanceDate: '',
}

const BLANK_DRIVER: TransportDriver = {
  id: '', firstName: '', lastName: '', phone: '', emergencyContact: '',
  address: '', licenseNumber: '', licenseType: '', licenseExpiry: '',
  experience: 0, backgroundVerified: false, status: 'Active',
}

const BLANK_FEE: TransportFeeStructure = {
  id: '', routeId: '', routeName: '', distanceSlab: '',
  oneWayFee: 0, twoWayFee: 0, term: '',
}

const BLANK_ASSIGNMENT: StudentTransportAssignment = {
  id: '', studentId: '', studentName: '', class: '', section: '',
  routeId: '', routeName: '', stopId: '', stopName: '',
  pickupTime: '', dropTime: '', type: 'two-way', feeStatus: 'Pending',
}

// ── Routes ────────────────────────────────────────────────────────────

export function listRoutes(): TransportRoute[] {
  return readAll(load().routes)
}

export function saveRoute(input: Partial<TransportRoute>): TransportRoute {
  return writeRow(load().routes, input, 'RT', BLANK_ROUTE)
}

export function deleteRoute(id: string): boolean {
  return deleteRow(load().routes, id)
}

// ── Vehicles ──────────────────────────────────────────────────────────

export function listVehicles(): Vehicle[] {
  return readAll(load().vehicles)
}

export function saveVehicle(input: Partial<Vehicle>): Vehicle {
  return writeRow(load().vehicles, input, 'VH', BLANK_VEHICLE)
}

export function deleteVehicle(id: string): boolean {
  return deleteRow(load().vehicles, id)
}

// ── Drivers ───────────────────────────────────────────────────────────

export function listDrivers(): TransportDriver[] {
  return readAll(load().drivers)
}

export function saveDriver(input: Partial<TransportDriver>): TransportDriver {
  return writeRow(load().drivers, input, 'DR', BLANK_DRIVER)
}

export function deleteDriver(id: string): boolean {
  return deleteRow(load().drivers, id)
}

// ── Fee structures ────────────────────────────────────────────────────

export function listFeeStructures(): TransportFeeStructure[] {
  return readAll(load().feeStructures)
}

export function saveFeeStructure(input: Partial<TransportFeeStructure>): TransportFeeStructure {
  return writeRow(load().feeStructures, input, 'TF', BLANK_FEE)
}

export function deleteFeeStructure(id: string): boolean {
  return deleteRow(load().feeStructures, id)
}

// ── Student assignments ───────────────────────────────────────────────

export function listAssignments(): StudentTransportAssignment[] {
  return readAll(load().assignments)
}

export function saveAssignment(
  input: Partial<StudentTransportAssignment>,
): StudentTransportAssignment {
  return writeRow(load().assignments, input, 'TA', BLANK_ASSIGNMENT)
}

export function deleteAssignment(id: string): boolean {
  return deleteRow(load().assignments, id)
}

/** Bulk insert, for the CSV import on the assignments tab. */
export function saveAssignments(
  inputs: Partial<StudentTransportAssignment>[],
): StudentTransportAssignment[] {
  return inputs.map(input => saveAssignment(input))
}

// ── Alerts ────────────────────────────────────────────────────────────

/**
 * Alerts, derived rather than stored.
 *
 * The seeded list was six hand-written sentences naming specific vehicles and
 * drivers — "Vehicle KA-01-GH-3456 insurance expires on 25 Apr" — which is
 * fine until someone deletes that vehicle and the warning outlives it. An
 * alert is a *question about the current data*, not a record, so it is
 * computed on read and cannot go stale.
 *
 * A backend would answer this the same way: a query, not a table.
 */
const EXPIRY_WARNING_DAYS = 30

/** Whole days from now until `date`. Negative once it has passed. */
function daysUntil(date: string, now: Date): number | null {
  const target = new Date(date)
  if (Number.isNaN(target.getTime())) return null
  return Math.ceil((target.getTime() - now.getTime()) / 86_400_000)
}

function formatDay(date: string): string {
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function listAlerts(now: Date = new Date()): TransportAlert[] {
  const database = load()
  const alerts: TransportAlert[] = []
  const today = now.toISOString().slice(0, 10)

  const expiry = (
    id: string,
    label: string,
    subject: string,
    date: string,
    noun: string,
  ): void => {
    const days = daysUntil(date, now)
    if (days === null || days > EXPIRY_WARNING_DAYS) return
    alerts.push({
      id,
      title: days < 0 ? `${label} Expired` : `${label} Expiring Soon`,
      description:
        days < 0
          ? `${subject} ${noun} expired on ${formatDay(date)}`
          : `${subject} ${noun} expires on ${formatDay(date)}`,
      // Already lapsed is a different problem from lapsing soon: one is a
      // vehicle that should not be on the road today.
      severity: days < 0 ? 'danger' : 'warning',
      date: today,
    })
  }

  database.vehicles.forEach(vehicle => {
    const name = `Vehicle ${vehicle.registrationNumber}`
    expiry(`ALT-INS-${vehicle.id}`, 'Insurance', name, vehicle.insuranceExpiry, 'insurance')
    expiry(`ALT-PUC-${vehicle.id}`, 'PUC', name, vehicle.pucExpiry, 'PUC certificate')
    expiry(`ALT-FIT-${vehicle.id}`, 'Fitness', name, vehicle.fitnessExpiry, 'fitness certificate')

    const dueIn = daysUntil(vehicle.nextMaintenanceDate, now)
    if (dueIn !== null && dueIn <= EXPIRY_WARNING_DAYS) {
      alerts.push({
        id: `ALT-MNT-${vehicle.id}`,
        title: 'Maintenance Due',
        description: `${name} next maintenance due on ${formatDay(vehicle.nextMaintenanceDate)}`,
        severity: dueIn < 0 ? 'danger' : 'warning',
        date: today,
      })
    }
  })

  database.drivers.forEach(driver => {
    expiry(
      `ALT-LIC-${driver.id}`,
      'License',
      `Driver ${driver.firstName} ${driver.lastName}`,
      driver.licenseExpiry,
      'license',
    )
  })

  database.routes.forEach(route => {
    if (route.capacity <= 0) return
    const usage = route.studentsAssigned / route.capacity
    if (usage < 0.9) return
    alerts.push({
      id: `ALT-CAP-${route.id}`,
      title: usage >= 1 ? 'Route At Capacity' : 'Route Over-Capacity',
      description: `${route.name} is at ${Math.round(usage * 100)}% capacity (${
        route.studentsAssigned
      }/${route.capacity})`,
      severity: usage >= 1 ? 'danger' : 'warning',
      date: today,
    })
  })

  // Worst first — an expired certificate should not sit below a reminder.
  const rank: Record<TransportAlert['severity'], number> = { danger: 0, warning: 1, info: 2 }
  return alerts.sort((a, b) => rank[a.severity] - rank[b.severity])
}

/** Wipe and reseed — the equivalent of re-running the backend's seed script. */
export function resetTransport(): void {
  db = seed()
  persist()
}
