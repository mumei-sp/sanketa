import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { SchoolConfigProvider } from './config/SchoolConfigContext'
import { Toaster } from './components/ui/sonner'
import { AppLayout } from './components/layout'
import { generateRoutesFromNavigation } from './config/routes'
import { AuthGuard, GuestGuard } from './features/auth/components/RouteGuards'
import AddStudent from './features/students/pages/AddStudent'
import EditStudent from './features/students/pages/EditStudent'
import StudentDetails from './features/students/pages/StudentDetails'
import TeacherDetails from './features/teachers/pages/TeacherDetails'
import AddTeacher from './features/teachers/pages/AddTeacher'
import EditTeacher from './features/teachers/pages/EditTeacher'
import Login from './pages/Login'
import Register from './pages/Register'

const router = createBrowserRouter([
  // ── Auth routes (guest only — redirects to / if already logged in) ──
  {
    element: <GuestGuard />,
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

  // ── Fallback ──
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
])

function App() {
  return (
    <SchoolConfigProvider>
      <RouterProvider router={router} />
      <Toaster />
    </SchoolConfigProvider>
  )
}

export default App
