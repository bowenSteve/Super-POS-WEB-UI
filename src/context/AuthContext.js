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
    const [shops, setShops] = useState([])
    const [currentShop, setCurrentShop] = useState(null)
    const [loadingShops, setLoadingShops] = useState(false)

    useEffect(() => {
        checkAuth()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const checkAuth = async () => {
        const token = localStorage.getItem('access_token')
        const storedUser = localStorage.getItem('user')
        const storedShop = localStorage.getItem('current_shop')

        if (token && storedUser) {
            setUser(JSON.parse(storedUser))
            setIsAuthenticated(true)

            if (storedShop) {
                try {
                    const parsedShop = JSON.parse(storedShop)
                    // Validate shop structure - must have id, name, and role
                    if (parsedShop && parsedShop.id && parsedShop.name && parsedShop.role) {
                        setCurrentShop(parsedShop)
                    } else {
                        // Invalid structure, clear it
                        localStorage.removeItem('current_shop')
                        setCurrentShop(null)
                    }
                } catch (e) {
                    // Invalid JSON, clear it
                    localStorage.removeItem('current_shop')
                    setCurrentShop(null)
                }
            }

            // Fetch user's shops
            await fetchUserShops()
        } else {
            setUser(null)
            setIsAuthenticated(false)
        }
        setLoading(false)
    }

    const fetchUserShops = async () => {
        try {
            setLoadingShops(true)
            const response = await authAPI.get('/shops/my_shops/')
            const userShops = response.data
            setShops(userShops)

            // If no current shop is set but user has shops, set the first one
            const storedShop = localStorage.getItem('current_shop')
            if (!storedShop && userShops.length > 0) {
                const firstShop = {
                    id: userShops[0].shop.id,
                    name: userShops[0].shop.name,
                    role: userShops[0].role
                }
                setCurrentShop(firstShop)
                localStorage.setItem('current_shop', JSON.stringify(firstShop))
            }
        } catch (error) {
            console.error('Failed to fetch shops:', error)
        } finally {
            setLoadingShops(false)
        }
    }

    const switchShop = (shop) => {
        const shopData = {
            id: shop.shop?.id || shop.id,
            name: shop.shop?.name || shop.name,
            role: shop.role
        }
        setCurrentShop(shopData)
        localStorage.setItem('current_shop', JSON.stringify(shopData))
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

            // Fetch user's shops after successful login
            await fetchUserShops()

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
        localStorage.removeItem('current_shop')

        setUser(null)
        setIsAuthenticated(false)
        setShops([])
        setCurrentShop(null)
    }

    const value = {
        user,
        loading,
        isAuthenticated,
        login,
        signup,
        logout,
        checkAuth,
        shops,
        currentShop,
        loadingShops,
        switchShop,
        fetchUserShops
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
