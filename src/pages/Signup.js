import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import "../styles/auth.css"

function Signup() {
    const navigate = useNavigate()
    const { signup } = useAuth()
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: ""
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

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match")
            setLoading(false)
            return
        }

        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters long")
            setLoading(false)
            return
        }

        const { confirmPassword, ...signupData } = formData
        const result = await signup(signupData)

        if (result.success) {
            // Redirect to login page after successful signup
            // User will need to verify email (to be implemented) and then login
            navigate('/login')
        } else {
            const errorData = result.error
            if (errorData) {
                if (errorData.username) {
                    setError(`Username: ${errorData.username[0]}`)
                } else if (errorData.email) {
                    setError(`Email: ${errorData.email[0]}`)
                } else if (errorData.password) {
                    setError(`Password: ${errorData.password[0]}`)
                } else {
                    setError(errorData.detail || errorData.message || "Registration failed")
                }
            } else {
                setError("An error occurred during registration")
            }
        }

        setLoading(false)
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1 className="auth-brand">SuperPOS</h1>
                    <h2 className="auth-title">Create Account</h2>
                    <p className="auth-subtitle">Sign up to get started</p>
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
                            placeholder="Choose a username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email" className="form-label">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            className="form-input"
                            placeholder="Enter your email"
                            value={formData.email}
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
                            placeholder="Create a password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            className="form-input"
                            placeholder="Confirm your password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="auth-button"
                        disabled={loading}
                    >
                        {loading ? "Creating account..." : "Sign Up"}
                    </button>

                    <div className="auth-footer">
                        <p>Already have an account? <Link to="/login" className="auth-link">Sign in</Link></p>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default Signup
