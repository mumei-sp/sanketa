/**
 * A school's fleet.
 *
 * ── Why per school ────────────────────────────────────────────────────
 * The buses used to be one shared fixture, so Vidya Mandir — a school in
 * Mysuru — ran five routes to Jayanagar, Koramangala, HSR Layout, Whitefield
 * and Electronic City, all of them in Bangalore, in vehicles registered
 * KA-01. It carried nobody, and that was the only reason the absurdity was
 * survivable: riders are matched to a route by the locality on the student's
 * own address, and no child in Mysuru lives in Whitefield. Sixty riders at
 * one school, zero at the other, and the same five buses on both screens.
 *
 * ── What each school states, and what is derived ──────────────────────
 * A school's folder supplies the short table that is genuinely local
 * knowledge: which localities it runs to, how far, and what the stops are
 * called. Stop names are worth writing out — "Lalbagh Gate", "Silk Board",
 * "Chamundi Hill Road" — because a generated `Locality Stop 3` reads as
 * furniture, and the stop is the thing a parent looks for.
 *
 * Everything else follows from that table: the routes, the vehicles that run
 * them, the drivers, and the fee slab, which is a function of distance the way
 * a school's transport circular actually states it.
 */

import type {
  TransportRoute,
  RouteStop,
  Vehicle,
  TransportDriver,
  TransportFeeStructure,
} from '@/features/transport/types'
import { rng, int, pick, type Rng } from './random'
import { COMMUNITIES, type City } from './names'

/** One route, as a school knows it. */
export interface RouteSpec {
  /** `A`, `B` — what the route is called on the board. */
  code: string
  /**
   * The locality the route serves.
   *
   * Load-bearing: riders are matched to a route by testing this against the
   * student's address, so it has to be spelled exactly as the addresses spell
   * it. See `mocks/transport/transport.ts`.
   */
  locality: string
  distanceKm: number
  /** In order, nearest the school last — the bus fills as it comes in. */
  stops: readonly string[]
}

export interface FleetConfig {
  /** Seed namespace — the school's code. */
  code: string
  city: City
  /** The regional transport office code its vehicles are registered under. */
  rto: string
  routes: readonly RouteSpec[]
  /** Id prefix, so a Mysuru bus never reads as a Bangalore one in a log. */
  idPrefix: string
}

export interface FleetFixtures {
  drivers: TransportDriver[]
  vehicles: Vehicle[]
  routes: TransportRoute[]
  feeStructures: TransportFeeStructure[]
}

/**
 * What a term on the bus costs, by how far it goes.
 *
 * A slab table, which is how a school's transport circular states it — not a
 * per-route number somebody typed, which is what it was and which meant the
 * 12 km route and the 24 km route could quietly cost the same.
 */
function slabFor(distanceKm: number): { slab: string; oneWay: number; twoWay: number } {
  if (distanceKm <= 10) return { slab: '5-10 km', oneWay: 2000, twoWay: 3500 }
  if (distanceKm <= 15) return { slab: '10-15 km', oneWay: 2500, twoWay: 4500 }
  if (distanceKm <= 20) return { slab: '15-20 km', oneWay: 3000, twoWay: 5500 }
  return { slab: '20-25 km', oneWay: 3500, twoWay: 6000 }
}

const pad3 = (n: number) => String(n).padStart(3, '0')

