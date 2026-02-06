import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import OTPInput from "../components/OTPInput"
import axios from 'axios'

/**
 * Improved Signup Flow with Phone Verification
 *
 * 2-Step signup flow:
 * Step 1: Enter all details (username, email, password, phone) → Send OTP
 * Step 2: Enter OTP → Verify → Auto-create account + Login
 *
 * How it works:
 * - User fills all signup details at once
 * - Click "Next" to send OTP
 * - User enters OTP to verify phone
 * - Account is created automatically and user is logged in
 */
function Signup() {
    const navigate = useNavigate()
    const { signup, login } = useAuth()

    // Step state: 1 = Form, 2 = OTP Verification
    const [step, setStep] = useState(1)

    // Form data
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone_number: ""
    })

    const [otp, setOtp] = useState("")

    // UI state
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [canResend, setCanResend] = useState(false)

    const API_URL = process.env.REACT_APP_API_BASE_URL?.replace('/api', '') || 'http://localhost:8001'

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
        setError("")
    }

    /**
     * Step 1: Validate form and send OTP
     */
    const handleNext = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match")
            setLoading(false)
            return
        }

        // Validate password length
        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters long")
            setLoading(false)
            return
        }

        try {
            // Send OTP to phone number
            const response = await axios.post(`${API_URL}/api/auth/send-otp/`, {
                phone_number: formData.phone_number
            })

            // Enable resend after 5 minutes
            setTimeout(() => setCanResend(true), response.data.expires_in * 1000)

            // Move to OTP verification step
            setStep(2)
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to send OTP. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    /**
     * Step 2: Verify OTP and create account + auto-login
     */
    const handleVerifyAndSignup = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            // Step 1: Verify OTP
            await axios.post(`${API_URL}/api/auth/verify-otp/`, {
                phone_number: formData.phone_number,
                otp_code: otp
            })

            // Step 2: Create account (phone is already verified)
            const { confirmPassword, ...signupData } = formData
            const result = await signup(signupData)

            if (result.success) {
                // Step 3: Auto-login with credentials
                const loginResult = await login({
                    username: formData.username,
                    password: formData.password
                })

                if (loginResult.success) {
                    // Redirect to dashboard/sales page
                    navigate('/sales')
                } else {
                    // Fallback: redirect to login if auto-login fails
                    navigate('/login')
                }
            } else {
                // Handle signup error
                const errorData = result.error
                if (errorData) {
                    if (errorData.username) {
                        setError(`Username: ${errorData.username[0]}`)
                    } else if (errorData.email) {
                        setError(`Email: ${errorData.email[0]}`)
                    } else if (errorData.password) {
                        setError(`Password: ${errorData.password[0]}`)
                    } else if (errorData.phone_number) {
                        setError(`Phone: ${errorData.phone_number[0]}`)
                    } else {
                        setError(errorData.detail || errorData.message || "Registration failed")
                    }
                } else {
                    setError("An error occurred during registration")
                }
            }
        } catch (err) {
            setError(err.response?.data?.detail || "Invalid OTP code. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const handleResendOTP = async () => {
        setCanResend(false)
        setOtp("")
        setError("")
        setLoading(true)

        try {
            const response = await axios.post(`${API_URL}/api/auth/send-otp/`, {
                phone_number: formData.phone_number
            })

            setTimeout(() => setCanResend(true), response.data.expires_in * 1000)
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to resend OTP. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    // Icons
    const AlertIcon = () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
    )

    const PhoneIcon = () => (
        <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
        </svg>
    )

    const UserIcon = () => (
        <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
        </svg>
    )

    const MailIcon = () => (
        <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
    )

    const LockIcon = () => (
        <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
    )

    const BackIcon = () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"></path>
        </svg>
    )

    return (
        <div className="min-h-screen bg-pos-bg flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-sm p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-pos-text mb-2">POS Logo</h1>
                        <h2 className="text-xl font-semibold text-pos-text">
                            {step === 1 && "Create Account"}
                            {step === 2 && "Verify Phone Number"}
                        </h2>
                        <p className="text-gray-500 mt-1">
                            {step === 1 && "Fill in your details to get started"}
                            {step === 2 && `Code sent to ${formData.phone_number}`}
                        </p>
                    </div>

                    {/* Step Progress Indicator */}
                    <div className="flex items-center justify-center gap-2 mb-6">
                        {[1, 2].map((s) => (
                            <div
                                key={s}
                                className={`h-2 rounded-full transition-all ${
                                    s === step
                                        ? 'w-8 bg-pos-primary'
                                        : s < step
                                        ? 'w-2 bg-pos-primary'
                                        : 'w-2 bg-gray-300'
                                }`}
                            />
                        ))}
                    </div>

                    {error && (
                        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-5">
                            <AlertIcon />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    {/* Step 1: Signup Form */}
                    {step === 1 && (
                        <form onSubmit={handleNext} className="space-y-4">
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
                                        placeholder="Choose a username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                        <MailIcon />
                                    </div>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        className="w-full pl-10 pr-4 py-2.5 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                        placeholder="Enter your email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                        <PhoneIcon />
                                    </div>
                                    <input
                                        type="tel"
                                        id="phone_number"
                                        name="phone_number"
                                        className="w-full pl-10 pr-4 py-2.5 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                        placeholder="0712345678 or +254712345678"
                                        value={formData.phone_number}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    We'll send you a verification code
                                </p>
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
                                        placeholder="Create a password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                        <LockIcon />
                                    </div>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        className="w-full pl-10 pr-4 py-2.5 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                        placeholder="Confirm your password"
                                        value={formData.confirmPassword}
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
                                {loading ? "Sending code..." : "Next - Verify Phone"}
                            </button>

                            <div className="text-center text-sm text-gray-600">
                                Already have an account?{" "}
                                <Link to="/login" className="text-pos-primary font-medium hover:underline">
                                    Sign in
                                </Link>
                            </div>
                        </form>
                    )}

                    {/* Step 2: OTP Verification */}
                    {step === 2 && (
                        <form onSubmit={handleVerifyAndSignup} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                                    Enter 6-digit code
                                </label>
                                <OTPInput
                                    value={otp}
                                    onChange={setOtp}
                                    length={6}
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-2.5 bg-pos-primary text-white rounded-lg font-medium hover:bg-pos-text/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading || otp.length !== 6}
                            >
                                {loading ? "Verifying & Creating Account..." : "Verify & Sign Up"}
                            </button>

                            <div className="text-center text-sm space-y-2">
                                <button
                                    type="button"
                                    onClick={handleResendOTP}
                                    className={`text-pos-primary font-medium ${
                                        canResend ? 'hover:underline' : 'opacity-50 cursor-not-allowed'
                                    }`}
                                    disabled={!canResend || loading}
                                >
                                    Resend code
                                </button>
                                <div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStep(1)
                                            setOtp("")
                                            setError("")
                                        }}
                                        className="flex items-center justify-center gap-2 mx-auto text-gray-600 hover:text-gray-800"
                                        disabled={loading}
                                    >
                                        <BackIcon />
                                        Change details
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Signup
