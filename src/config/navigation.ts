import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  Users,
  UserCheck,
  ClipboardList,
  DollarSign,
  FileText,
  ChevronDown,
  Receipt,
  TrendingUp,
  BarChart3,
  CalendarCheck,
  Clock,
  ClipboardCheck,
  PenLine,
  FileSpreadsheet,
  ScrollText,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface NavItem {
  title: string
  icon: LucideIcon
  path: string
  children?: NavItem[]
}

/**
 * Helper type to extract all paths from navigation items (including nested children)
 */
export type ExtractPaths<T extends readonly NavItem[]> = T[number] extends infer Item
  ? Item extends NavItem
  ? Item['path'] | (Item['children'] extends readonly NavItem[] ? ExtractPaths<Item['children']> : never)
  : never
  : never

/**
 * Helper type to get all leaf paths (paths that have components, not just parent routes)
 */
export type LeafPaths<T extends readonly NavItem[]> = T[number] extends infer Item
  ? Item extends NavItem
  ? Item['children'] extends readonly NavItem[]
  ? ExtractPaths<Item['children']>
  : Item['path']
  : never
  : never

export const navigationItems: NavItem[] = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/",
  },
  {
    title: "Calendar",
    icon: Calendar,
    path: "/calendar",
  },
  {
    title: "Teachers",
    icon: BookOpen,
    path: "/teachers",
  },
  {
    title: "Students",
    icon: Users,
    path: "/students",
  },
  {
    title: "Attendance",
    icon: UserCheck,
    path: "/attendance",
    children: [
      {
        title: "Overview",
        icon: BarChart3,
        path: "/attendance/overview",
      },
      {
        title: "Daily",
        icon: CalendarCheck,
        path: "/attendance/daily",
      },
    ],
  },
  {
    title: "Timetable",
    icon: Clock,
    path: "/timetable",
  },
  {
    title: "Grades",
    icon: ClipboardCheck,
    path: "/grades",
    children: [
      {
        title: "Grade Entry",
        icon: PenLine,
        path: "/grades/entry",
      },
      {
        title: "Grade Sheet",
        icon: FileSpreadsheet,
        path: "/grades/sheet",
      },
      {
        title: "Report Card",
        icon: ScrollText,
        path: "/grades/report-card",
      },
    ],
  },
  {
    title: "Assignments",
    icon: ClipboardList,
    path: "/assignments",
  },
  {
    title: "Finance",
    icon: DollarSign,
    path: "/finance",
    children: [
      {
        title: "Fees Collection",
        icon: Receipt,
        path: "/finance/fees-collection",
      },
      {
        title: "Expenses",
        icon: TrendingUp,
        path: "/finance/expenses",
      },
    ],
  },
  {
    title: "Notice Board",
    icon: FileText,
    path: "/notice-board",
  },
]

export const ChevronDownIcon = ChevronDown
