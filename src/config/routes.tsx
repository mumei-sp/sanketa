import { Navigate } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import { navigationItems, type NavItem, type LeafPaths } from './navigation'
import Dashboard from '../pages/Dashboard'
import Calendar from '../pages/Calendar'
import Teachers from '../pages/Teachers'
import Students from '../pages/Students'
import Attendance from '../pages/Attendance'
import DailyAttendance from '../pages/DailyAttendance'
import Assignments from '../pages/Assignments'
import FeesCollection from '../pages/FeesCollection'
import Expenses from '../pages/Expenses'
import NoticeBoard from '../pages/NoticeBoard'

/**
 * Type-safe route configuration.
 * TypeScript will enforce that all leaf paths from navigation have corresponding components.
 *
 * If you add a new route to navigation, TypeScript will error here until you add the component.
 */
const routeConfig: Record<LeafPaths<typeof navigationItems>, React.ComponentType> = {
  '/': Dashboard,
  '/calendar': Calendar,
  '/teachers': Teachers,
  '/students': Students,
  '/attendance/overview': Attendance,
  '/attendance/daily': DailyAttendance,
  '/assignments': Assignments,
  '/finance/fees-collection': FeesCollection,
  '/finance/expenses': Expenses,
  '/notice-board': NoticeBoard,
}

/**
 * Helper function to get component for a path with type safety
 */
function getComponent(path: string): React.ComponentType | undefined {
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
      children.push({
        path: relativePath,
        element: <Component />,
      })
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
  if (navItem.path === '/') {
    return {
      index: true,
      element: <Component />,
    }
  }

  return {
    path: navItem.path.replace(/^\//, ''), // Remove leading slash for relative path
    element: <Component />,
  }
}

/**
 * Generates route objects from navigation configuration
 */
export function generateRoutesFromNavigation(): RouteObject[] {
  return navigationItems.map(navItemToRoute).filter((route): route is RouteObject => route !== null)
}
