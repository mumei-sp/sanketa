import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { SchoolConfigProvider } from '@/config/SchoolConfigContext'
import { Toaster } from './components/ui/sonner'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AppLayout } from './components/layout'
import { AuthRouteFallback } from './components/layout/RouteFallback'
import { generateRoutesFromNavigation } from './config/routes'
import { AuthGuard, GuestGuard } from './features/auth/components/RouteGuards'

/**
 * The shell — guards, layout, router — stays eager: it renders on every route,
 * so deferring it would only add a round trip before the first paint. The
 * screens behind it are all split (see `config/routes.tsx` for the rest).
 */
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
          {
            path: 'students/add',
            element: <AddStudent />,
          },
          {
            path: 'students/edit/:id',
            element: <EditStudent />,
          },
          {
            path: 'students/details/:id',
            element: <StudentDetails />,
          },
          {
            path: 'teachers/add',
            element: <AddTeacher />,
          },
          {
            path: 'teachers/edit/:id',
            element: <EditTeacher />,
          },
          {
            path: 'teachers/details/:id',
            element: <TeacherDetails />,
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
