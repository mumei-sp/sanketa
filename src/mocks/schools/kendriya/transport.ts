/**
 * Kendriya Vidyalaya's buses.
 *
 * Five routes out into the localities its families live in — the same
 * localities the roster generator draws addresses from, which is what lets a
 * child be put on the bus that passes their own house rather than on one
 * picked at random.
 *
 * The stop names are written out rather than generated. "Lalbagh Gate",
 * "Silk Board", "Forum Mall" are what a parent looks for on a circular; a
 * generated `Koramangala Stop 3` is furniture. Everything else — the vehicles,
 * the drivers, the fee slabs — follows from this table; see
 * `../_generate/transport.ts`.
 */

import { generateFleet, type FleetFixtures } from '../_generate/transport'
import { BANGALORE } from '../_generate/names'

export const transportFixtures: FleetFixtures = generateFleet({
  code: 'kendriya',
  city: BANGALORE,
  // Bengaluru Central. Every bus on the campus is registered here.
  rto: 'KA-01',
  idPrefix: '',
  routes: [
    {
      code: 'A',
      locality: 'Jayanagar',
      distanceKm: 12,
      stops: [
        'Jayanagar 9th Block',
        'Jayanagar 4th Block',
        'Lalbagh Gate',
        'Wilson Garden',
        'Richmond Circle',
      ],
    },
    {
      code: 'B',
      locality: 'Koramangala',
      distanceKm: 8,
      stops: [
        'Koramangala 8th Block',
        'Koramangala 4th Block',
        'Forum Mall',
        'Madiwala',
      ],
    },
    {
      code: 'C',
      locality: 'HSR Layout',
      distanceKm: 14,
      stops: ['HSR Sector 7', 'HSR Sector 2', 'Agara Lake', 'Silk Board'],
    },
    {
      code: 'D',
      locality: 'Whitefield',
      distanceKm: 19,
      stops: [
        'Whitefield Main Road',
        'ITPL Main Road',
        'Kundalahalli Gate',
        'Marathahalli Bridge',
      ],
    },
    {
      code: 'E',
      locality: 'Electronic City',
      distanceKm: 23,
      stops: [
        'Electronic City Phase 1',
        'Hosa Road Junction',
        'Bommanahalli',
        'BTM Layout',
      ],
    },
  ],
})
