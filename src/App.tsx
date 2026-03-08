import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { AppLayout } from './components/layout'
import { generateRoutesFromNavigation } from './config/routes'
import { AuthGuard, GuestGuard } from './features/auth/components/RouteGuards'
import AddStudent from './features/students/pages/AddStudent'
import EditStudent from './features/students/pages/EditStudent'
import StudentDetails from './features/students/pages/StudentDetails'
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
  return <RouterProvider router={router} />
}

export default App
