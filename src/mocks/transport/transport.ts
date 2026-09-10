import type {
  TransportRoute,
  Vehicle,
  TransportDriver,
  StudentTransportAssignment,
  TransportFeeStructure,
  TransportAlert,
  FeeStatus,
} from '@/features/transport/types'
import { listStudents } from '@/mocks/students/store'
import { activeTenant } from '@/mocks/_shared/tenant-context'
import { rng, pick, chance } from '@/mocks/tenants/_generate/random'

// ============================================================================
// Drivers
// ============================================================================

export const mockDrivers: TransportDriver[] = [
  {
    id: 'DRV-001',
    firstName: 'Ramesh',
    lastName: 'Kumar',
    phone: '9876543210',
    emergencyContact: '9876543211',
    address: '12, MG Road, Bangalore',
    licenseNumber: 'KA-01-2019-0012345',
    licenseType: 'HMV',
    licenseExpiry: '2027-03-15',
    experience: 12,
    backgroundVerified: true,
    assignedVehicleId: 'VEH-001',
    assignedVehicleName: 'KA-01-AB-1234',
    status: 'Active',
  },
  {
    id: 'DRV-002',
    firstName: 'Suresh',
    lastName: 'Patil',
    phone: '9876543220',
    emergencyContact: '9876543221',
    address: '45, Jayanagar, Bangalore',
    licenseNumber: 'KA-01-2020-0067890',
    licenseType: 'HMV',
    licenseExpiry: '2026-08-20',
    experience: 8,
    backgroundVerified: true,
    assignedVehicleId: 'VEH-002',
    assignedVehicleName: 'KA-01-CD-5678',
    status: 'Active',
  },
  {
    id: 'DRV-003',
    firstName: 'Venkatesh',
    lastName: 'Reddy',
    phone: '9876543230',
    emergencyContact: '9876543231',
    address: '78, HSR Layout, Bangalore',
    licenseNumber: 'KA-01-2018-0034567',
    licenseType: 'HMV',
    licenseExpiry: '2026-05-10',
    experience: 15,
    backgroundVerified: true,
    assignedVehicleId: 'VEH-003',
    assignedVehicleName: 'KA-01-EF-9012',
    status: 'Active',
  },
  {
    id: 'DRV-004',
    firstName: 'Manoj',
    lastName: 'Singh',
    phone: '9876543240',
    emergencyContact: '9876543241',
    address: '23, Koramangala, Bangalore',
    licenseNumber: 'KA-01-2021-0089012',
    licenseType: 'LMV',
    licenseExpiry: '2026-12-01',
    experience: 5,
    backgroundVerified: true,
    assignedVehicleId: 'VEH-004',
    assignedVehicleName: 'KA-01-GH-3456',
    status: 'On Leave',
  },
  {
    id: 'DRV-005',
    firstName: 'Prakash',
    lastName: 'Rao',
    phone: '9876543250',
    emergencyContact: '9876543251',
    address: '56, Whitefield, Bangalore',
    licenseNumber: 'KA-01-2017-0045678',
    licenseType: 'HMV',
    licenseExpiry: '2026-04-15',
    experience: 18,
    backgroundVerified: false,
    assignedVehicleId: 'VEH-005',
    assignedVehicleName: 'KA-01-IJ-7890',
    status: 'Active',
  },
  {
    id: 'DRV-006',
    firstName: 'Arun',
    lastName: 'Nair',
    phone: '9876543260',
    emergencyContact: '9876543261',
    address: '89, Electronic City, Bangalore',
    licenseNumber: 'KA-01-2022-0056789',
    licenseType: 'HMV',
    licenseExpiry: '2028-06-30',
    experience: 3,
    backgroundVerified: true,
    status: 'Inactive',
  },
]

// ============================================================================
// Vehicles
// ============================================================================

