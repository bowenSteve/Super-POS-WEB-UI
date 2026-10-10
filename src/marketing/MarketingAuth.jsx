import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authAPI, shopsAPI } from '../api/api'
import { getCurrentSlug, getRootDomain } from '../utils/tenant'
import { completeAuthRedirect } from '../utils/authRedirect'
import OTPInput from '../components/OTPInput'

const slugify = (v) =>
  (v || '').toLowerCase().trim().replace(/[^a-z0-9-\s]/g, '').replace(/[\s-]+/g, '-').replace(/^-/, '')

function buildWorkspaceOrigin(slug) {
  const root = getRootDomain()
  const port = window.location.port ? `:${window.location.port}` : ''
  return `${window.location.protocol}//${slug}.${root}${port}`
}

const inputClass = 'bg-white border border-brand-ink/[0.16] rounded-[11px] px-3.5 py-[13px] text-[15px] outline-none focus:border-brand-ink transition-colors w-full'
const labelClass = 'text-[12.5px] font-semibold tracking-[0.05em] uppercase text-brand-ink/55'

export default function MarketingAuth({ mode: initialMode = 'signup' }) {
  const [mode, setMode] = useState(initialMode)
  const [step, setStep] = useState(1)
  const navigate = useNavigate()
  const { login, verifyLoginOtp, loginWithHandoff } = useAuth()

  const currentSlug = getCurrentSlug()

  // --- login state ---
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [workspaceChoices, setWorkspaceChoices] = useState(null)
  const [otpLoginToken, setOtpLoginToken] = useState(null)
  const [otpCode, setOtpCode] = useState('')
  const [resendingOtp, setResendingOtp] = useState(false)

  // --- signup state ---
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [bizName, setBizName] = useState('')
  const [slugValue, setSlugValue] = useState('')
  const [businessType, setBusinessType] = useState('Retail / mini-mart')
  const [currency, setCurrency] = useState('KSh (Kenyan shilling)')
  const [slugStatus, setSlugStatus] = useState(null) // { available, reason }
  const [checkingSlug, setCheckingSlug] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { setMode(initialMode); setStep(1); setError('') }, [initialMode])

  const cleanedSlug = slugValue ? slugify(slugValue) : slugify(bizName)
  const rootDomain = getRootDomain()
  const slugPreview = `${cleanedSlug || 'yourshop'}.${rootDomain}`

  // Debounced live slug-availability check against the real backend.
  const slugCheckTimer = useRef(null)
  useEffect(() => {
    if (!cleanedSlug) { setSlugStatus(null); return }
    setCheckingSlug(true)
    clearTimeout(slugCheckTimer.current)
    slugCheckTimer.current = setTimeout(async () => {
      try {
        const response = await shopsAPI.checkSlug(cleanedSlug)
        setSlugStatus(response.data)
      } catch (_) {
        setSlugStatus(null)
      } finally {
        setCheckingSlug(false)
      }
    }, 300)
    return () => clearTimeout(slugCheckTimer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleanedSlug])

  const availText = checkingSlug
    ? 'Checking…'
    : !cleanedSlug
      ? 'Pick a short, memorable name'
      : slugStatus
        ? slugStatus.available
          ? `${slugPreview} is available`
          : slugStatus.reason === 'reserved'
            ? 'That address is reserved (try another)'
            : slugStatus.reason === 'invalid_format'
              ? 'Use lowercase letters, numbers and hyphens only'
              : 'That address is taken (try another)'
        : ''
  const availColor = !cleanedSlug ? 'text-brand-ink/50' : slugStatus?.available ? 'text-brand-ink' : 'text-[#c8553d]'

  const toggleMode = () => { setMode(mode === 'login' ? 'signup' : 'login'); setStep(1); setError(''); setOtpLoginToken(null); setOtpCode(''); setWorkspaceChoices(null) }

  // Shared tail for both the direct-login path (trusted device, no code
  // needed) and the OTP-verified path - decides whether to go straight to
  // the dashboard or show the multi-workspace picker.
  const afterLogin = async () => {
    if (currentSlug) {
      navigate('/dashboard')
      return
    }
    const membershipsResponse = await authAPI.get('/shops/my_shops/')
    const memberships = membershipsResponse.data
    if (memberships.length <= 1) {
      navigate('/dashboard')
      return
    }
    setWorkspaceChoices(memberships)
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const result = await login({
        username: loginEmail,
        password: loginPassword,
        ...(currentSlug ? { shop_slug: currentSlug } : {}),
      })
      if (result.otpRequired) {
        setOtpLoginToken(result.loginToken)
        return
      }
      if (!result.success) {
        setError(result.error)
        return
      }
      await afterLogin()
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleOtpVerify = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const result = await verifyLoginOtp(otpLoginToken, otpCode, rememberMe)
      if (!result.success) {
        setError(result.error)
        return
      }
      await afterLogin()
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResendOtp = async () => {
    setError('')
    setResendingOtp(true)
    try {
      await authAPI.resendLoginOtp(otpLoginToken)
    } catch (err) {
      setError('Could not resend the code. Please try again.')
    } finally {
      setResendingOtp(false)
    }
  }

  const handleWorkspaceChoice = async (membership) => {
    const shop = membership.shop
    const targetOrigin = buildWorkspaceOrigin(shop.slug)
    if (targetOrigin !== window.location.origin) {
      try {
        const { data } = await authAPI.mintHandoff(shop.id)
        if (data.redirect_url) {
          window.location.href = data.redirect_url
          return
        }
      } catch (err) {
        setError('Could not switch to that workspace. Please try again.')
        return
      }
    }
    navigate('/dashboard')
  }

  const handleSignupStep1 = (e) => {
    e.preventDefault()
    setError('')
    setStep(2)
  }

  const handleSignupSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const response = await authAPI.signupWithShop({
        full_name: fullName,
        email,
        phone_number: phone,
        password,
        shop: {
          name: bizName,
          slug: cleanedSlug,
          business_type: businessType,
          currency: currency.split(' ')[0],
        },
      })

      const result = await completeAuthRedirect(response.data, loginWithHandoff)
      if (result.redirected) return
      if (!result.success) {
        setError(result.error)
        return
      }
      setStep(3)
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        const firstError = Object.values(data).flat()[0]
        setError(typeof firstError === 'string' ? firstError : 'Could not create your account. Please check the form and try again.')
      } else {
        setError('Could not create your account. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const login_ = mode === 'login'
  const bar = (n) => (step >= n ? 'bg-brand-ink' : 'bg-brand-ink/[0.16]')
  const asideTitle = login_ ? 'Welcome back to your counter.' : 'Set up your shop in under a minute.'
  const asideBody = login_
    ? "Pick up exactly where your team left off (today's takings, open shifts and low stock are waiting)."
    : 'Create the owner account, choose your web address, and Singla-POS builds a private workspace for your business.'
  const switchPrompt = login_ ? 'New to Singla-POS?' : 'Already have a workspace?'
  const switchAction = login_ ? 'Create account' : 'Log in'

  return (
    <div className="font-sans text-brand-ink min-h-screen grid grid-cols-1 lg:grid-cols-[0.85fr_1fr]">

      <aside className="hidden lg:flex bg-brand-ink text-brand-surface px-12 py-10 flex-col min-h-screen">
        <Link to="/" className="flex items-center gap-2.5 text-brand-surface">
          <span className="w-[26px] h-[26px] rounded-lg bg-brand-surface grid place-items-center"><span className="w-[9px] h-[9px] rounded-full bg-brand-accent" /></span>
          <span className="text-xl font-semibold tracking-[-0.02em]">Singla-POS</span>
        </Link>

        <div className="my-auto max-w-[400px]">
          <h2 className="text-[clamp(28px,2.8vw,40px)] font-semibold tracking-[-0.02em] leading-[1.12]">{asideTitle}</h2>
          <p className="text-base leading-relaxed text-brand-surface/70 mt-[18px]">{asideBody}</p>

          <div className="mt-10 grid gap-3.5">
            {[
              ['Your own web address', 'Staff sign in at your subdomain, nothing to install.'],
              ['Isolated data per shop', 'Stock, staff, prices and tax settings stay in their own workspace.'],
              ['30 days free', 'No card. Export everything if you leave.'],
            ].map(([t, b]) => (
              <div key={t} className="flex gap-3.5 items-start">
                <span className="mt-1 w-[7px] h-[7px] rounded-full bg-brand-accent flex-none" />
                <div>
                  <div className="text-[14.5px] font-semibold">{t}</div>
                  <div className="text-[13.5px] text-brand-surface/65 mt-0.5">{b}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-[13px] text-brand-surface/50">© 2026 Singla-POS Systems Ltd · <Link to="/" className="text-brand-surface/70 underline">Back to site</Link></div>
      </aside>

      <main className="flex flex-col px-6 sm:px-12 py-8 pb-14 bg-brand-surface">
        <div className="flex justify-end items-center gap-3 text-sm text-brand-ink/65">
          <span>{switchPrompt}</span>
          <button onClick={toggleMode} className="border border-brand-ink/20 bg-transparent text-sm font-semibold px-4 py-[9px] rounded-[10px] cursor-pointer hover:bg-brand-ink/[0.06] transition-colors">{switchAction}</button>
        </div>

        <div className="m-auto w-full max-w-[440px] py-10">

          {error && (
            <div className="mb-5 px-4 py-3 rounded-[10px] bg-[#c8553d]/10 text-[#c8553d] text-sm">{error}</div>
          )}

          {login_ && !workspaceChoices && !otpLoginToken && (
            <form onSubmit={handleLoginSubmit}>
              <h1 className="text-[32px] font-semibold tracking-[-0.02em]">Welcome back</h1>
              <p className="text-[15px] text-brand-ink/62 mt-2.5 mb-[30px]">
                {currentSlug ? `Sign in to ${currentSlug}.${rootDomain}.` : 'Sign in to your workspace.'}
              </p>
              <div className="grid gap-4">
                <div className="grid gap-[7px]">
                  <label htmlFor="l-em" className={labelClass}>Email</label>
                  <input id="l-em" type="text" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="you@shop.co.ke" className={inputClass} />
                </div>
                <div className="grid gap-[7px]">
                  <label htmlFor="l-pw" className={labelClass}>Password</label>
                  <input id="l-pw" type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••••" className={inputClass} />
                </div>
                <label className="flex items-center gap-2 text-sm text-brand-ink/70 cursor-pointer -mt-1">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 rounded accent-brand-ink" />
                  Remember me on this device
                </label>
                <button type="submit" disabled={submitting} className="bg-brand-ink border border-brand-ink text-brand-surface font-semibold text-[15px] py-[15px] rounded-xl cursor-pointer disabled:opacity-60 hover:bg-brand-ink/90 transition-colors">
                  {submitting ? 'Signing in…' : 'Sign in'}
                </button>
              </div>
            </form>
          )}

          {login_ && otpLoginToken && (
            <form onSubmit={handleOtpVerify}>
              <h1 className="text-[32px] font-semibold tracking-[-0.02em]">Check your email</h1>
              <p className="text-[15px] text-brand-ink/62 mt-2.5 mb-[30px]">
                Enter the 6-digit code we sent to {loginEmail}.
              </p>
              <div className="grid gap-5">
                <OTPInput value={otpCode} onChange={setOtpCode} length={6} />
                <button type="submit" disabled={submitting || otpCode.length !== 6} className="bg-brand-ink border border-brand-ink text-brand-surface font-semibold text-[15px] py-[15px] rounded-xl cursor-pointer disabled:opacity-60 hover:bg-brand-ink/90 transition-colors">
                  {submitting ? 'Verifying…' : 'Verify and sign in'}
                </button>
                <div className="flex items-center justify-between text-sm">
                  <button type="button" onClick={() => { setOtpLoginToken(null); setOtpCode(''); setError('') }} className="text-brand-ink/55 underline cursor-pointer">Back</button>
                  <button type="button" onClick={handleResendOtp} disabled={resendingOtp} className="text-brand-ink font-semibold underline cursor-pointer disabled:opacity-60">
                    {resendingOtp ? 'Sending…' : 'Resend code'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {login_ && workspaceChoices && (
            <div>
              <h1 className="text-[32px] font-semibold tracking-[-0.02em]">Choose a workspace</h1>
              <p className="text-[15px] text-brand-ink/62 mt-2.5 mb-[30px]">You belong to more than one shop.</p>
              <div className="grid gap-2.5">
                {workspaceChoices.map((m) => (
                  <button
                    key={m.shop.id}
                    onClick={() => handleWorkspaceChoice(m)}
                    className="text-left flex items-center justify-between gap-4 bg-white border border-brand-ink/[0.14] rounded-[12px] px-4 py-3.5 hover:border-brand-ink transition-colors"
                  >
                    <span className="font-semibold text-[15px]">{m.shop.name}</span>
                    <span className="font-mono text-[13px] text-brand-ink/50">{m.shop.slug}.{rootDomain}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!login_ && (
            <div>
              <div className="flex items-center gap-2.5 mb-[26px]">
                <span className={`h-1 flex-1 rounded-full ${bar(1)}`} />
                <span className={`h-1 flex-1 rounded-full ${bar(2)}`} />
                <span className={`h-1 flex-1 rounded-full ${bar(3)}`} />
                <span className="text-xs font-semibold text-brand-ink/50 font-mono">0{step} / 03</span>
              </div>

              {step === 1 && (
                <form onSubmit={handleSignupStep1}>
                  <h1 className="text-[32px] font-semibold tracking-[-0.02em]">Create your account</h1>
                  <p className="text-[15px] text-brand-ink/62 mt-2.5 mb-[30px]">This is the owner login. You can invite staff after setup.</p>
                  <div className="grid gap-4">
                    <div className="grid gap-[7px]">
                      <label htmlFor="s-name" className={labelClass}>Full name</label>
                      <input id="s-name" type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Wanjiru Kamau" className={inputClass} />
                    </div>
                    <div className="grid gap-[7px]">
                      <label htmlFor="s-em" className={labelClass}>Work email</label>
                      <input id="s-em" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@shop.co.ke" className={inputClass} />
                    </div>
                    <div className="grid gap-[7px]">
                      <label htmlFor="s-ph" className={labelClass}>Phone</label>
                      <input id="s-ph" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254 7.." className={inputClass} />
                    </div>
                    <div className="grid gap-[7px]">
                      <label htmlFor="s-pw" className={labelClass}>Password</label>
                      <input id="s-pw" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className={inputClass} />
                    </div>
                    <button type="submit" className="mt-1 bg-brand-ink border border-brand-ink text-brand-surface font-semibold text-[15px] py-[15px] rounded-xl cursor-pointer hover:bg-brand-ink/90 transition-colors">Continue</button>
                    <p className="text-[12.5px] text-brand-ink/50 text-center">By continuing you agree to our <a href="#terms" className="underline">Terms</a> and <a href="#privacy" className="underline">Privacy Policy</a>.</p>
                  </div>
                </form>
              )}

              {step === 2 && (
                <form onSubmit={handleSignupSubmit}>
                  <h1 className="text-[32px] font-semibold tracking-[-0.02em]">Name your workspace</h1>
                  <p className="text-[15px] text-brand-ink/62 mt-2.5 mb-[30px]">We'll create a private address for this business. You can add more shops later.</p>
                  <div className="grid gap-4">
                    <div className="grid gap-[7px]">
                      <label htmlFor="s-biz" className={labelClass}>Business name</label>
                      <input id="s-biz" type="text" required value={bizName} onChange={(e) => setBizName(e.target.value)} placeholder="Mama Njeri Stores" className={inputClass} />
                    </div>
                    <div className="grid gap-[7px]">
                      <label htmlFor="s-slug" className={labelClass}>Workspace address</label>
                      <div className="flex items-center bg-white border border-brand-ink/[0.16] rounded-[11px] pr-3 focus-within:border-brand-ink transition-colors">
                        <input id="s-slug" type="text" value={slugValue} onChange={(e) => setSlugValue(e.target.value)} placeholder="mama-njeri" className="flex-1 min-w-0 border-0 outline-none bg-transparent font-mono text-[14.5px] px-3.5 py-[13px]" />
                        <span className="font-mono text-sm text-brand-ink/40">.{rootDomain}</span>
                      </div>
                      <div className={`flex items-center gap-2 text-[13px] ${availColor}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${slugStatus?.available ? 'bg-brand-ink' : cleanedSlug ? 'bg-[#c8553d]' : 'bg-brand-ink/50'}`} />
                        {availText}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="grid gap-[7px]">
                        <label htmlFor="s-type" className={labelClass}>Business type</label>
                        <select id="s-type" value={businessType} onChange={(e) => setBusinessType(e.target.value)} className={inputClass}>
                          <option>Retail / mini-mart</option><option>Pharmacy</option><option>Hardware</option><option>Restaurant / café</option><option>Other</option>
                        </select>
                      </div>
                      <div className="grid gap-[7px]">
                        <label htmlFor="s-cur" className={labelClass}>Currency</label>
                        <select id="s-cur" value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputClass}>
                          <option>KSh (Kenyan shilling)</option><option>TSh (Tanzanian shilling)</option><option>UGX (Ugandan shilling)</option><option>USD (US dollar)</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-1">
                      <button type="button" onClick={() => setStep(1)} className="flex-none bg-transparent border border-brand-ink/20 font-semibold text-[15px] px-5 py-[15px] rounded-xl cursor-pointer hover:bg-brand-ink/[0.06] transition-colors">Back</button>
                      <button
                        type="submit"
                        disabled={submitting || (cleanedSlug && slugStatus && !slugStatus.available)}
                        className="flex-1 bg-brand-ink border border-brand-ink text-brand-surface font-semibold text-[15px] py-[15px] rounded-xl cursor-pointer disabled:opacity-60 hover:bg-brand-ink/90 transition-colors"
                      >
                        {submitting ? 'Creating workspace…' : 'Create workspace'}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {step === 3 && (
                <div>
                  <h1 className="text-[32px] font-semibold tracking-[-0.02em]">Your workspace is live</h1>
                  <p className="text-[15px] text-brand-ink/62 mt-2.5 mb-[26px]">Bookmark the address below (it's where you and your staff will sign in).</p>
                  <div className="bg-brand-ink text-brand-surface rounded-[14px] px-[22px] py-5 flex items-center justify-between gap-4 flex-wrap">
                    <span className="font-mono text-[15px]">{slugPreview}</span>
                    <span className="text-xs font-bold text-brand-accent">TRIAL · 30 DAYS</span>
                  </div>
                  <button onClick={() => navigate('/dashboard')} className="w-full mt-6 bg-brand-accent border border-brand-accent text-brand-ink font-bold text-[15px] py-[15px] rounded-xl cursor-pointer hover:bg-brand-ink hover:border-brand-ink hover:text-brand-surface transition-colors">
                    Open my dashboard
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
