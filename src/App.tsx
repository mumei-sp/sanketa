import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AppLayout } from './components/layout'
import { generateRoutesFromNavigation } from './config/routes'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: generateRoutesFromNavigation(),
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