export const mockVehicles: Vehicle[] = [
  {
    id: 'VEH-001',
    registrationNumber: 'KA-01-AB-1234',
    type: 'Bus',
    make: 'Tata',
    model: 'Starbus',
    year: 2021,
    capacity: 45,
    currentOccupancy: 38,
    driverId: 'DRV-001',
    driverName: 'Ramesh Kumar',
    routeId: 'RT-001',
    routeName: 'Route A - Jayanagar',
    insuranceExpiry: '2026-09-15',
    fitnessExpiry: '2026-11-20',
    pucExpiry: '2026-06-30',
    status: 'Active',
    lastMaintenanceDate: '2026-02-10',
    nextMaintenanceDate: '2026-05-10',
  },
  {
    id: 'VEH-002',
    registrationNumber: 'KA-01-CD-5678',
    type: 'Bus',
    make: 'Ashok Leyland',
    model: 'Lynx',
    year: 2022,
    capacity: 50,
    currentOccupancy: 42,
    driverId: 'DRV-002',
    driverName: 'Suresh Patil',
    routeId: 'RT-002',
    routeName: 'Route B - Koramangala',
    insuranceExpiry: '2026-12-01',
    fitnessExpiry: '2027-01-15',
    pucExpiry: '2026-08-20',
    status: 'Active',
    lastMaintenanceDate: '2026-01-20',
    nextMaintenanceDate: '2026-04-20',
  },
  {
    id: 'VEH-003',
    registrationNumber: 'KA-01-EF-9012',
    type: 'Mini Bus',
    make: 'Force',
    model: 'Traveller',
    year: 2023,
    capacity: 26,
    currentOccupancy: 24,
    driverId: 'DRV-003',
    driverName: 'Venkatesh Reddy',
    routeId: 'RT-003',
    routeName: 'Route C - HSR Layout',
    insuranceExpiry: '2027-03-10',
    fitnessExpiry: '2027-05-25',
    pucExpiry: '2026-10-15',
    status: 'Active',
    lastMaintenanceDate: '2026-03-01',
    nextMaintenanceDate: '2026-06-01',
  },
  {
    id: 'VEH-004',
    registrationNumber: 'KA-01-GH-3456',
    type: 'Van',
    make: 'Maruti',
    model: 'Eeco',
    year: 2022,
    capacity: 12,
    currentOccupancy: 10,
    driverId: 'DRV-004',
    driverName: 'Manoj Singh',
    routeId: 'RT-004',
    routeName: 'Route D - Whitefield',
    insuranceExpiry: '2026-04-25',
    fitnessExpiry: '2026-05-10',
    pucExpiry: '2026-04-12',
    status: 'Under Maintenance',
    lastMaintenanceDate: '2026-03-25',
    nextMaintenanceDate: '2026-04-10',
  },
  {
    id: 'VEH-005',
    registrationNumber: 'KA-01-IJ-7890',
    type: 'Bus',
    make: 'Tata',
    model: 'LP 712',
    year: 2020,
    capacity: 40,
    currentOccupancy: 35,
    driverId: 'DRV-005',
    driverName: 'Prakash Rao',
    routeId: 'RT-005',
    routeName: 'Route E - Electronic City',
    insuranceExpiry: '2026-07-20',
    fitnessExpiry: '2026-08-15',
    pucExpiry: '2026-05-30',
    status: 'Active',
    lastMaintenanceDate: '2026-02-15',
    nextMaintenanceDate: '2026-05-15',
  },
  {
    id: 'VEH-006',
    registrationNumber: 'KA-01-KL-2345',
    type: 'Mini Bus',
    make: 'Force',
    model: 'Citiline',
    year: 2021,
    capacity: 20,
    currentOccupancy: 0,
    driverId: '',
    driverName: '',
    routeId: '',
    routeName: '',
    insuranceExpiry: '2026-06-10',
    fitnessExpiry: '2026-09-30',
    pucExpiry: '2026-07-15',
    status: 'Inactive',
    lastMaintenanceDate: '2025-12-01',
    nextMaintenanceDate: '2026-03-01',
  },
  {
    id: 'VEH-007',
    registrationNumber: 'KA-01-MN-6789',
    type: 'Van',
    make: 'Maruti',
    model: 'Eeco',
    year: 2023,
    capacity: 12,
    currentOccupancy: 8,
    driverId: 'DRV-006',
    driverName: 'Arun Nair',
    routeId: '',
    routeName: '',
    insuranceExpiry: '2027-01-20',
    fitnessExpiry: '2027-04-10',
    pucExpiry: '2026-11-25',
    status: 'Active',
    lastMaintenanceDate: '2026-03-10',
    nextMaintenanceDate: '2026-06-10',
  },
  {
    id: 'VEH-008',
    registrationNumber: 'KA-01-OP-0123',
    type: 'Bus',
    make: 'Ashok Leyland',
    model: 'Stag',
    year: 2019,
    capacity: 45,
    currentOccupancy: 30,
    driverId: '',
    driverName: '',
    routeId: '',
    routeName: '',
    insuranceExpiry: '2026-05-05',
    fitnessExpiry: '2026-04-20',
    pucExpiry: '2026-04-10',
    status: 'Inactive',
    lastMaintenanceDate: '2025-11-15',
    nextMaintenanceDate: '2026-02-15',
  },
]

// ============================================================================
// Routes
// ============================================================================

