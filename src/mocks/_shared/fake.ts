/**
 * Deterministic "fake" data primitives. We don't use faker.js so the bundle
 * stays lean; instead we ship small curated lists tuned to the Sanketa
 * context (Indian school, Bangalore, Karnataka).
 *
 * All helpers accept an optional numeric `seed` so a given row always produces
 * the same output — useful when regenerating mock data and wanting stable
 * screenshots / tests.
 */

import { PHONE_COUNTRY_CODE, SCHOOL_DOMAIN } from './constants'

// ---------------------------------------------------------------------------
// Curated name pools
// ---------------------------------------------------------------------------

/** Indian first names, mixed gender and regional diversity. */
export const INDIAN_FIRST_NAMES = [
  // North
  'Aarav', 'Arjun', 'Rohan', 'Karan', 'Kabir', 'Vihaan', 'Ishaan', 'Dhruv',
  'Ananya', 'Priya', 'Kavya', 'Ishita', 'Diya', 'Meera', 'Saanvi', 'Aditi',
  // South
  'Arvind', 'Vikram', 'Venkatesh', 'Suresh', 'Ramesh', 'Prakash', 'Harish',
  'Lakshmi', 'Padma', 'Anjali', 'Divya', 'Sneha', 'Deepa', 'Revathi',
  // East
  'Arnab', 'Rajat', 'Soumya', 'Abhishek', 'Rohit', 'Sanjay',
  'Ritika', 'Riya', 'Shreya', 'Oindrila',
  // West
  'Rishi', 'Dev', 'Aryan', 'Nirav', 'Jatin',
  'Kashish', 'Nikita', 'Tanvi', 'Pooja',
  // Muslim
  'Aarif', 'Imran', 'Faizan', 'Zain', 'Rehan',
  'Aisha', 'Zara', 'Sana', 'Fatima', 'Sameera',
]

/** Indian last names (surnames). Covers common regional spread. */
export const INDIAN_LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Agarwal', 'Mehra', 'Kapoor', 'Malhotra',
  'Nair', 'Menon', 'Pillai', 'Iyer', 'Iyengar', 'Krishnan', 'Subramanian',
  'Reddy', 'Rao', 'Naidu', 'Varma', 'Murthy',
  'Kumar', 'Singh', 'Chauhan', 'Yadav',
  'Patel', 'Desai', 'Joshi', 'Shah', 'Modi',
  'Chatterjee', 'Banerjee', 'Mukherjee', 'Bose', 'Sen',
  'Kulkarni', 'Deshpande', 'Joshi',
  'Khan', 'Ali', 'Ahmed', 'Siddiqui', 'Hussain',
]

/** Mildly diverse Western names — kept for the small percentage of non-Indian
 *  students every Bangalore school tends to have (expats). */
export const WESTERN_FIRST_NAMES = ['Michael', 'Emma', 'Sarah', 'David', 'Sophia', 'James']
export const WESTERN_LAST_NAMES = ['Chen', 'Williams', 'Kim', 'Roy', 'Park', 'Johnson']

// ---------------------------------------------------------------------------
// Bangalore / Karnataka addresses
// ---------------------------------------------------------------------------

/** Real Bangalore localities — used verbatim for addresses. */
export const BANGALORE_LOCALITIES = [
  'HSR Layout', 'Koramangala', 'Indiranagar', 'Whitefield', 'Jayanagar',
  'JP Nagar', 'Electronic City', 'Marathahalli', 'Hebbal', 'Malleshwaram',
  'Banashankari', 'BTM Layout', 'Bellandur', 'Sarjapur Road', 'Yelahanka',
  'Rajajinagar', 'RT Nagar', 'Basavanagudi', 'Frazer Town', 'Domlur',
]

/** Karnataka postal code prefixes for Bangalore (560xxx). */
const BLR_PIN_PREFIXES = ['560001', '560004', '560008', '560011', '560034', '560037',
  '560068', '560076', '560095', '560100', '560102', '560103', '560029', '560038']

