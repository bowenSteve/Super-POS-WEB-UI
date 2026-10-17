import Home from "./pages/Home"
import Sales from "./pages/Sales"
import Transactions from "./pages/Transactions"
import Inventory from "./pages/Inventory"
import Customers from "./pages/Customers"
import Reports from "./pages/Reports"
import Settings from "./pages/Settings"
import Profile from "./pages/Profile"
import CreateShop from "./pages/CreateShop"
import AuthCallback from "./pages/AuthCallback"
import VerifyEmail from "./pages/VerifyEmail"
import AcceptInvite from "./pages/AcceptInvite"
import SuperAdmin from "./pages/SuperAdmin"
import ProtectedRoute from "./components/ProtectedRoute"
import HomeRoute from "./components/HomeRoute"
import MarketingPages from "./marketing/Pages"
import MarketingAuth from "./marketing/MarketingAuth"

const routes = [
    // Public marketing site - '/' shows Landing when logged out, otherwise
    // redirects straight to '/dashboard'.
    {
        path: '/',
        element: <HomeRoute />
    },
    {
        path: '/product',
        element: <MarketingPages section="product" />
    },
    {
        path: '/multi-store',
        element: <MarketingPages section="multistore" />
    },
    {
        path: '/pricing',
        element: <MarketingPages section="pricing" />
    },
    {
        path: '/customer-stories',
        element: <MarketingPages section="customers" />
    },
    {
        path: '/login',
        element: <MarketingAuth mode="login" />
    },
    {
        path: '/signup',
        element: <MarketingAuth mode="signup" />
    },
    {
        path: '/auth/callback',
        element: <AuthCallback />
    },
    {
        path: '/verify-email',
        element: <VerifyEmail />
    },
    {
        path: '/accept-invite',
        element: <AcceptInvite />
    },
    {
        path: '/super-admin',
        element: <SuperAdmin />
    },
    {
        path: '/create-shop',
        element: <ProtectedRoute><CreateShop /></ProtectedRoute>
    },
    {
        path: '/dashboard',
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
