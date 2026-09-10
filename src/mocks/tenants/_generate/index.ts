/**
 * The seed generators.
 *
 * A school's fixtures are generated rather than typed out, for the reason set
 * out in `roster.ts`: a demo school has to be the size of a school. What lives
 * here is the machinery; what each school actually is lives in its own folder,
 * which passes a config in.
 *
 * Underscore-prefixed so it reads as apparatus rather than as a third school.
 */

export { rng, int, pick, chance, bell, weighted, type Rng } from './random'
export { COMMUNITIES, BANGALORE, MYSURU, type City, type Community } from './names'
export { generateRoster, type RosterConfig, type SectionSpec } from './roster'
