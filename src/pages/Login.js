import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import "../styles/auth.css"

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

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1 className="auth-brand">SuperPOS</h1>
                    <h2 className="auth-title">Welcome Back</h2>
                    <p className="auth-subtitle">Sign in to your account to continue</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {error && (
                        <div className="auth-error">
                            <span className="error-icon">⚠️</span>
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="username" className="form-label">Username</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            className="form-input"
                            placeholder="Enter your username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password" className="form-label">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            className="form-input"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="auth-button"
                        disabled={loading}
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>

                    <div className="auth-footer">
                        <p>Don't have an account? <Link to="/signup" className="auth-link">Sign up</Link></p>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default Login
