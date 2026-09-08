import { lazy } from 'react'
import { Navigate } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import { navigationItems, type NavItem, type LeafPaths } from './navigation'
import { RequirePermission } from '@/features/auth/components/RequirePermission'

/**
 * Every page is loaded on demand.
 *
 * Statically imported, all fifteen screens plus their charts, tables and form
 * schemas landed in one entry chunk — a phone opening the dashboard paid for
 * the transport charts, the grade sheet and the theme studio before it could
 * paint. Each page now becomes its own chunk that arrives when someone
 * actually navigates to it.
 *
 * `import()` needs a literal path Vite can see at build time, so these cannot
 * be generated from the navigation config — hence a line each, which the
 * `Record<LeafPaths, …>` below still forces to stay in step with navigation.
 */
const Dashboard = lazy(() => import('../pages/Dashboard'))
const Calendar = lazy(() => import('../pages/Calendar'))
const Teachers = lazy(() => import('../pages/Teachers'))
const Students = lazy(() => import('../pages/Students'))
const StudentPromotion = lazy(() => import('../pages/StudentPromotion'))
const Attendance = lazy(() => import('../pages/Attendance'))
const DailyAttendance = lazy(() => import('../pages/DailyAttendance'))
const Timetable = lazy(() => import('../pages/Timetable'))
const GradeEntry = lazy(() => import('../pages/GradeEntry'))
const GradeSheet = lazy(() => import('../pages/GradeSheet'))
const Assignments = lazy(() => import('../pages/Assignments'))
const FeesCollection = lazy(() => import('../pages/FeesCollection'))
const Expenses = lazy(() => import('../pages/Expenses'))
const NoticeBoard = lazy(() => import('../pages/NoticeBoard'))
const Transport = lazy(() => import('../pages/Transport'))

/**
 * Type-safe route configuration.
 * TypeScript will enforce that all leaf paths from navigation have corresponding components.
 *
 * If you add a new route to navigation, TypeScript will error here until you add the component.
 */
type RouteComponent = React.ComponentType | React.LazyExoticComponent<React.ComponentType>

const routeConfig: Record<LeafPaths<typeof navigationItems>, RouteComponent> = {
  '/': Dashboard,
  '/calendar': Calendar,
  '/teachers': Teachers,
  '/students/all': Students,
  '/students/promotion': StudentPromotion,
  '/attendance/overview': Attendance,
  '/attendance/daily': DailyAttendance,
  '/timetable': Timetable,
  '/grades/entry': GradeEntry,
  '/grades/sheet': GradeSheet,
  '/assignments': Assignments,
  '/finance/fees-collection': FeesCollection,
  '/finance/expenses': Expenses,
  '/notice-board': NoticeBoard,
  '/transport': Transport,
}

/**
 * Helper function to get component for a path with type safety
 */
function getComponent(path: string): RouteComponent | undefined {
  return routeConfig[path as LeafPaths<typeof navigationItems>]
}

/**
 * Converts a navigation item to a route object
 */
function navItemToRoute(navItem: NavItem): RouteObject | null {
  // Handle parent routes with children
  if (navItem.children && navItem.children.length > 0) {
    const children: RouteObject[] = []

    // Add index route that redirects to first child
    const firstChild = navItem.children[0]
    if (firstChild) {
      children.push({
        index: true,
        element: <Navigate to={firstChild.path} replace />,
      })
    }

    // Add child routes
    navItem.children.forEach(child => {
      const Component = getComponent(child.path)
      if (!Component) {
        console.warn(`No component found for child path: ${child.path}`)
        return
      }

      // Calculate relative path from parent
      const relativePath = child.path.replace(navItem.path, '').replace(/^\//, '')
      children.push(
        child.permission
          ? {
              path: relativePath,
              element: <RequirePermission permission={child.permission} />,
              children: [{ index: true, element: <Component /> }],
            }
          : { path: relativePath, element: <Component /> },
      )
    })

    return {
      path: navItem.path.replace(/^\//, ''), // Remove leading slash for relative path
      children,
    }
  }

  // Regular route with a component
  const Component = getComponent(navItem.path)
  if (!Component) {
    console.warn(`No component found for path: ${navItem.path}`)
    return null
  }

  // Handle index route (dashboard)
  // The dashboard is an index route, which cannot carry children, so its gate
  // wraps the element directly rather than becoming a layout route.
  if (navItem.path === '/') {
    return {
      index: true,
      element: navItem.permission ? (
        <RequirePermission permission={navItem.permission}>
          <Component />
        </RequirePermission>
      ) : (
        <Component />
      ),
    }
  }

  const path = navItem.path.replace(/^\//, '') // Remove leading slash for relative path
  return navItem.permission
    ? {
        path,
        element: <RequirePermission permission={navItem.permission} />,
        children: [{ index: true, element: <Component /> }],
      }
    : { path, element: <Component /> }
}

/**
 * Generates route objects from navigation configuration
 */
export function generateRoutesFromNavigation(): RouteObject[] {
  return navigationItems.map(navItemToRoute).filter((route): route is RouteObject => route !== null)
}
