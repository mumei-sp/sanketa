/**
 * A school's spending.
 *
 * ── Why per school ────────────────────────────────────────────────────
 * It was 48 hand-written rows, one list, shared — so both schools spent the
 * same ₹7,500 on graphing calculators on the same day, and the finance page
 * showed the same total for a school of 441 and a school of 317. A ledger
 * that does not depend on how many people you employ or how many children you
 * teach is not a ledger.
 *
 * ── What the old one could not say ────────────────────────────────────
 * The monthly trend was eight typed figures, the category breakdown was five
 * more, and the 48 rows were a third set. None of the three added up to
 * either of the others: the breakdown claimed ₹687,500 of salaries against a
 * ledger containing no salary row at all, and the trend's August was ₹189,500
 * against rows that summed to something else entirely. All three are counted
 * off the rows now, so the pie, the line and the table are one ledger.
 *
 * Salaries are in the rows, because they are 55% of what a school spends and
 * leaving them out made every other category look enormous. One disbursement
 * a month, sized by the actual faculty.
 */

import type {
  Expense,
  ExpenseCategory,
  ExpenseTrendData,
  ExpenseBreakdownData,
  Reimbursement,
} from '@/features/expenses/types'
import type { Teacher } from '@/features/teachers/types'
import { rng, int, pick, chance, bell, type Rng } from './random'
import { displayDate, relativeDate } from '@/mocks/_shared/date-helpers'
import { MONTH_SHORT_LABELS } from '@/config/school-config'

export interface ExpenseFixtures {
  expenses: Expense[]
  reimbursements: Reimbursement[]
  trend: ExpenseTrendData[]
  breakdown: ExpenseBreakdownData[]
}

export interface ExpenseConfig {
  /** Seed namespace — the school's code. */
  code: string
  /** Sized off the real staff: salaries, and who claims a reimbursement. */
  faculty: readonly Teacher[]
  /** Sized off the real roster: consumables scale with children. */
  studentCount: number
  /** Id prefix, so a Mysuru voucher never reads as a Bangalore one. */
  idPrefix: string
}

/** What a school buys, by category. Each with a plausible rupee range. */
const PURCHASES: Readonly<Record<Exclude<ExpenseCategory, 'Salaries'>, readonly [string, number, number][]>> = {
  Supplies: [
    ['Chart paper and stationery', 4000, 12000],
    ['Chemistry reagents', 8000, 22000],
    ['Whiteboard markers — bulk order', 3000, 7000],
    ['Library books — new titles', 12000, 40000],
    ['Sports balls and nets', 6000, 18000],
    ['Art and craft materials', 4000, 14000],
    ['Printer toner and paper', 7000, 16000],
    ['Exam answer booklets', 9000, 26000],
    ['First-aid room refills', 2000, 6000],
    ['Graphing calculators', 5000, 15000],
  ],
  Maintenance: [
    ['Laboratory equipment servicing', 8000, 25000],
    ['Classroom fan and light repairs', 3000, 11000],
    ['Water purifier annual contract', 12000, 30000],
    ['Painting — corridor and staircase', 20000, 60000],
    ['Playground equipment repair', 6000, 20000],
    ['CCTV system maintenance', 8000, 18000],
    ['Generator servicing', 9000, 22000],
    ['Plumbing — washroom block', 5000, 17000],
  ],
  Events: [
    ['Annual day — stage and lighting', 40000, 120000],
    ['Sports day — medals and trophies', 15000, 45000],
    ['Science exhibition materials', 10000, 30000],
    ['Independence Day decorations', 4000, 12000],
    ['Inter-school quiz — hosting costs', 12000, 35000],
    ['Teachers Day refreshments', 6000, 16000],
  ],
  Others: [
    ['Board affiliation and examination fees', 40000, 120000],
    ['Software licences — school ERP', 18000, 45000],
    ['Audit and legal retainer', 20000, 45000],
    ['Staff training and workshops', 15000, 40000],
  ],
}

/**
 * What recurs every month, whatever else happens.
 *
 * Separate from the occasional purchases above because the difference is the
 * whole shape of a school's accounts. Salaries and the standing contracts —
 * power, housekeeping, security, diesel — are most of what a school spends,
 * and modelling them as occasional draws made non-salary spending come out at
 * ₹80,000 a month for a campus of 441 children, which would not keep the
 * lights on. The pie was 93% salaries as a result.
 */
