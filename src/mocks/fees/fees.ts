/**
 * The fee ledger.
 *
 * ── What this replaced ─────────────────────────────────────────────────
 * Ten students, hand-written, four categories each — forty rows for a school
 * of forty-one, so three quarters of the roster had never been billed. The
 * amounts were ₹1,200 for a term's tuition, which is a fortnight of tiffin;
 * the names and classes typed next to each row disagreed with the directory
 * nine times out of ten (harmless, since `resolveStudent` overrode both, and
 * misleading to anybody reading the file); and the collection totals, the
 * monthly trend and the per-category progress bars were three unrelated sets
 * of hardcoded numbers that did not add up to each other or to the rows.
 *
 * Now every student is billed, at amounts a Bangalore school actually charges,
 * and the stats are counted off the rows.
 *
 * ── Why families, not students, decide who pays ────────────────────────
 * A student's payment status is drawn from their *household*, so siblings are
 * in arrears together or paid up together. That is how fee books read — one
 * parent pays for both children on one day, or neither gets paid for — and it
 * is what makes the arrears list usable as a demo: the follow-up call is to a
 * family, not to a child.
 */

import type {
  FeeCategory,
  FeeTrendData,
  FeeProgressData,
  FeeCollectionRecord,
  PaymentTransaction,
  PaymentMethod,
  FeeStatus,
} from '@/features/fees-collection/types'
import { yyyymm, displayDate, relativeDate } from '@/mocks/_shared/date-helpers'
import { listStudents } from '@/mocks/students'
import { activeTenant } from '@/mocks/_shared/tenant-context'
import { rng, int, pick, chance, weighted } from '@/mocks/tenants/_generate/random'

// ============================================================================
// The fee structure
// ============================================================================

/**
 * One term's bill, in rupees.
 *
 * Tuition rises through the school, the way it does — a class 10 seat costs
 * more than a class 1 seat at the same school, because of the board year.
 * These are one term of three, which is how Indian schools bill.
 */
function termBill(grade: number): Record<FeeCategory, number> {
  const tuition = 15000 + grade * 900
  return {
    'Tuition Fee': tuition,
    'Books & Supplies': grade <= 5 ? 2400 : 3600,
    Activities: 1800 + (grade >= 6 ? 600 : 0),
    Miscellaneous: 900,
  }
}

const CATEGORIES: readonly FeeCategory[] = [
  'Tuition Fee',
  'Books & Supplies',
  'Activities',
  'Miscellaneous',
]

/**
 * How a household pays.
 *
 * The point of the spread is the tail. A ledger where everything is settled
 * has no arrears screen to build, and one where everything is overdue is a
 * school that would have closed; what a bursar actually has is a large
 * majority who pay on the first reminder and a stubborn tenth who do not.
 */
const PAYERS = [
  { kind: 'prompt', weight: 46 },
  { kind: 'ontime', weight: 28 },
  { kind: 'slow', weight: 17 },
  { kind: 'arrears', weight: 9 },
] as const

type PayerKind = (typeof PAYERS)[number]['kind']

const METHODS: readonly PaymentMethod[] = ['online', 'online', 'online', 'bank_transfer', 'cash', 'cheque']

/** What one household does about one category. */
function statusFor(kind: PayerKind, category: FeeCategory, source: () => number): FeeStatus {
  switch (kind) {
    case 'prompt':
      return 'Paid'
    case 'ontime':
      // Tuition first, always. The rest follows when somebody remembers.
      if (category === 'Tuition Fee') return 'Paid'
      return chance(source, 0.6) ? 'Paid' : 'Pending'
    case 'slow':
      if (category === 'Tuition Fee') return chance(source, 0.5) ? 'Partially Paid' : 'Pending'
      return chance(source, 0.35) ? 'Paid' : 'Pending'
    case 'arrears':
      if (category === 'Tuition Fee') return 'Overdue'
      return chance(source, 0.5) ? 'Overdue' : 'Pending'
  }
}

// ============================================================================
// Generation
// ============================================================================

let txnCounter = 0
function nextTxnId(): string { return `TXN-${yyyymm()}-${String(++txnCounter).padStart(4, '0')}` }
function nextReceiptId(): string { return `REC-${yyyymm()}-${String(txnCounter).padStart(4, '0')}` }

/**
 * Which household a student belongs to, for the purposes of paying.
 *
 * The primary guardian's number, which is what the parents table matches
 * siblings on too. Falling back to the student's own code means an orphan
 * record is its own household rather than joining a phantom one.
 */
function householdKey(student: { guardians?: { father?: { phone?: string }; mother?: { phone?: string } }; studentId: string }): string {
  return student.guardians?.father?.phone ?? student.guardians?.mother?.phone ?? student.studentId
}