/** Short street names used to synthesise address lines. */
const STREET_WORDS = [
  '1st Cross', '2nd Main', '3rd Block', '4th Cross', '5th Main',
  '7th A Cross', '12th Main Road', '80 Feet Road', 'Outer Ring Road',
  'Inner Ring Road', 'Residency Road', 'MG Road',
]

// ---------------------------------------------------------------------------
// Deterministic pickers
// ---------------------------------------------------------------------------

/**
 * Fast deterministic hash. Good enough for indexing into small arrays from a
 * seed integer without pulling in crypto.
 */
function hash(seed: number): number {
  let x = seed | 0
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b)
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35)
  return (x ^ (x >>> 16)) >>> 0
}

function pick<T>(arr: readonly T[], seed: number): T {
  return arr[hash(seed) % arr.length]
}

// ---------------------------------------------------------------------------
// Name generation
// ---------------------------------------------------------------------------

/**
 * Generate a name pair (`{firstName, lastName}`) that leans Indian.
 * ~85% Indian, 15% Western so the dataset feels like a Bangalore school.
 *
 * @param seed  stable seed (use the same int for the same entity every run)
 * @param options.indianBias override the 85/15 split (0..1)
 */
export function personName(
  seed: number,
  options: { indianBias?: number } = {},
): { firstName: string; lastName: string } {
  const bias = options.indianBias ?? 0.85
  const roll = (hash(seed + 7919) % 100) / 100
  const indian = roll < bias
  return {
    firstName: pick(indian ? INDIAN_FIRST_NAMES : WESTERN_FIRST_NAMES, seed * 31),
    lastName:  pick(indian ? INDIAN_LAST_NAMES  : WESTERN_LAST_NAMES,  seed * 73),
  }
}

/** "Aarav Sharma" one-liner. */
export function fullName(seed: number, options?: { indianBias?: number }): string {
  const { firstName, lastName } = personName(seed, options)
  return `${firstName} ${lastName}`
}

// ---------------------------------------------------------------------------
// Contact details
// ---------------------------------------------------------------------------

/**
 * 10-digit Indian mobile number. Starts with 9 / 8 / 7 / 6 per TRAI allocation,
 * followed by 9 digits drawn from the seed. Output has NO country code.
 */
export function phone10(seed: number): string {
  const firstDigit = ['9', '8', '7', '6'][hash(seed + 3) % 4]
  const rest = String(hash(seed + 11)).padStart(9, '0').slice(0, 9)
  return `${firstDigit}${rest}`
}

/** "+91 98765 43210" — display-friendly. */
export function phoneDisplay(seed: number): string {
  const raw = phone10(seed)
  return `${PHONE_COUNTRY_CODE} ${raw.slice(0, 5)} ${raw.slice(5)}`
}

/**
 * Turn a person's name into a `firstname.lastname@sanketa.edu` email.
 * All lowercased, non-alpha stripped.
 */
export function emailFor(firstName: string, lastName: string): string {
  const clean = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '')
  return `${clean(firstName)}.${clean(lastName)}@${SCHOOL_DOMAIN}`
}

// ---------------------------------------------------------------------------
// Address generation
// ---------------------------------------------------------------------------

/**
 * Structured Bangalore address. Returns a single string suitable for the
 * address fields we already have on Student/Teacher/Driver records.
 *
 * Example: "42, 7th A Cross, HSR Layout, Bangalore, Karnataka 560102, India"
 */
export function bangaloreAddress(seed: number): string {
  const houseNo = (hash(seed + 41) % 400) + 1
  const street = pick(STREET_WORDS, seed * 13)
  const locality = pick(BANGALORE_LOCALITIES, seed * 17)
  const pin = pick(BLR_PIN_PREFIXES, seed * 23)
  return `${houseNo}, ${street}, ${locality}, Bangalore, Karnataka ${pin}, India`
}

/** Just the locality, e.g. for route names or short location labels. */
export function bangaloreLocality(seed: number): string {
  return pick(BANGALORE_LOCALITIES, seed * 19)
}