/** `07:15`, counting on from a start in ten-minute steps. */
function clock(startHour: number, startMinute: number, step: number): string {
  const total = startHour * 60 + startMinute + step
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

/** A driver's name — a generation older than the children's, and local. */
function driverName(source: Rng): { first: string; last: string } {
  const community = pick(source, COMMUNITIES)
  return { first: pick(source, community.fathers), last: pick(source, community.surnames) }
}

const MAKES: readonly { make: string; model: string; capacity: number }[] = [
  { make: 'Tata', model: 'Starbus', capacity: 45 },
  { make: 'Ashok Leyland', model: 'Sunshine', capacity: 42 },
  { make: 'Eicher', model: 'Skyline Pro', capacity: 40 },
  { make: 'Force', model: 'Traveller', capacity: 26 },
  { make: 'Mahindra', model: 'Cruzio School', capacity: 32 },
]

const PLATE_LETTERS = ['AB', 'CD', 'EF', 'GH', 'JK', 'LM', 'NP', 'QR', 'ST', 'UV']

/** `2026-06-30` — a date offset from today, for a certificate's expiry. */
function expiryIso(days: number, base = new Date()): string {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function generateFleet(config: FleetConfig): FleetFixtures {
  const source = rng(`${config.code}:fleet:v1`)
  const { idPrefix } = config

  // One driver per route plus a spare, which is what a school with five buses
  // keeps — somebody has to cover a sick day.
  const driverCount = config.routes.length + 1
  const drivers: TransportDriver[] = Array.from({ length: driverCount }, (_, i) => {
    const { first, last } = driverName(source)
    const locality = pick(source, config.city.localities)
    return {
      id: `${idPrefix}DRV-${pad3(i + 1)}`,
      firstName: first,
      lastName: last,
      phone: String(9880000000 + i * 8117 + int(source, 100, 999)),
      emergencyContact: String(9740000000 + i * 6421 + int(source, 100, 999)),
      address: `${int(source, 1, 180)}, ${locality.name}, ${config.city.name}`,
      licenseNumber: `${config.rto}-${int(source, 2008, 2020)}-00${int(source, 10000, 99999)}`,
      licenseType: 'HMV',
      // A licence that lapses next month is a real alert; one that lapsed last
      // month is a real problem. The fleet needs both, or the alerts screen
      // has nothing to be about.
      licenseExpiry: expiryIso(int(source, -40, 900)),
      experience: int(source, 3, 22),
      backgroundVerified: source() > 0.12,
      status: i < config.routes.length ? 'Active' : 'Inactive',
    }
  })

  // A bus per route, plus three that are not on one: a spare, one in the
  // workshop and one off the road. A fleet where every vehicle is running is
  // a fleet nobody has maintained.
  const vehicleCount = config.routes.length + 3
  const vehicles: Vehicle[] = Array.from({ length: vehicleCount }, (_, i) => {
    const spec = MAKES[i % MAKES.length]
    const onRoute = i < config.routes.length
    const route = onRoute ? config.routes[i] : undefined
    return {
      id: `${idPrefix}VEH-${pad3(i + 1)}`,
      registrationNumber: `${config.rto}-${PLATE_LETTERS[i % PLATE_LETTERS.length]}-${int(source, 1000, 9999)}`,
      type: spec.capacity >= 40 ? 'Bus' : 'Van',
      make: spec.make,
      model: spec.model,
      year: int(source, 2016, 2024),
      capacity: spec.capacity,
      // Filled in once the riders are known — see `mocks/transport`.
      currentOccupancy: 0,
      driverId: onRoute ? drivers[i].id : '',
      driverName: onRoute ? `${drivers[i].firstName} ${drivers[i].lastName}` : '',
      routeId: route ? `${idPrefix}RT-${pad3(i + 1)}` : '',
      routeName: route ? `Route ${route.code} - ${route.locality}` : '',
      insuranceExpiry: expiryIso(int(source, -150, 400)),
      fitnessExpiry: expiryIso(int(source, -60, 500)),
      pucExpiry: expiryIso(int(source, -120, 180)),
      lastMaintenanceDate: expiryIso(-int(source, 20, 200)),
      // Some are overdue. A fleet whose next service is always in the future
      // gives the alerts screen nothing to say.
      nextMaintenanceDate: expiryIso(int(source, -120, 90)),
      status:
        i <= config.routes.length
          ? 'Active'
          : i === config.routes.length + 1
            ? 'Under Maintenance'
            : 'Inactive',
    }
  })

  const routes: TransportRoute[] = config.routes.map((spec, i) => {
    const routeId = `${idPrefix}RT-${pad3(i + 1)}`
    // The first stop is the far end of the route and the earliest pickup; the
    // bus works its way in, so each later stop is ten minutes later going and
    // ten minutes earlier coming back.
    const stops: RouteStop[] = spec.stops.map((name, s) => ({
      id: `${routeId}-S${s + 1}`,
      name,
      sequence: s + 1,
      pickupTime: clock(6, 50 + i * 5, s * 10),
      dropTime: clock(16, 40 - i * 5, -s * 10),
      // Filled in once the riders are known.
      studentsCount: 0,
    }))

    return {
      id: routeId,
      name: `Route ${spec.code} - ${spec.locality}`,
      code: `RT-${spec.code}`,
      startLocation: 'School Campus',
      endLocation: spec.stops[0],
      stops,
      vehicleId: vehicles[i].id,
      vehicleName: vehicles[i].registrationNumber,
      driverId: drivers[i].id,
      driverName: `${drivers[i].firstName} ${drivers[i].lastName}`,
      type: 'two-way',
      distanceKm: spec.distanceKm,
      estimatedDuration: `${Math.round(spec.distanceKm * 3.2)} min`,
      // Counted once the riders are known.
      studentsAssigned: 0,
      capacity: vehicles[i].capacity,
      status: 'Active',
    }
  })

  const feeStructures: TransportFeeStructure[] = routes.map((route, i) => {
    const { slab, oneWay, twoWay } = slabFor(route.distanceKm)
    return {
      id: `${idPrefix}FEE-${pad3(i + 1)}`,
      routeId: route.id,
      routeName: route.name,
      distanceSlab: slab,
      oneWayFee: oneWay,
      twoWayFee: twoWay,
      term: 'Term 1',
    }
  })

  return { drivers, vehicles, routes, feeStructures }
}
