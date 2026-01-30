import Home from "./pages/Home"
import Sales from "./pages/Sales"
import Transactions from "./pages/Transactions"
import Inventory from "./pages/Inventory"
import Customers from "./pages/Customers"
import Reports from "./pages/Reports"
import Settings from "./pages/Settings"
import Profile from "./pages/Profile"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import CreateShop from "./pages/CreateShop"
import ProtectedRoute from "./components/ProtectedRoute"

const routes = [
    {
        path: '/login',
        element: <Login />
    },
    {
        path: '/signup',
        element: <Signup />
    },
    {
        path: '/create-shop',
        element: <ProtectedRoute><CreateShop /></ProtectedRoute>
    },
    {
        path: '/',
        element: <ProtectedRoute><Home /></ProtectedRoute>
    },
    {
        path: '/sales',
        element: <ProtectedRoute><Sales /></ProtectedRoute>
    },
    {
        path: '/transactions',
        element: <ProtectedRoute><Transactions /></ProtectedRoute>
    },
    {
        path: '/inventory',
        element: <ProtectedRoute><Inventory /></ProtectedRoute>
    },
    {
        path: '/customers',
        element: <ProtectedRoute><Customers /></ProtectedRoute>
    },
    {
        path: '/reports',
        element: <ProtectedRoute><Reports /></ProtectedRoute>
    },
    {
        path: '/profile',
        element: <ProtectedRoute><Profile /></ProtectedRoute>
    },
    {
        path: '/settings',
        element: <ProtectedRoute><Settings /></ProtectedRoute>
    }
]

export default routes;