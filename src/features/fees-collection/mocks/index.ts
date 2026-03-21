import { CircleCheckBig, CircleDashed, OctagonAlert } from 'lucide-react'
import { baseColors, status } from '@/theme/colors'
import type {
  FeeStat,
  FeeTrendData,
  FeeProgressData,
  FeeCollectionRecord,
} from '../types'

export const feeStats: FeeStat[] = [
  {
    label: 'Fees Collected',
    value: 92500,
    icon: CircleCheckBig,
    iconBg: baseColors.heading,
    iconColor: '#FFFFFF',
  },
  {
    label: 'Pending Fees',
    value: 12300,
    icon: CircleDashed,
    iconBg: baseColors.blue,
    iconColor: baseColors.heading,
  },
  {
    label: 'Overdue Payments',
    value: 4750,
    icon: OctagonAlert,
    iconBg: baseColors.pink,
    iconColor: baseColors.heading,
  },
]

export const feeTrendData: FeeTrendData[] = [
  { month: 'Apr', amount: 68000 },
  { month: 'May', amount: 72000 },
  { month: 'Jun', amount: 65000 },
  { month: 'Jul', amount: 78000 },
  { month: 'Aug', amount: 82000 },
  { month: 'Sep', amount: 75000 },
  { month: 'Oct', amount: 88000 },
  { month: 'Nov', amount: 91000 },
  { month: 'Dec', amount: 85000 },
  { month: 'Jan', amount: 93000 },
  { month: 'Feb', amount: 89000 },
  { month: 'Mar', amount: 92500 },
]

export const feeProgressData: FeeProgressData[] = [
  {
    category: 'Tuition Fee',
    percentage: 87.5,
    collected: 70000,
    total: 80000,
    color: baseColors.heading,
  },
  {
    category: 'Books & Supplies',
    percentage: 87.5,
    collected: 10500,
    total: 12000,
    color: baseColors.heading,
  },
  {
    category: 'Activities',
    percentage: 90,
    collected: 7200,
    total: 8000,
    color: baseColors.heading,
  },
  {
    category: 'Miscellaneous',
    percentage: 86.5,
    collected: 4800,
    total: 5550,
    color: baseColors.heading,
  },
]

// Helper to generate 4 fee rows per student
function studentFees(
  id: string,
  name: string,
  cls: string,
  fees: {
    tuition: { amount: number; date: string; status: FeeCollectionRecord['status'] }
    books: { amount: number; date: string; status: FeeCollectionRecord['status'] }
    activities: { amount: number; date: string; status: FeeCollectionRecord['status'] }
    misc: { amount: number; date: string; status: FeeCollectionRecord['status'] }
  },
): FeeCollectionRecord[] {
  return [
    { studentId: id, studentName: name, class: cls, feeCategory: 'Tuition Fee', totalAmount: fees.tuition.amount, dueDate: fees.tuition.date, status: fees.tuition.status },
    { studentId: id, studentName: name, class: cls, feeCategory: 'Books & Supplies', totalAmount: fees.books.amount, dueDate: fees.books.date, status: fees.books.status },
    { studentId: id, studentName: name, class: cls, feeCategory: 'Activities', totalAmount: fees.activities.amount, dueDate: fees.activities.date, status: fees.activities.status },
    { studentId: id, studentName: name, class: cls, feeCategory: 'Miscellaneous', totalAmount: fees.misc.amount, dueDate: fees.misc.date, status: fees.misc.status },
  ]
}