const MONTHLY_COMMITMENTS: readonly {
  department: string
  category: Exclude<ExpenseCategory, 'Salaries'>
  description: string
  /** Per month, for a school of 400. Scaled by roster below. */
  low: number
  high: number
}[] = [
  { department: 'Facilities', category: 'Others', description: 'Electricity — BESCOM', low: 120000, high: 185000 },
  { department: 'Facilities', category: 'Others', description: 'Housekeeping contract', low: 145000, high: 200000 },
  { department: 'Administration', category: 'Others', description: 'Security agency fees', low: 175000, high: 225000 },
  { department: 'Transport', category: 'Maintenance', description: 'Diesel and bus maintenance', low: 190000, high: 300000 },
  { department: 'Facilities', category: 'Others', description: 'Water tanker supply', low: 38000, high: 82000 },
  { department: 'Administration', category: 'Others', description: 'Internet and telephone', low: 24000, high: 40000 },
  { department: 'Facilities', category: 'Maintenance', description: 'Lift and generator AMC', low: 22000, high: 46000 },
  { department: 'Administration', category: 'Supplies', description: 'Printing, stationery and exam material', low: 58000, high: 96000 },
]

/**
 * A date inside a given calendar month.
 *
 * Counting back in thirty-day steps drifts — seven steps of thirty is 210
 * days, which from September lands in mid-February and sometimes in January,
 * outside the eight months the trend chart covers. The ledger's own total
 * then disagreed with the sum of its own trend, which is the class of thing
 * this whole pass has been removing.
 */
function dayInMonth(monthsAgo: number, day: number, base = new Date()): Date {
  const first = new Date(base.getFullYear(), base.getMonth() - monthsAgo, 1)
  const lastDay = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
  // Never later than today, or the ledger holds bills not yet raised. Wrapped
  // rather than clamped, so this month's bills spread over the days so far
  // instead of all landing on today.
  const limit = monthsAgo === 0 ? base.getDate() : lastDay
  return new Date(first.getFullYear(), first.getMonth(), ((day - 1) % limit) + 1)
}

/** Departments that spend money but teach nobody. */
const SUPPORT_DEPARTMENTS = ['Administration', 'Facilities', 'Transport', 'Library']

/**
 * Who books a purchase, by what it is.
 *
 * A teaching department buys its own supplies; nobody in the Kannada
 * department pays the internet bill, which is what a single pooled list of
 * departments produced.
 */
function bookedBy(
  source: Rng,
  category: Exclude<ExpenseCategory, 'Salaries'>,
  teaching: readonly string[],
): string {
  switch (category) {
    case 'Supplies':
      return pick(source, teaching)
    case 'Maintenance':
      return pick(source, ['Facilities', 'Facilities', 'Transport', ...teaching.slice(0, 3)])
    case 'Events':
      return pick(source, ['Administration', ...teaching])
    default:
      return pick(source, ['Administration', 'Facilities'])
  }
}

const CLAIMS: readonly [string, number, number][] = [
  ['Reference books for the department', 800, 3000],
  ['Lab consumables bought locally', 1200, 4500],
  ['Travel — district workshop', 1500, 5000],
  ['Sports kit for inter-school meet', 2000, 6000],
  ['Printing — question papers', 600, 2200],
  ['Art materials for annual day', 900, 3500],
  ['Auto fare — bank and stationery runs', 400, 1400],
]

const pad4 = (n: number) => String(n).padStart(4, '0')

/**
 * What a teacher costs the school in a month.
 *
 * A rough all-in figure for a private school in Karnataka, including PF. It
 * only has to be the right order of magnitude: what matters is that salaries
 * dominate the pie the way they dominate a real school's accounts, and that
 * the number moves when the faculty does.
 *
 * Sized so the year roughly balances against what the fee ledger collects.
 * A school runs a thin surplus; one whose costs exceed its fees by a crore
 * would have closed, and the dashboard's earnings chart said exactly that.
 */
const MONTHLY_COST_PER_TEACHER = 36000

/** Support staff the ledger pays but the faculty list does not hold. */
const SUPPORT_HEADCOUNT_RATIO = 0.4

