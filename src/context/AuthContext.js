import { createContext, useState, useEffect, useContext } from 'react'
import { authAPI } from '../api/api'

const AuthContext = createContext()

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = () => {
        const token = localStorage.getItem('access_token')
        const storedUser = localStorage.getItem('user')

        if (token && storedUser) {
            setUser(JSON.parse(storedUser))
            setIsAuthenticated(true)
        } else {
            setUser(null)
            setIsAuthenticated(false)
        }
        setLoading(false)
    }

    const login = async (credentials) => {
        try {
            const response = await authAPI.login(credentials)
            const { access, refresh, user } = response.data

            localStorage.setItem('access_token', access)
            localStorage.setItem('refresh_token', refresh)
            localStorage.setItem('user', JSON.stringify(user))

            setUser(user)
            setIsAuthenticated(true)

            return { success: true }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.detail || 'Login failed'
            }
        }
    }

    const signup = async (userData) => {
        try {
            await authAPI.signup(userData)
            // Don't auto-login after signup - redirect to login page
            // User will need to verify email (future feature) before logging in
            return { success: true }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data || 'Signup failed'
            }
        }
    }

    const logout = () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')

        setUser(null)
        setIsAuthenticated(false)
    }

    const value = {
        user,
        loading,
        isAuthenticated,
        login,
        signup,
        logout,
        checkAuth
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
