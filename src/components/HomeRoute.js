import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Landing from '../marketing/Landing'

/**
 * '/' is the public marketing landing page when logged out, and redirects
 * straight to the dashboard when logged in.
 */
function HomeRoute() {
    const { isAuthenticated, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-surface">
                <div className="text-center text-brand-ink/50">
                    <p>Loading...</p>
                </div>
            </div>
        )
    }

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />
    }

    return <Landing />
}

export default HomeRoute
