import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AppLayout } from './components/layout'
import { generateRoutesFromNavigation } from './config/routes'
import AddStudent from './features/students/pages/AddStudent'
import EditStudent from './features/students/pages/EditStudent'
import EditExtracurricular from './features/students/pages/EditExtracurricular'
import StudentDetails from './features/students/pages/StudentDetails'

const router = createBrowserRouter([
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
        path: 'students/details/:id/extracurricular/edit',
        element: <EditExtracurricular />,
      },
    ],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
