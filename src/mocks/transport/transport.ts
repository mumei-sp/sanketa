import type {
  StudentTransportAssignment,
  TransportRoute,
  TransportDriver,
  TransportFeeStructure,
  Vehicle,
  FeeStatus,
} from '@/features/transport/types'
import { listStudents } from '@/mocks/students/store'
import { tenantFixtures } from '@/mocks/tenants'
import { activeTenant } from '@/mocks/_shared/tenant-context'
import { rng, pick, chance } from '@/mocks/tenants/_generate/random'

/**
 * The active school's transport, and who is on it.
 *
 * ── What moved out of here ─────────────────────────────────────────────
 * Six drivers, eight vehicles, five routes and their fee slabs, all written
 * out as literals — and shared, so Vidya Mandir in Mysuru ran routes to
 * Jayanagar and Whitefield in buses registered KA-01. They live in the
 * schools' own folders now; `tenants/_generate/transport.ts` says why, and
 * what each school states versus what follows from it.
 *
 * A list of six hand-written alerts went with them. Nothing read it — the
 * alerts screen computes them from the fleet's own expiry dates, which is
 * what stops an alert outliving the vehicle it is about — so all it did was
 * name KA-01 vehicles in a file next to the ones it did not describe.
 *
 * What stays here is the join: which children are on which bus, and the
 * occupancy counts that follow.
 */

export const mockDrivers: TransportDriver[] = tenantFixtures().transport.drivers.map(row => ({
  ...row,
}))

export const mockVehicles: Vehicle[] = tenantFixtures().transport.vehicles.map(row => ({ ...row }))

export const mockRoutes: TransportRoute[] = tenantFixtures().transport.routes.map(route => ({
  ...route,
  stops: route.stops.map(stop => ({ ...stop })),
}))

export const mockFeeStructures: TransportFeeStructure[] = tenantFixtures().transport.feeStructures.map(
  row => ({ ...row }),
)

/**
 * Who rides the buses.
 *
 * ── What this replaced ─────────────────────────────────────────────────
 * Eighteen riders written out here by hand, over a school of 441, and not one
 * of their `studentId` codes resolved to a student — `S-001` through `S-018`
 * against a directory that issues `S-2101` upward. They carried their own
 * names and their own classes too, so the transport screen listed Aarav Sharma
 * in 10A while the directory had him in 7A. Eighteen phantom riders on five
 * buses whose route cards claimed 38 students each.
 *
 * ── Assigned by where they live ────────────────────────────────────────
 * The five routes run to Jayanagar, Koramangala, HSR Layout, Whitefield and
 * Electronic City, and every student record carries an address in a Bangalore
 * locality. So a student rides the bus that passes their own house, which is
 * how a school allocates a seat — and it means the transport screen, the
 * student's address and the route map all describe one arrangement.
 *
 * Students in the other nineteen localities are dropped off by their families,
 * which is also true of most of a Bangalore school.
 */

/**
 * The locality a route serves, read off its own name.
 *
 * `Route C - HSR Layout` serves HSR Layout. It used to be a second table
 * pairing route ids to localities, which is one more thing to keep in step
 * with the routes — and the pairing was Bangalore's, so a second school could
 * not have had one at all.
 */
function catchmentOf(route: TransportRoute): string {
  return route.name.split(' - ').slice(1).join(' - ').trim()
}

/** Whether the fee for the seat has been paid. Most have. */
function seatFeeStatus(roll: number): FeeStatus {
  if (roll < 0.72) return 'Paid'
  if (roll < 0.9) return 'Pending'
  return 'Overdue'
}

export const mockStudentAssignments: StudentTransportAssignment[] = (() => {
  const source = rng(`${activeTenant()}:transport:v1`)
  const rows: StudentTransportAssignment[] = []
  const roster = listStudents()

  mockRoutes.forEach(route => {
    const locality = catchmentOf(route)
    const riders = roster.filter(student => (student.address ?? '').includes(locality))

    riders.forEach(student => {
      // Not everybody in the catchment takes the bus — a parent dropping a
      // child on the way to work is the commonest arrangement in the city.
      if (!chance(source, 0.62)) return
      if (rows.filter(row => row.routeId === route.id).length >= route.capacity) return

      const stop = pick(source, route.stops)
      rows.push({
        id: `STA-${String(rows.length + 1).padStart(3, '0')}`,
        studentId: student.studentId,
        studentName:
          student.fullName ?? student.displayName ?? student.name ?? student.studentId,
        class: student.class ?? `${student.gradeLevel}${student.section}`,
        section: student.section ?? '',
        routeId: route.id,
        routeName: route.name,
        stopId: stop.id,
        stopName: stop.name,
        pickupTime: stop.pickupTime,
        dropTime: stop.dropTime,
        // A one-way seat is the child who is picked up and collected in the
        // evening by a parent, which about a fifth of them are.
        type: chance(source, 0.8) ? 'two-way' : 'one-way',
        feeStatus: seatFeeStatus(source()),
      })
    })
  })

  return rows
})()

// A route card claiming 38 riders above a list holding four was the same
// disagreement in miniature, so the counts follow the seats — on the route,
// on each of its stops, and in the bus that runs it.
mockRoutes.forEach(route => {
  const seats = mockStudentAssignments.filter(row => row.routeId === route.id)
  route.studentsAssigned = seats.length
  route.stops.forEach(stop => {
    stop.studentsCount = seats.filter(row => row.stopId === stop.id).length
  })
  const bus = mockVehicles.find(vehicle => vehicle.id === route.vehicleId)
  if (bus) bus.currentOccupancy = seats.length
})
