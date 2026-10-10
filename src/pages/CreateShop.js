import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { shopsAPI } from '../api/api'
import { useAuth } from '../context/AuthContext'
import { getRootDomain } from '../utils/tenant'

const inputClass = 'h-11 bg-white border border-brand-ink/[0.16] rounded-[11px] px-3.5 text-[14.5px] outline-none focus:border-brand-ink transition-colors w-full'
const labelClass = 'text-[13px] font-semibold'

function CreateShop() {
  const navigate = useNavigate()
  const { fetchUserShops, switchShop } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    phone: '',
    email: '',
    address: '',
    currency: 'KSh',
    tax_rate: '0.00'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [slugStatus, setSlugStatus] = useState(null)
  const [checkingSlug, setCheckingSlug] = useState(false)
  const slugCheckTimer = useRef(null)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  useEffect(() => {
    const slug = formData.slug.trim()
    if (!slug) { setSlugStatus(null); return }
    setCheckingSlug(true)
    clearTimeout(slugCheckTimer.current)
    slugCheckTimer.current = setTimeout(async () => {
      try {
        const response = await shopsAPI.checkSlug(slug)
        setSlugStatus(response.data)
      } catch (_) {
        setSlugStatus(null)
      } finally {
        setCheckingSlug(false)
      }
    }, 300)
    return () => clearTimeout(slugCheckTimer.current)
  }, [formData.slug])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await shopsAPI.create(formData)
      const createdShop = response.data

      // Refresh shops list to get the membership
      await fetchUserShops()

      // Switch to the newly created shop
      switchShop({
        shop: {
          id: createdShop.id,
          name: createdShop.name
        },
        role: 'owner'
      })

      // Redirect to profile to see the new shop
      navigate('/profile')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create shop')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-surface font-sans text-brand-ink flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full grid gap-6">
        <div className="text-center">
          <h2 className="text-[26px] font-semibold tracking-[-0.03em]">
            Create your shop
          </h2>
          <p className="mt-1.5 text-sm text-brand-ink/58">
            Set up your shop to start managing your business
          </p>
        </div>

        <form className="bg-white border border-brand-ink/[0.09] rounded-2xl p-7 grid gap-5" onSubmit={handleSubmit}>
          {error && (
            <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(200,85,61,0.1)', border: '1px solid rgba(200,85,61,0.25)', color: '#c8553d' }}>
              {error}
            </div>
          )}

          <div className="grid gap-4">
            <div className="grid gap-[7px]">
              <label htmlFor="name" className={labelClass}>
                Shop name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className={inputClass}
                placeholder="My Shop"
              />
            </div>

            <div className="grid gap-[7px]">
              <label htmlFor="slug" className={labelClass}>
                Workspace address
              </label>
              <div className="h-11 flex items-center bg-white border border-brand-ink/[0.16] rounded-[11px] pl-3.5 pr-3 focus-within:border-brand-ink transition-colors">
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  value={formData.slug}
                  onChange={handleChange}
                  className="flex-1 min-w-0 border-0 outline-none bg-transparent text-[14.5px]"
                  placeholder="mama-njeri"
                />
                <span className="text-sm text-brand-ink/40 whitespace-nowrap">.{getRootDomain()}</span>
              </div>
              {formData.slug && (
                <p className="text-xs font-medium" style={{ color: checkingSlug ? 'rgba(20,55,59,0.45)' : slugStatus?.available ? '#2f7a5f' : '#c8553d' }}>
                  {checkingSlug
                    ? 'Checking…'
                    : slugStatus?.available
                      ? 'Available'
                      : slugStatus?.reason === 'reserved'
                        ? 'That address is reserved (try another)'
                        : slugStatus?.reason === 'invalid_format'
                          ? 'Use lowercase letters, numbers and hyphens only'
                          : 'That address is already taken'}
                </p>
              )}
              <p className="text-xs text-brand-ink/45">Leave blank to auto-generate one from the shop name.</p>
            </div>

            <div className="grid gap-[7px]">
              <label htmlFor="phone" className={labelClass}>
                Phone number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className={inputClass}
                placeholder="+254 712 345 678"
              />
            </div>

            <div className="grid gap-[7px]">
              <label htmlFor="email" className={labelClass}>
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={inputClass}
                placeholder="shop@example.com"
              />
            </div>

            <div className="grid gap-[7px]">
              <label htmlFor="address" className={labelClass}>
                Address
              </label>
              <textarea
                id="address"
                name="address"
                rows="3"
                value={formData.address}
                onChange={handleChange}
                className="bg-white border border-brand-ink/[0.16] rounded-[11px] px-3.5 py-3 text-[14.5px] outline-none focus:border-brand-ink transition-colors resize-y"
                placeholder="Shop address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-[7px]">
                <label htmlFor="currency" className={labelClass}>
                  Currency
                </label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="KSh">KSh (Kenyan Shilling)</option>
                  <option value="USD">USD (US Dollar)</option>
                  <option value="EUR">EUR (Euro)</option>
                  <option value="GBP">GBP (British Pound)</option>
                </select>
              </div>

              <div className="grid gap-[7px]">
                <label htmlFor="tax_rate" className={labelClass}>
                  Tax rate (%)
                </label>
                <input
                  id="tax_rate"
                  name="tax_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.tax_rate}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="16.00"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 h-11 border border-brand-ink/[0.16] rounded-xl text-sm font-semibold hover:bg-brand-surface transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (formData.slug && slugStatus && !slugStatus.available)}
              className="flex-1 h-11 bg-brand-ink text-brand-surface rounded-xl text-sm font-semibold hover:bg-brand-ink/90 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Creating…' : 'Create shop'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateShop
