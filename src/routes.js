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
        element: <ProtectedRoute permission="dashboard"><Home /></ProtectedRoute>
    },
    {
        path: '/sales',
        element: <ProtectedRoute permission="pos"><Sales /></ProtectedRoute>
    },
    {
        path: '/transactions',
        element: <ProtectedRoute permission="pos"><Transactions /></ProtectedRoute>
    },
    {
        path: '/inventory',
        element: <ProtectedRoute permission="inventory"><Inventory /></ProtectedRoute>
    },
    {
        path: '/customers',
        element: <ProtectedRoute permission="customers"><Customers /></ProtectedRoute>
    },
    {
        path: '/reports',
        element: <ProtectedRoute permission="reports"><Reports /></ProtectedRoute>
    },
    {
        path: '/profile',
        element: <ProtectedRoute><Profile /></ProtectedRoute>
    },
    {
        path: '/settings',
        element: <ProtectedRoute permission="settings"><Settings /></ProtectedRoute>
    }
]

export default routes;