import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { SchoolConfigProvider } from '@/config/SchoolConfigContext'
import { Toaster } from './components/ui/sonner'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AppLayout } from './components/layout'
import { AuthRouteFallback } from './components/layout/RouteFallback'
import { generateRoutesFromNavigation } from './config/routes'
import { AuthGuard, GuestGuard } from './features/auth/components/RouteGuards'
import { RequirePermission } from './features/auth/components/RequirePermission'

/**
 * The shell — guards, layout, router — stays eager: it renders on every route,
 * so deferring it would only add a round trip before the first paint. The
 * screens behind it are all split (see `config/routes.tsx` for the rest).
 */
const NotificationsPage = lazy(() =>
  import('./features/notifications/pages/NotificationsPage').then(m => ({
    default: m.NotificationsPage,
  })),
)
const AddStudent = lazy(() => import('./features/students/pages/AddStudent'))
const EditStudent = lazy(() => import('./features/students/pages/EditStudent'))
const StudentDetails = lazy(() => import('./features/students/pages/StudentDetails'))
const TeacherDetails = lazy(() => import('./features/teachers/pages/TeacherDetails'))
const AddTeacher = lazy(() => import('./features/teachers/pages/AddTeacher'))
const EditTeacher = lazy(() => import('./features/teachers/pages/EditTeacher'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const NotFound = lazy(() => import('./pages/NotFound'))

const router = createBrowserRouter([
  // ── Auth routes (guest only — redirects to / if already logged in) ──
  {
    element: (
      <Suspense fallback={<AuthRouteFallback />}>
        <GuestGuard />
      </Suspense>
    ),
    children: [
      {
        path: '/login',
        element: <Login />,
      },
      {
        path: '/register',
        element: <Register />,
      },
    ],
  },

  // ── Protected app routes ──
  {
    element: <AuthGuard />,
    children: [
      {
        path: '/',
        element: <AppLayout />,
        children: [
          ...generateRoutesFromNavigation(),
          // Detail and form routes are not in the navigation config, so they
          // need their gates stated here. Reading a profile and editing one are
          // different permissions: a teacher can look up a student without
          // being able to change the record.
          // Everyone who can sign in has a notification feed, so this one
          // carries no permission of its own — the feed is already filtered to
          // what its reader is allowed to know about.
          { path: 'notifications', element: <NotificationsPage /> },
          {
            element: <RequirePermission permission="students.read" />,
            children: [{ path: 'students/details/:id', element: <StudentDetails /> }],
          },
          {
            element: <RequirePermission permission="students.create" />,
            children: [{ path: 'students/add', element: <AddStudent /> }],
          },
          {
            element: <RequirePermission permission="students.update" />,
            children: [{ path: 'students/edit/:id', element: <EditStudent /> }],
          },
          {
            element: <RequirePermission permission="teachers.read" />,
            children: [{ path: 'teachers/details/:id', element: <TeacherDetails /> }],
          },
          {
            element: <RequirePermission permission="teachers.manage" />,
            children: [
              { path: 'teachers/add', element: <AddTeacher /> },
              { path: 'teachers/edit/:id', element: <EditTeacher /> },
            ],
          },
        ],
      },
    ],
  },

  // ── 404 ──
  {
    path: '*',
    element: (
      <Suspense fallback={<AuthRouteFallback />}>
        <NotFound />
      </Suspense>
    ),
  },
])

function App() {
  return (
    <ErrorBoundary>
      <SchoolConfigProvider>
        <RouterProvider router={router} />
        <Toaster />
      </SchoolConfigProvider>
    </ErrorBoundary>
  )
}

export default App
