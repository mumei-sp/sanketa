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
  ArrowUpCircle,
  Bus,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { Permission } from "./permissions"

export interface NavItem {
  title: string
  icon: LucideIcon
  path: string
  /**
   * What a user must hold to see and open this item.
   *
   * Parents carry none of their own: a group is worth showing exactly when one
   * of its children is, so `visibleNavigationItems` derives that rather than
   * making every parent restate the union of its children.
   */
  permission?: Permission
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
    permission: "dashboard.view",
  },
  {
    title: "Calendar",
    icon: Calendar,
    path: "/calendar",
    permission: "calendar.view",
  },
  {
    title: "Teachers",
    icon: BookOpen,
    path: "/teachers",
    permission: "teachers.view",
  },
  {
    title: "Students",
    icon: Users,
    path: "/students",
    children: [
      {
        title: "All Students",
        icon: Users,
        path: "/students/all",
        permission: "students.view",
      },
      {
        title: "Promotion",
        icon: ArrowUpCircle,
        path: "/students/promotion",
        permission: "students.promote",
      },
    ],
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
        permission: "attendance.view",
      },
      {
        title: "Daily",
        icon: CalendarCheck,
        path: "/attendance/daily",
        permission: "attendance.mark",
      },
    ],
  },
  {
    title: "Timetable",
    icon: Clock,
    path: "/timetable",
    permission: "timetable.view",
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
        permission: "grades.enter",
      },
      {
        title: "Grade Sheet",
        icon: FileSpreadsheet,
        path: "/grades/sheet",
        permission: "grades.view",
      },
    ],
  },
  {
    title: "Assignments",
    icon: ClipboardList,
    path: "/assignments",
    permission: "assignments.view",
  },
  {
    title: "Transport",
    icon: Bus,
    path: "/transport",
    permission: "transport.view",
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
        permission: "finance.view",
      },
      {
        title: "Expenses",
        icon: TrendingUp,
        path: "/finance/expenses",
        permission: "finance.view",
      },
    ],
  },
  {
    title: "Notice Board",
    icon: FileText,
    path: "/notice-board",
    permission: "notices.view",
  },
]

export const ChevronDownIcon = ChevronDown

/**
 * The navigation a given user should see.
 *
 * A parent survives when any of its children do, and is dropped entirely when
 * none survive — a "Finance" group that opens onto nothing is worse than no
 * group at all.
 */
export function visibleNavigationItems(
  items: NavItem[],
  can: (permission: Permission) => boolean,
): NavItem[] {
  return items.reduce<NavItem[]>((visible, item) => {
    if (item.children?.length) {
      const children = item.children.filter(child => !child.permission || can(child.permission))
      if (children.length > 0) visible.push({ ...item, children })
      return visible
    }
    if (!item.permission || can(item.permission)) visible.push(item)
    return visible
  }, [])
}
