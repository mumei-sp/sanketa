import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AppLayout } from './components/layout'
import { generateRoutesFromNavigation } from './config/routes'
import AddStudent from './features/students/pages/AddStudent'

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
    ],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
