import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePermissions } from '../hooks/usePermissions'

/**
 * ProtectedRoute component that checks both authentication and permissions
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - The component to render if authorized
 * @param {string} props.permission - The permission required (dashboard, pos, inventory, customers, reports, settings)
 * @param {string} props.redirectTo - Where to redirect if unauthorized (default: based on role)
 */
function ProtectedRoute({ children, permission, redirectTo }) {
    const { isAuthenticated, loading, currentShop, user } = useAuth()
    const permissions = usePermissions()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-surface">
                <div className="text-center text-brand-ink/50">
                    <p>Loading...</p>
                </div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    if (user && user.email_verified === false) {
        return <Navigate to="/verify-email" replace />
    }

    // If no shop is selected and not on profile/create-shop page, redirect to profile
    if (!currentShop && permission) {
        return <Navigate to="/profile" replace />
    }

    // If permission is specified, check it
    if (permission && !permissions.hasPermission(permission)) {
        // Determine where to redirect based on role
        const defaultRedirect = getDefaultRouteForRole(permissions)
        return <Navigate to={redirectTo || defaultRedirect} replace />
    }

    return children
}

/**
 * Get the default route for a user's role
 */
function getDefaultRouteForRole(permissions) {
    if (permissions.canAccessDashboard) return '/dashboard'
    if (permissions.canAccessPOS) return '/sales'
    if (permissions.canAccessInventory) return '/inventory'
    return '/profile'
}

/**
 * AccessDenied component to show when user doesn't have permission
 */
export function AccessDenied({ message }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-brand-surface font-sans text-brand-ink">
            <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-sm">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#c8553d]/10 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-[#c8553d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                </div>
                <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
                <p className="text-brand-ink/60 mb-6">
                    {message || "You don't have permission to access this page."}
                </p>
                <a
                    href="/dashboard"
                    className="inline-block px-4 py-2.5 bg-brand-ink text-brand-surface rounded-xl hover:bg-brand-ink/90 transition-colors font-semibold"
                >
                    Go to Home
                </a>
            </div>
        </div>
    )
}

export default ProtectedRoute