export function generateExpenses(config: ExpenseConfig): ExpenseFixtures {
  const source = rng(`${config.code}:expenses:v2`)
  const { idPrefix } = config
  const expenses: Expense[] = []
  const teaching = [
    ...new Set(config.faculty.map(teacher => teacher.subject.split(' - ')[0].trim())),
  ]
  void SUPPORT_DEPARTMENTS

  let sequence = 0
  const nextId = () => `${idPrefix}EX-${pad4(5001 + sequence++)}`

  // ── Salaries: one disbursement a month for the last eight ──
  const headcount = Math.round(config.faculty.length * (1 + SUPPORT_HEADCOUNT_RATIO))
  for (let monthsAgo = 7; monthsAgo >= 0; monthsAgo -= 1) {
    const paid = dayInMonth(monthsAgo, 28)
    expenses.push({
      expenseId: nextId(),
      date: displayDate(paid),
      department: 'Administration',
      category: 'Salaries',
      description: `Staff salary disbursement — ${MONTH_SHORT_LABELS[paid.getMonth()]}`,
      quantity: headcount,
      // A little variance: arrears, a new joiner, a month with no increment.
      amount: Math.round((headcount * MONTHLY_COST_PER_TEACHER * bell(source, 0.97, 1.05)) / 100) * 100,
    })
  }

  // Consumables and standing contracts both scale with the roster; a school
  // of 441 burns more diesel and more chart paper than one of 317.
  const scale = Math.max(0.6, config.studentCount / 400)

  // ── The standing contracts, one bill a month each ──
  for (let monthsAgo = 7; monthsAgo >= 0; monthsAgo -= 1) {
    MONTHLY_COMMITMENTS.forEach(commitment => {
      const billed = dayInMonth(monthsAgo, int(source, 3, 24))
      expenses.push({
        expenseId: nextId(),
        date: displayDate(billed),
        department: commitment.department,
        category: commitment.category,
        description: `${commitment.description} (${MONTH_SHORT_LABELS[billed.getMonth()]})`,
        quantity: null,
        amount: Math.round((int(source, commitment.low, commitment.high) * scale) / 100) * 100,
      })
    })
  }

  // ── The occasional purchases ──
  const purchaseCount = Math.round(44 * scale)
  for (let i = 0; i < purchaseCount; i += 1) {
    const category = pick(source, ['Supplies', 'Supplies', 'Maintenance', 'Events', 'Others'] as const)
    const [description, low, high] = pick(source, PURCHASES[category])
    expenses.push({
      expenseId: nextId(),
      // Inside the eight months the trend chart covers, so the ledger's total
      // and the sum of its own trend are the same number.
      date: displayDate(dayInMonth(int(source, 0, 7), int(source, 1, 28))),
      department: bookedBy(source, category, teaching),
      category,
      description,
      // Only some purchases are counted in units — you buy fifteen
      // calculators, you do not buy fifteen electricity bills.
      quantity: category === 'Supplies' && chance(source, 0.6) ? int(source, 5, 60) : null,
      amount: Math.round((int(source, low, high) * scale) / 100) * 100,
    })
  }

  // Newest first, which is the order a ledger is read in.
  expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // ── Reimbursements: real staff, their own department ──
  // Distinct people, drawn by index rather than by shuffling with a random
  // comparator — that is not a shuffle, it is undefined behaviour that
  // usually looks like one.
  const claimantCount = int(source, 5, 8)
  const chosen = new Set<number>()
  while (chosen.size < Math.min(claimantCount, config.faculty.length)) {
    chosen.add(int(source, 0, config.faculty.length - 1))
  }
  const claimants = [...chosen].map(index => config.faculty[index])

  const reimbursements: Reimbursement[] = claimants.map((teacher, i) => {
    const [description, low, high] = pick(source, CLAIMS)
    const roll = source()
    return {
      requestId: `${idPrefix}RQ-${pad4(3001 + i)}`,
      staffName: teacher.fullName ?? teacher.displayName ?? teacher.teacherId,
      // Their own department, not one dealt from a list — the old rows put
      // Meera Iyer in 'Arts' while the faculty list had her teaching PE.
      department: teacher.subject.split(' - ')[0].trim(),
      amount: int(source, low, high),
      description,
      dateSubmitted: displayDate(relativeDate(-int(source, 1, 45))),
      proofUrl: '#',
      status: roll < 0.55 ? 'Approved' : roll < 0.85 ? 'Pending' : 'Declined',
    }
  })

  return {
    expenses,
    reimbursements,
    trend: trendOf(expenses),
    breakdown: breakdownOf(expenses),
  }
}

/**
 * Monthly totals, counted off the ledger.
 *
 * Eight months ending with this one, so the chart's last bar is the month you
 * are standing in. It used to be January through August regardless of when
 * you looked.
 */
function trendOf(expenses: readonly Expense[]): ExpenseTrendData[] {
  const now = new Date()
  return Array.from({ length: 8 }, (_, i) => {
    const month = new Date(now.getFullYear(), now.getMonth() - (7 - i), 1)
    const amount = expenses
      .filter(row => {
        const d = new Date(row.date)
        return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth()
      })
      .reduce((sum, row) => sum + row.amount, 0)
    return { month: MONTH_SHORT_LABELS[month.getMonth()], amount }
  })
}

/** Category totals and their share, counted off the same rows. */
function breakdownOf(expenses: readonly Expense[]): ExpenseBreakdownData[] {
  const order: ExpenseCategory[] = ['Salaries', 'Supplies', 'Maintenance', 'Events', 'Others']
  const total = expenses.reduce((sum, row) => sum + row.amount, 0)
  return order.map(category => {
    const amount = expenses
      .filter(row => row.category === category)
      .reduce((sum, row) => sum + row.amount, 0)
    return {
      category,
      amount,
      percentage: total === 0 ? 0 : Math.round((amount / total) * 100),
    }
  })
}