function build(): FeeCollectionRecord[] {
  const roster = listStudents()
  const source = rng(`${activeTenant()}:fees:v1`)

  // One payer kind per household, decided once and shared by its children.
  const payers = new Map<string, PayerKind>()
  const dueOffsets = new Map<string, number>()
  roster.forEach(student => {
    const key = householdKey(student)
    if (payers.has(key)) return
    payers.set(key, weighted(source, PAYERS).kind)
    // A family's four bills fall in one window — the school raises them
    // together — scattered across the quarter so the ledger is never all due
    // on one day.
    dueOffsets.set(key, int(source, -40, 45))
  })

  const rows: FeeCollectionRecord[] = []

  roster.forEach(student => {
    const key = householdKey(student)
    const kind = payers.get(key) ?? 'ontime'
    const dueOffset = dueOffsets.get(key) ?? 0
    const bill = termBill(Number(student.gradeLevel ?? 1))
    const name =
      student.fullName ||
      student.displayName ||
      student.name ||
      [student.firstName, student.lastName].filter(Boolean).join(' ')

    CATEGORIES.forEach((category, index) => {
      const status = statusFor(kind, category, source)
      const due = relativeDate(dueOffset + index * 4)
      const record: FeeCollectionRecord = {
        studentId: student.studentId,
        studentName: name,
        class: student.class ?? `${student.gradeLevel}${student.section}`,
        feeCategory: category,
        totalAmount: bill[category],
        dueDate: displayDate(due),
        status,
      }

      if (status === 'Paid') {
        record.paidAmount = bill[category]
        // Paid a few days before it was due, which is what a bank mandate or
        // a parent with a reminder looks like.
        record.paidDate = displayDate(relativeDate(dueOffset + index * 4 - int(source, 1, 9)))
        record.paymentMethod = pick(source, METHODS)
        record.transactionId = nextTxnId()
        record.receiptId = nextReceiptId()
      } else if (status === 'Partially Paid') {
        // Part paid means part paid: a figure, not a flag. Without it the
        // outstanding column reads as the whole bill on a family that has
        // already handed over half of it.
        record.paidAmount = Math.round((bill[category] * int(source, 30, 70)) / 100 / 100) * 100
        record.paidDate = displayDate(relativeDate(dueOffset + index * 4 - int(source, 1, 6)))
        record.paymentMethod = pick(source, METHODS)
      }

      rows.push(record)
    })
  })

  return rows
}

// ============================================================================
// Fee Collection Records (mutable)
// ============================================================================

export const feeCollectionData: FeeCollectionRecord[] = build()

// ============================================================================
// Payment Transactions (mutable — built from paid records)
// ============================================================================

export const paymentTransactions: PaymentTransaction[] = feeCollectionData
  .filter(r => r.status === 'Paid' && r.transactionId)
  .map(r => ({
    id: r.transactionId!,
    studentId: r.studentId,
    studentName: r.studentName,
    class: r.class,
    feeCategory: r.feeCategory,
    amount: r.totalAmount,
    method: r.paymentMethod!,
    status: 'success' as const,
    transactionId: r.transactionId!,
    paidDate: r.paidDate!,
    receiptId: r.receiptId!,
  }))

// ============================================================================
// Dashboard aggregates — counted, not typed
// ============================================================================

/**
 * What the school has actually banked.
 *
 * `paidAmount`, not `totalAmount` of the paid rows — the two differ by every
 * part payment in the ledger, and the stat tiles were reading the second.
 */
const collectedTotal = feeCollectionData.reduce((sum, r) => sum + (r.paidAmount ?? 0), 0)

/**
 * Monthly collection through the academic year.
 *
 * Shaped rather than flat: the year's money arrives in the three months a
 * school raises its term bills — April, August and December — and the months
 * between are stragglers and instalments. A flat twelfth per month is the
 * chart that gives away that nobody modelled a term.
 */
const MONTH_SHARE: readonly [string, number][] = [
  ['Apr', 0.19], ['May', 0.06], ['Jun', 0.05], ['Jul', 0.04],
  ['Aug', 0.17], ['Sep', 0.06], ['Oct', 0.05], ['Nov', 0.04],
  ['Dec', 0.16], ['Jan', 0.07], ['Feb', 0.06], ['Mar', 0.05],
]

export const feeTrendData: FeeTrendData[] = MONTH_SHARE.map(([month, share]) => ({
  month,
  // × 3, because the ledger above holds one term of three and the trend is
  // the whole year.
  amount: Math.round((collectedTotal * 3 * share) / 1000) * 1000,
}))

export const feeProgressData: FeeProgressData[] = CATEGORIES.map(category => {
  const rows = feeCollectionData.filter(r => r.feeCategory === category)
  const total = rows.reduce((sum, r) => sum + r.totalAmount, 0)
  const collected = rows.reduce((sum, r) => sum + (r.paidAmount ?? 0), 0)
  return {
    category,
    percentage: total === 0 ? 0 : Math.round((collected / total) * 1000) / 10,
    collected,
    total,
    color: 'var(--heading)',
  }
})

// ============================================================================
// Lookup helpers (for service layer)
// ============================================================================

export function findFeeRecord(studentId: string, feeCategory: string): FeeCollectionRecord | undefined {
  return feeCollectionData.find(r => r.studentId === studentId && r.feeCategory === feeCategory)
}
