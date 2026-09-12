/**
 * Vidya Mandir's buses.
 *
 * Mysuru routes, Mysuru stops, and vehicles registered KA-09. It used to run
 * Kendriya's five: a school in Mysuru with buses to Whitefield and Electronic
 * City, carrying nobody, because a rider is matched to a route by the locality
 * on their own address and no child here lives in Bangalore. Sixty riders at
 * one school and zero at the other was the symptom; a shared fleet was the
 * cause.
 *
 * Four routes rather than five — a smaller city and a shorter catchment, and
 * Mysuru is small enough that a good many families simply cycle.
 */

import { generateFleet, type FleetFixtures } from '../_generate/transport'
import { MYSURU } from '../_generate/names'

export const transportFixtures: FleetFixtures = generateFleet({
  code: 'vidya-mandir',
  city: MYSURU,
  // Mysuru South.
  rto: 'KA-09',
  idPrefix: 'VM-',
  routes: [
    {
      code: 'A',
      locality: 'Kuvempunagar',
      distanceKm: 7,
      stops: [
        'Kuvempunagar Double Road',
        'Vishwamanava Double Road',
        'Ramakrishna Nagar Circle',
        'Chamundi Hill Road',
      ],
    },
    {
      code: 'B',
      locality: 'Saraswathipuram',
      distanceKm: 5,
      stops: ['Saraswathipuram 5th Main', 'Kalidasa Road', 'Ramaswamy Circle'],
    },
    {
      code: 'C',
      locality: 'Gokulam',
      distanceKm: 9,
      stops: [
        'Gokulam 3rd Stage',
        'Gokulam Park',
        'Manasagangotri Gate',
        'Hunsur Road Junction',
      ],
    },
    {
      code: 'D',
      locality: 'Vijayanagar',
      distanceKm: 11,
      stops: [
        'Vijayanagar 4th Stage',
        'Outer Ring Road Junction',
        'Hebbal Industrial Area',
        'Metagalli Circle',
      ],
    },
  ],
})
