import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../api/api'
import OTPInput from '../components/OTPInput'

function VerifyEmail() {
    const { isAuthenticated, loading, user, markEmailVerified, logout } = useAuth()
    const navigate = useNavigate()
    const [code, setCode] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [resending, setResending] = useState(false)
    const [error, setError] = useState('')

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-surface">
                <div className="text-center text-brand-ink/50">Loading…</div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    if (user?.email_verified) {
        return <Navigate to="/dashboard" replace />
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSubmitting(true)
        try {
            await authAPI.verifyEmail(code)
            markEmailVerified()
            navigate('/dashboard')
        } catch (err) {
            setError(err.response?.data?.detail || 'Invalid or expired code')
        } finally {
            setSubmitting(false)
        }
    }

    const handleResend = async () => {
        setError('')
        setResending(true)
        try {
            await authAPI.resendVerifyEmail()
        } catch (err) {
            setError('Could not resend the code. Please try again.')
        } finally {
            setResending(false)
        }
    }

    return (
        <div className="min-h-screen bg-brand-surface font-sans text-brand-ink flex items-center justify-center px-6">
            <div className="w-full max-w-[420px]">
                <div className="flex items-center gap-2.5 justify-center mb-8">
                    <span className="w-[26px] h-[26px] rounded-lg bg-brand-ink grid place-items-center">
                        <span className="w-[9px] h-[9px] rounded-full bg-brand-accent" />
                    </span>
                    <span className="text-xl font-semibold tracking-[-0.02em]">Singla-POS</span>
                </div>

                <div className="bg-white border border-brand-ink/[0.09] rounded-2xl p-8 text-center">
                    <h1 className="text-2xl font-semibold tracking-[-0.02em]">Verify your email</h1>
                    <p className="text-[15px] text-brand-ink/62 mt-2.5 mb-7">
                        Enter the 6-digit code we sent to <span className="font-semibold text-brand-ink">{user?.email}</span>.
                    </p>

                    {error && (
                        <div className="mb-5 px-4 py-3 rounded-[10px] bg-[#c8553d]/10 text-[#c8553d] text-sm">{error}</div>
                    )}

                    <form onSubmit={handleSubmit} className="grid gap-5">
                        <OTPInput value={code} onChange={setCode} length={6} />
                        <button
                            type="submit"
                            disabled={submitting || code.length !== 6}
                            className="bg-brand-ink border border-brand-ink text-brand-surface font-semibold text-[15px] py-[15px] rounded-xl cursor-pointer disabled:opacity-60 hover:bg-brand-ink/90 transition-colors"
                        >
                            {submitting ? 'Verifying…' : 'Verify email'}
                        </button>
                    </form>

                    <div className="flex items-center justify-between text-sm mt-5">
                        <button onClick={logout} className="text-brand-ink/55 underline cursor-pointer">Log out</button>
                        <button onClick={handleResend} disabled={resending} className="text-brand-ink font-semibold underline cursor-pointer disabled:opacity-60">
                            {resending ? 'Sending…' : 'Resend code'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default VerifyEmail
