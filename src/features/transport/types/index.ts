import type { LucideIcon } from 'lucide-react'

// ============================================================================
// Transport Route
// ============================================================================

export interface RouteStop {
  id: string
  name: string
  sequence: number
  pickupTime: string
  dropTime: string
  studentsCount: number
}

export interface TransportRoute {
  id: string
  name: string
  code: string
  startLocation: string
  endLocation: string
  stops: RouteStop[]
  vehicleId: string
  vehicleName: string
  driverId: string
  driverName: string
  type: 'one-way' | 'two-way'
  distanceKm: number
  estimatedDuration: string
  studentsAssigned: number
  capacity: number
  status: 'Active' | 'Inactive'
}

// ============================================================================
// Vehicle
// ============================================================================

export type VehicleType = 'Bus' | 'Van' | 'Mini Bus'
export type VehicleStatus = 'Active' | 'Under Maintenance' | 'Inactive'

export interface Vehicle {
  id: string
  registrationNumber: string
  type: VehicleType
  make: string
  model: string
  year: number
  capacity: number
  currentOccupancy: number
  driverId: string
  driverName: string
  routeId: string
  routeName: string
  insuranceExpiry: string
  fitnessExpiry: string
  pucExpiry: string
  gpsDeviceId?: string
  status: VehicleStatus
  lastMaintenanceDate: string
  nextMaintenanceDate: string
}

// ============================================================================
// Driver
// ============================================================================

export type DriverStatus = 'Active' | 'On Leave' | 'Inactive'

export interface TransportDriver {
  id: string
  firstName: string
  lastName: string
  phone: string
  emergencyContact: string
  address: string
  avatar?: string
  licenseNumber: string
  licenseType: string
  licenseExpiry: string
  experience: number
  backgroundVerified: boolean
  assignedVehicleId?: string
  assignedVehicleName?: string
  status: DriverStatus
}

// ============================================================================
// Student Assignment
// ============================================================================

export type TransportType = 'one-way' | 'two-way'
export type FeeStatus = 'Paid' | 'Pending' | 'Overdue'

export interface StudentTransportAssignment {
  id: string
  studentId: string
  studentName: string
  class: string
  section: string
  routeId: string
  routeName: string
  stopId: string
  stopName: string
  pickupTime: string
  dropTime: string
  type: TransportType
  feeStatus: FeeStatus
}

// ============================================================================
// Transport Fees
// ============================================================================

export interface TransportFeeStructure {
  id: string
  routeId: string
  routeName: string
  distanceSlab: string
  oneWayFee: number
  twoWayFee: number
  term: string
}

// ============================================================================
// Dashboard Stat (reuses DashboardStat pattern)
// ============================================================================

export interface TransportStat {
  id: string
  label: string
  value: number
  icon: LucideIcon
  iconBg: string
  iconColor: string
}

// ============================================================================
// Alert
// ============================================================================

export type AlertSeverity = 'danger' | 'warning' | 'info'

export interface TransportAlert {
  id: string
  title: string
  description: string
  severity: AlertSeverity
  date: string
}
