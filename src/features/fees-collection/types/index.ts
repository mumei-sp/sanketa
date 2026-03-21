export type FeeCategory = 'Tuition Fee' | 'Books & Supplies' | 'Activities' | 'Miscellaneous'
export type FeeStatus = 'Paid' | 'Pending' | 'Partially Paid' | 'Overdue'

export interface FeeStat {
  label: string
  value: number
  icon: import('lucide-react').LucideIcon
  iconBg: string
  iconColor: string
}

export interface FeeTrendData {
  month: string
  amount: number
}

export interface FeeProgressData {
  category: FeeCategory
  percentage: number
  collected: number
  total: number
  color: string
}

export interface FeeCollectionRecord {
  studentId: string
  studentName: string
  class: string
  feeCategory: FeeCategory
  totalAmount: number
  dueDate: string
  status: FeeStatus
}
