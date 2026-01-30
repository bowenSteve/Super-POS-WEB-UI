import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

function Login() {
    const navigate = useNavigate()
    const { login } = useAuth()
    const [formData, setFormData] = useState({
        username: "",
        password: ""
    })
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
        setError("")
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        const result = await login(formData)

        if (result.success) {
            navigate('/')
        } else {
            setError(result.error)
        }

        setLoading(false)
    }

    const AlertIcon = () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
    )

    const UserIcon = () => (
        <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
        </svg>
    )

    const LockIcon = () => (
        <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
    )

    return (
        <div className="min-h-screen bg-pos-bg flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-sm p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-pos-text mb-2">POS Logo</h1>
                        <h2 className="text-xl font-semibold text-pos-text">Welcome Back</h2>
                        <p className="text-gray-500 mt-1">Sign in to your account to continue</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                <AlertIcon />
                                <span className="text-sm">{error}</span>
                            </div>
                        )}

                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                                Username
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                    <UserIcon />
                                </div>
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    className="w-full pl-10 pr-4 py-2.5 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                    placeholder="Enter your username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                    <LockIcon />
                                </div>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    className="w-full pl-10 pr-4 py-2.5 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-2.5 bg-pos-primary text-white rounded-lg font-medium hover:bg-pos-text/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            {loading ? "Signing in..." : "Sign In"}
                        </button>

                        <div className="text-center text-sm text-gray-600">
                            Don't have an account?{" "}
                            <Link to="/signup" className="text-pos-primary font-medium hover:underline">
                                Sign up
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default Login