export const mockRoutes: TransportRoute[] = [
  {
    id: 'RT-001',
    name: 'Route A - Jayanagar',
    code: 'RT-A',
    startLocation: 'School Campus',
    endLocation: 'Jayanagar 9th Block',
    type: 'two-way',
    distanceKm: 12,
    estimatedDuration: '45 min',
    vehicleId: 'VEH-001',
    vehicleName: 'KA-01-AB-1234',
    driverId: 'DRV-001',
    driverName: 'Ramesh Kumar',
    studentsAssigned: 38,
    capacity: 45,
    status: 'Active',
    stops: [
      { id: 'S-001', name: 'Jayanagar 9th Block', sequence: 1, pickupTime: '07:15', dropTime: '16:30', studentsCount: 8 },
      { id: 'S-002', name: 'Jayanagar 4th Block', sequence: 2, pickupTime: '07:25', dropTime: '16:20', studentsCount: 12 },
      { id: 'S-003', name: 'Lalbagh Gate', sequence: 3, pickupTime: '07:35', dropTime: '16:10', studentsCount: 6 },
      { id: 'S-004', name: 'Wilson Garden', sequence: 4, pickupTime: '07:45', dropTime: '16:00', studentsCount: 7 },
      { id: 'S-005', name: 'Richmond Circle', sequence: 5, pickupTime: '07:55', dropTime: '15:50', studentsCount: 5 },
    ],
  },
  {
    id: 'RT-002',
    name: 'Route B - Koramangala',
    code: 'RT-B',
    startLocation: 'School Campus',
    endLocation: 'Koramangala 8th Block',
    type: 'two-way',
    distanceKm: 8,
    estimatedDuration: '35 min',
    vehicleId: 'VEH-002',
    vehicleName: 'KA-01-CD-5678',
    driverId: 'DRV-002',
    driverName: 'Suresh Patil',
    studentsAssigned: 42,
    capacity: 50,
    status: 'Active',
    stops: [
      { id: 'S-006', name: 'Koramangala 8th Block', sequence: 1, pickupTime: '07:10', dropTime: '16:35', studentsCount: 10 },
      { id: 'S-007', name: 'Koramangala 4th Block', sequence: 2, pickupTime: '07:20', dropTime: '16:25', studentsCount: 14 },
      { id: 'S-008', name: 'Forum Mall', sequence: 3, pickupTime: '07:30', dropTime: '16:15', studentsCount: 8 },
      { id: 'S-009', name: 'Madiwala', sequence: 4, pickupTime: '07:40', dropTime: '16:05', studentsCount: 10 },
    ],
  },
  {
    id: 'RT-003',
    name: 'Route C - HSR Layout',
    code: 'RT-C',
    startLocation: 'School Campus',
    endLocation: 'HSR Layout Sector 7',
    type: 'two-way',
    distanceKm: 10,
    estimatedDuration: '40 min',
    vehicleId: 'VEH-003',
    vehicleName: 'KA-01-EF-9012',
    driverId: 'DRV-003',
    driverName: 'Venkatesh Reddy',
    studentsAssigned: 24,
    capacity: 26,
    status: 'Active',
    stops: [
      { id: 'S-010', name: 'HSR Sector 7', sequence: 1, pickupTime: '07:10', dropTime: '16:40', studentsCount: 6 },
      { id: 'S-011', name: 'HSR Sector 2', sequence: 2, pickupTime: '07:20', dropTime: '16:30', studentsCount: 8 },
      { id: 'S-012', name: 'Silk Board', sequence: 3, pickupTime: '07:35', dropTime: '16:15', studentsCount: 10 },
    ],
  },
  {
    id: 'RT-004',
    name: 'Route D - Whitefield',
    code: 'RT-D',
    startLocation: 'School Campus',
    endLocation: 'Whitefield Main Road',
    type: 'one-way',
    distanceKm: 18,
    estimatedDuration: '55 min',
    vehicleId: 'VEH-004',
    vehicleName: 'KA-01-GH-3456',
    driverId: 'DRV-004',
    driverName: 'Manoj Singh',
    studentsAssigned: 10,
    capacity: 12,
    status: 'Active',
    stops: [
      { id: 'S-013', name: 'Whitefield Main Road', sequence: 1, pickupTime: '06:50', dropTime: '17:00', studentsCount: 4 },
      { id: 'S-014', name: 'ITPL Main Road', sequence: 2, pickupTime: '07:05', dropTime: '16:45', studentsCount: 3 },
      { id: 'S-015', name: 'Marathahalli', sequence: 3, pickupTime: '07:20', dropTime: '16:30', studentsCount: 3 },
    ],
  },
  {
    id: 'RT-005',
    name: 'Route E - Electronic City',
    code: 'RT-E',
    startLocation: 'School Campus',
    endLocation: 'Electronic City Phase 1',
    type: 'two-way',
    distanceKm: 22,
    estimatedDuration: '60 min',
    vehicleId: 'VEH-005',
    vehicleName: 'KA-01-IJ-7890',
    driverId: 'DRV-005',
    driverName: 'Prakash Rao',
    studentsAssigned: 35,
    capacity: 40,
    status: 'Inactive',
    stops: [
      { id: 'S-016', name: 'Electronic City Phase 1', sequence: 1, pickupTime: '06:45', dropTime: '17:10', studentsCount: 12 },
      { id: 'S-017', name: 'Bommanahalli', sequence: 2, pickupTime: '07:05', dropTime: '16:50', studentsCount: 10 },
      { id: 'S-018', name: 'BTM Layout', sequence: 3, pickupTime: '07:20', dropTime: '16:35', studentsCount: 8 },
      { id: 'S-019', name: 'Bannerghatta Road', sequence: 4, pickupTime: '07:35', dropTime: '16:20', studentsCount: 5 },
    ],
  },
]

