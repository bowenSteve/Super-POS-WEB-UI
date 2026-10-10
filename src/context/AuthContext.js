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
                    slug: userShops[0].shop.slug,
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
            slug: shop.shop?.slug || shop.slug,
            role: shop.role
        }
        setCurrentShop(shopData)
        localStorage.setItem('current_shop', JSON.stringify(shopData))
    }

    // Update current shop with new data (preserves role from membership)
    const updateCurrentShop = (updatedShopData) => {
        if (!currentShop) return

        const updatedShop = {
            ...currentShop,
            ...updatedShopData,
            // Always preserve the role from membership
            role: currentShop.role
        }
        setCurrentShop(updatedShop)
        localStorage.setItem('current_shop', JSON.stringify(updatedShop))
    }

    const login = async (credentials) => {
        try {
            const deviceToken = localStorage.getItem('device_token')
            const response = await authAPI.login({
                ...credentials,
                ...(deviceToken ? { device_token: deviceToken } : {}),
            })

            if (response.data.otp_required) {
                return { success: false, otpRequired: true, loginToken: response.data.login_token }
            }

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

    // Second step of login after the email code is sent (see login() above).
    const verifyLoginOtp = async (loginToken, code, rememberMe) => {
        try {
            const response = await authAPI.verifyLoginOtp(loginToken, code, rememberMe)
            const { access, refresh, user, device_token: deviceToken } = response.data

            localStorage.setItem('access_token', access)
            localStorage.setItem('refresh_token', refresh)
            localStorage.setItem('user', JSON.stringify(user))
            if (deviceToken) {
                localStorage.setItem('device_token', deviceToken)
            }

            setUser(user)
            setIsAuthenticated(true)

            await fetchUserShops()

            return { success: true }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.detail || 'Invalid or expired code'
            }
        }
    }

    // Patches email_verified into the in-memory + stored user after
    // /auth/verify-email/ succeeds, so ProtectedRoute stops redirecting
    // without needing a full re-login.
    const markEmailVerified = () => {
        setUser((prev) => {
            if (!prev) return prev
            const updated = { ...prev, email_verified: true }
            localStorage.setItem('user', JSON.stringify(updated))
            return updated
        })
    }

    // Exchanges a short-lived handoff code (minted by the central login or by
    // switching shops) for real tokens, scoped to the shop that code was
    // minted for. Used by /auth/callback and by same-origin signup/login
    // fallbacks when no workspace subdomain is configured yet.
    const loginWithHandoff = async (code) => {
        try {
            const response = await authAPI.exchangeHandoff(code)
            const { access, refresh, user: handoffUser, shop } = response.data

            localStorage.setItem('access_token', access)
            localStorage.setItem('refresh_token', refresh)
            localStorage.setItem('user', JSON.stringify(handoffUser))

            setUser(handoffUser)
            setIsAuthenticated(true)

            const shopsResponse = await authAPI.get('/shops/my_shops/')
            const userShops = shopsResponse.data
            setShops(userShops)

            const membership = userShops.find((m) => m.shop.id === shop.id)
            const shopData = {
                id: shop.id,
                name: shop.name,
                slug: shop.slug,
                role: membership?.role || 'owner'
            }
            setCurrentShop(shopData)
            localStorage.setItem('current_shop', JSON.stringify(shopData))

            return { success: true }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.detail || 'This sign-in link is invalid or has expired'
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

    const logout = async () => {
        // Blacklist the refresh token on the backend
        try {
            const refreshToken = localStorage.getItem('refresh_token')
            if (refreshToken) {
                await authAPI.logout({ refresh: refreshToken })
            }
        } catch (error) {
            // Continue with logout even if backend call fails
            console.error('Backend logout failed:', error)
        }

        // Clear local storage
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
        verifyLoginOtp,
        markEmailVerified,
        signup,
        logout,
        checkAuth,
        shops,
        currentShop,
        loadingShops,
        switchShop,
        updateCurrentShop,
        fetchUserShops,
        loginWithHandoff
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