export const feeCollectionData: FeeCollectionRecord[] = [
  // Student 1
  ...studentFees('S-2101', 'Michael Chen', '7A', {
    tuition: { amount: 1200, date: 'Mar 15, 2035', status: 'Paid' },
    books: { amount: 250, date: 'Mar 20, 2035', status: 'Pending' },
    activities: { amount: 300, date: 'Mar 25, 2035', status: 'Paid' },
    misc: { amount: 150, date: 'Mar 30, 2035', status: 'Partially Paid' },
  }),
  // Student 2
  ...studentFees('S-2102', 'Emma Williams', '7B', {
    tuition: { amount: 1200, date: 'Mar 12, 2035', status: 'Partially Paid' },
    books: { amount: 200, date: 'Mar 18, 2035', status: 'Paid' },
    activities: { amount: 250, date: 'Mar 20, 2035', status: 'Pending' },
    misc: { amount: 100, date: 'Mar 28, 2035', status: 'Paid' },
  }),
  // Student 3
  ...studentFees('S-2103', 'Rajesh Kumar', '7A', {
    tuition: { amount: 1200, date: 'Mar 10, 2035', status: 'Paid' },
    books: { amount: 280, date: 'Mar 14, 2035', status: 'Paid' },
    activities: { amount: 300, date: 'Mar 18, 2035', status: 'Paid' },
    misc: { amount: 120, date: 'Mar 22, 2035', status: 'Paid' },
  }),
  // Student 4
  ...studentFees('S-2104', 'Priya Sharma', '7C', {
    tuition: { amount: 1200, date: 'Mar 8, 2035', status: 'Overdue' },
    books: { amount: 230, date: 'Mar 12, 2035', status: 'Pending' },
    activities: { amount: 280, date: 'Mar 16, 2035', status: 'Pending' },
    misc: { amount: 180, date: 'Mar 20, 2035', status: 'Overdue' },
  }),
  // Student 5
  ...studentFees('S-2105', 'Hannah Lee', '8A', {
    tuition: { amount: 1350, date: 'Mar 5, 2035', status: 'Paid' },
    books: { amount: 220, date: 'Mar 10, 2035', status: 'Partially Paid' },
    activities: { amount: 300, date: 'Mar 15, 2035', status: 'Pending' },
    misc: { amount: 160, date: 'Mar 20, 2035', status: 'Paid' },
  }),
  // Student 6
  ...studentFees('S-2106', 'Arjun Patel', '8A', {
    tuition: { amount: 1350, date: 'Mar 7, 2035', status: 'Paid' },
    books: { amount: 240, date: 'Mar 12, 2035', status: 'Paid' },
    activities: { amount: 320, date: 'Mar 17, 2035', status: 'Paid' },
    misc: { amount: 140, date: 'Mar 22, 2035', status: 'Pending' },
  }),
  // Student 7
  ...studentFees('S-2107', 'Sophia Martinez', '8B', {
    tuition: { amount: 1350, date: 'Mar 6, 2035', status: 'Partially Paid' },
    books: { amount: 260, date: 'Mar 11, 2035', status: 'Overdue' },
    activities: { amount: 290, date: 'Mar 16, 2035', status: 'Paid' },
    misc: { amount: 170, date: 'Mar 21, 2035', status: 'Paid' },
  }),
  // Student 8
  ...studentFees('S-2108', 'Ananya Gupta', '7B', {
    tuition: { amount: 1200, date: 'Mar 9, 2035', status: 'Paid' },
    books: { amount: 210, date: 'Mar 14, 2035', status: 'Paid' },
    activities: { amount: 270, date: 'Mar 19, 2035', status: 'Partially Paid' },
    misc: { amount: 130, date: 'Mar 24, 2035', status: 'Paid' },
  }),
  // Student 9
  ...studentFees('S-2109', 'Thomas Green', '7C', {
    tuition: { amount: 1200, date: 'Mar 11, 2035', status: 'Pending' },
    books: { amount: 245, date: 'Mar 16, 2035', status: 'Pending' },
    activities: { amount: 310, date: 'Mar 21, 2035', status: 'Paid' },
    misc: { amount: 155, date: 'Mar 26, 2035', status: 'Overdue' },
  }),
  // Student 10
  ...studentFees('S-2110', 'Neha Reddy', '8B', {
    tuition: { amount: 1350, date: 'Mar 4, 2035', status: 'Paid' },
    books: { amount: 255, date: 'Mar 9, 2035', status: 'Paid' },
    activities: { amount: 300, date: 'Mar 14, 2035', status: 'Paid' },
    misc: { amount: 145, date: 'Mar 19, 2035', status: 'Paid' },
  }),
]
