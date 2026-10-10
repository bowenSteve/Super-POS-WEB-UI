import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../api/api'
import { completeAuthRedirect } from '../utils/authRedirect'

const inputClass = 'bg-white border border-brand-ink/[0.16] rounded-[11px] px-3.5 py-[13px] text-[15px] outline-none focus:border-brand-ink transition-colors w-full'
const labelClass = 'text-[12.5px] font-semibold tracking-[0.05em] uppercase text-brand-ink/55'

function AcceptInvite() {
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token')
    const { loginWithHandoff } = useAuth()

    const [loadingInvite, setLoadingInvite] = useState(true)
    const [invite, setInvite] = useState(null)
    const [inviteError, setInviteError] = useState('')

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!token) {
            setInviteError('This invite link is missing its token.')
            setLoadingInvite(false)
            return
        }
        authAPI.getInvite(token)
            .then((response) => setInvite(response.data))
            .catch((err) => setInviteError(err.response?.data?.detail || 'This invite link is invalid or has expired'))
            .finally(() => setLoadingInvite(false))
    }, [token])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (password.length < 8) {
            setError('Password must be at least 8 characters')
            return
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        setSubmitting(true)
        try {
            const response = await authAPI.acceptInvite(token, password)
            const result = await completeAuthRedirect(response.data, loginWithHandoff)
            if (result.redirected) return
            if (!result.success) {
                setError(result.error)
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Could not set your password. Please try again.')
        } finally {
            setSubmitting(false)
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

                <div className="bg-white border border-brand-ink/[0.09] rounded-2xl p-8">
                    {loadingInvite ? (
                        <p className="text-center text-brand-ink/55">Checking your invite…</p>
                    ) : inviteError ? (
                        <div className="text-center">
                            <h1 className="text-xl font-semibold mb-2.5">Invite link invalid</h1>
                            <p className="text-[15px] text-brand-ink/62 mb-6">{inviteError}</p>
                            <Link to="/login" className="underline font-semibold">Back to login</Link>
                        </div>
                    ) : (
                        <>
                            <h1 className="text-2xl font-semibold tracking-[-0.02em]">Join {invite.shop_name}</h1>
                            <p className="text-[15px] text-brand-ink/62 mt-2.5 mb-7">
                                {invite.invited_by_name ? `${invite.invited_by_name} invited` : "You've been invited"} {invite.email} to join as a <span className="font-semibold text-brand-ink capitalize">{invite.role}</span>. Set a password to get started.
                            </p>

                            {error && (
                                <div className="mb-5 px-4 py-3 rounded-[10px] bg-[#c8553d]/10 text-[#c8553d] text-sm">{error}</div>
                            )}

                            <form onSubmit={handleSubmit} className="grid gap-4">
                                <div className="grid gap-[7px]">
                                    <label htmlFor="i-pw" className={labelClass}>Password</label>
                                    <input id="i-pw" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className={inputClass} />
                                </div>
                                <div className="grid gap-[7px]">
                                    <label htmlFor="i-pw2" className={labelClass}>Confirm password</label>
                                    <input id="i-pw2" type="password" required minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" className={inputClass} />
                                </div>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="mt-1 bg-brand-ink border border-brand-ink text-brand-surface font-semibold text-[15px] py-[15px] rounded-xl cursor-pointer disabled:opacity-60 hover:bg-brand-ink/90 transition-colors"
                                >
                                    {submitting ? 'Setting password…' : 'Set password and sign in'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AcceptInvite