// ============================================================================
// Student Assignments
// ============================================================================

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

/** Which route serves which locality, matched against a student's address. */
const ROUTE_CATCHMENTS: readonly { routeId: string; locality: string }[] = [
  { routeId: 'RT-001', locality: 'Jayanagar' },
  { routeId: 'RT-002', locality: 'Koramangala' },
  { routeId: 'RT-003', locality: 'HSR Layout' },
  { routeId: 'RT-004', locality: 'Whitefield' },
  { routeId: 'RT-005', locality: 'Electronic City' },
]

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

  ROUTE_CATCHMENTS.forEach(({ routeId, locality }) => {
    const route = mockRoutes.find(candidate => candidate.id === routeId)
    if (!route) return
    const riders = roster.filter(student => (student.address ?? '').includes(locality))

    riders.forEach(student => {
      // Not everybody in the catchment takes the bus — a parent dropping a
      // child on the way to work is the commonest arrangement in the city.
      if (!chance(source, 0.62)) return
      if (rows.filter(row => row.routeId === routeId).length >= route.capacity) return

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
// disagreement in miniature, so the counts follow the seats.
mockRoutes.forEach(route => {
  route.studentsAssigned = mockStudentAssignments.filter(row => row.routeId === route.id).length
  route.stops.forEach(stop => {
    stop.studentsCount = mockStudentAssignments.filter(row => row.stopId === stop.id).length
  })
})

// ============================================================================
// Fee Structures
// ============================================================================

export const mockFeeStructures: TransportFeeStructure[] = [
  { id: 'FEE-001', routeId: 'RT-001', routeName: 'Route A - Jayanagar', distanceSlab: '10-15 km', oneWayFee: 2500, twoWayFee: 4500, term: 'Term 1' },
  { id: 'FEE-002', routeId: 'RT-002', routeName: 'Route B - Koramangala', distanceSlab: '5-10 km', oneWayFee: 2000, twoWayFee: 3500, term: 'Term 1' },
  { id: 'FEE-003', routeId: 'RT-003', routeName: 'Route C - HSR Layout', distanceSlab: '10-15 km', oneWayFee: 2500, twoWayFee: 4500, term: 'Term 1' },
  { id: 'FEE-004', routeId: 'RT-004', routeName: 'Route D - Whitefield', distanceSlab: '15-20 km', oneWayFee: 3000, twoWayFee: 5500, term: 'Term 1' },
  { id: 'FEE-005', routeId: 'RT-005', routeName: 'Route E - Electronic City', distanceSlab: '20-25 km', oneWayFee: 3500, twoWayFee: 6000, term: 'Term 1' },
]

// ============================================================================
// Alerts
// ============================================================================

export const mockAlerts: TransportAlert[] = [
  { id: 'ALT-001', title: 'Insurance Expiring Soon', description: 'Vehicle KA-01-GH-3456 insurance expires on 25 Apr 2026', severity: 'danger', date: '2026-04-08' },
  { id: 'ALT-002', title: 'Maintenance Due', description: 'Vehicle KA-01-CD-5678 next maintenance due on 20 Apr 2026', severity: 'warning', date: '2026-04-08' },
  { id: 'ALT-003', title: 'Route Over-Capacity', description: 'Route C - HSR Layout is at 92% capacity (24/26)', severity: 'warning', date: '2026-04-07' },
  { id: 'ALT-004', title: 'PUC Expired', description: 'Vehicle KA-01-OP-0123 PUC certificate has expired', severity: 'danger', date: '2026-04-06' },
  { id: 'ALT-005', title: 'License Expiring', description: 'Driver Prakash Rao license expires on 15 Apr 2026', severity: 'danger', date: '2026-04-05' },
  { id: 'ALT-006', title: 'New Route Request', description: '5 parent requests pending for Marathahalli area', severity: 'info', date: '2026-04-04' },
]
