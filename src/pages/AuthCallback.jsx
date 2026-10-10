import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function AuthCallback() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { loginWithHandoff } = useAuth()
    const [error, setError] = useState('')
    const ran = useRef(false)

    useEffect(() => {
        if (ran.current) return
        ran.current = true

        const code = searchParams.get('handoff')
        if (!code) {
            navigate('/login', { replace: true })
            return
        }

        loginWithHandoff(code).then((result) => {
            if (result.success) {
                navigate('/dashboard', { replace: true })
            } else {
                setError(result.error)
            }
        })
    }, [searchParams, navigate, loginWithHandoff])

    return (
        <div className="min-h-screen flex items-center justify-center bg-brand-surface font-sans text-brand-ink">
            <div className="text-center text-brand-ink/60">
                {error ? (
                    <>
                        <p className="text-[#c8553d] mb-2">{error}</p>
                        <a href="/login" className="underline">Back to login</a>
                    </>
                ) : (
                    <p>Signing you in…</p>
                )}
            </div>
        </div>
    )
}

export default AuthCallback
