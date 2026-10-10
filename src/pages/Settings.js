import { useState, useEffect } from 'react'
import Sidebar from "../components/Sidebar"
import { ProfileSettings, StaffManagement } from "../features/profile"
import { useAuth } from "../context/AuthContext"
import { shopsAPI } from "../api/api"
import { getRootDomain } from "../utils/tenant"
import ToastNotification, { toast } from '../components/ToastNotification'

const defaultTaxSettings = {
    enabled: true,
    rate: 16,
    name: 'VAT',
    includeInPrice: false,
    showOnReceipt: true,
    taxNumber: ''
}

const defaultReceiptSettings = {
    showLogo: true,
    headerText: '',
    footerText: 'Thank you for your business!',
    showTaxBreakdown: true,
    showCashierName: true,
    showDateTime: true,
    showTransactionId: true,
    paperSize: '80mm',
    fontSize: 'medium'
}

const TABS = [
    { id: 'shop', label: 'Shop', sub: 'Name, contact, region' },
    { id: 'profile', label: 'Profile', sub: 'Your details & password' },
    { id: 'staff', label: 'Staff', sub: 'People & roles' },
    { id: 'tax', label: 'Tax', sub: 'VAT & KRA PIN' },
    { id: 'receipt', label: 'Receipt', sub: 'Layout & messages' },
]

const inputClass = 'h-11 bg-white border border-brand-ink/[0.16] rounded-[11px] px-3.5 text-[14.5px] outline-none focus:border-brand-ink transition-colors w-full'
const labelClass = 'text-[13px] font-semibold'

function Toggle({ on, onClick, ariaLabel }) {
    return (
        <button
            onClick={onClick}
            role="switch"
            aria-checked={on}
            aria-label={ariaLabel}
            className="w-[46px] h-[26px] border-0 rounded-full relative cursor-pointer flex-none transition-colors"
            style={{ background: on ? '#14373b' : 'rgba(20,55,59,0.2)' }}
        >
            <span
                className="absolute top-[3px] w-5 h-5 rounded-full bg-white shadow-sm transition-all"
                style={{ left: on ? '23px' : '3px' }}
            />
        </button>
    )
}

function Settings() {
    const { currentShop, updateCurrentShop } = useAuth()
    const [tab, setTab] = useState('shop')
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(true)
    const [dirty, setDirty] = useState(false)
    const [saved, setSaved] = useState(false)
    const [copied, setCopied] = useState(false)

    const [shopSettings, setShopSettings] = useState({
        name: '', address: '', phone: '', email: '', currency: 'KES', timezone: 'Africa/Nairobi'
    })
    const [taxSettings, setTaxSettings] = useState(defaultTaxSettings)
    const [receiptSettings, setReceiptSettings] = useState(defaultReceiptSettings)

    useEffect(() => {
        if (!currentShop) return
        setShopSettings({
            name: currentShop.name || '',
            address: currentShop.address || '',
            phone: currentShop.phone || '',
            email: currentShop.email || '',
            currency: currentShop.currency || 'KES',
            timezone: currentShop.timezone || 'Africa/Nairobi'
        })
        setTaxSettings({ ...defaultTaxSettings, ...(currentShop.tax_settings || {}) })
        setReceiptSettings({ ...defaultReceiptSettings, ...(currentShop.receipt_settings || {}) })
        syncToLocalStorage(
            { ...defaultTaxSettings, ...(currentShop.tax_settings || {}) },
            { ...defaultReceiptSettings, ...(currentShop.receipt_settings || {}) }
        )
        setLoading(false)
    }, [currentShop])

    const syncToLocalStorage = (tax, receipt) => {
        localStorage.setItem('pos_taxSettings', JSON.stringify(tax))
        localStorage.setItem('pos_taxRate', tax.rate.toString())
        localStorage.setItem('pos_taxEnabled', JSON.stringify(tax.enabled))
        localStorage.setItem('pos_receiptSettings', JSON.stringify(receipt))
    }

    const getErrorMessage = (error) => {
        if (!error.response?.data) return 'Network error. Please try again.'
        const data = error.response.data
        if (typeof data === 'string') return data
        if (data.detail) return data.detail
        const fieldErrors = Object.entries(data)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors[0] : errors}`)
            .join(', ')
        return fieldErrors || 'Failed to save settings'
    }

    const markDirty = () => { setDirty(true); setSaved(false) }
    const setShopField = (key, value) => { setShopSettings((prev) => ({ ...prev, [key]: value })); markDirty() }
    const setTaxField = (key, value) => { setTaxSettings((prev) => ({ ...prev, [key]: value })); markDirty() }
    const setReceiptField = (key, value) => { setReceiptSettings((prev) => ({ ...prev, [key]: value })); markDirty() }

    const discard = () => {
        setShopSettings({
            name: currentShop.name || '', address: currentShop.address || '', phone: currentShop.phone || '',
            email: currentShop.email || '', currency: currentShop.currency || 'KES', timezone: currentShop.timezone || 'Africa/Nairobi'
        })
        setTaxSettings({ ...defaultTaxSettings, ...(currentShop.tax_settings || {}) })
        setReceiptSettings({ ...defaultReceiptSettings, ...(currentShop.receipt_settings || {}) })
        setDirty(false)
    }

    const save = async () => {
        if (!currentShop?.id) { toast.error('No shop selected'); return }
        setSaving(true)
        try {
            const updateData = {
                name: shopSettings.name,
                address: shopSettings.address || '',
                phone: shopSettings.phone || '',
                email: shopSettings.email?.trim() || '',
                currency: shopSettings.currency,
                timezone: shopSettings.timezone,
                tax_settings: taxSettings,
                receipt_settings: receiptSettings,
            }
            const response = await shopsAPI.update(currentShop.id, updateData)
            updateCurrentShop(response.data)
            syncToLocalStorage(taxSettings, receiptSettings)
            setDirty(false)
            setSaved(true)
            setTimeout(() => setSaved(false), 2200)
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setSaving(false)
        }
    }

    const copyUrl = () => {
        const url = `https://${currentShop?.slug}.${getRootDomain()}`
        try { navigator.clipboard.writeText(url) } catch (_) { /* ignore */ }
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
    }

    const rate = parseFloat(taxSettings.rate) || 0
    let sub = 1000, taxAmt = 0, total = 1000
    if (taxSettings.enabled) {
        if (taxSettings.includeInPrice) { sub = 1000 / (1 + rate / 100); taxAmt = 1000 - sub }
        else { taxAmt = 1000 * rate / 100; total = 1000 + taxAmt }
    }
    const ksh = (n) => 'KSh ' + n.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    const initials = (currentShop?.name || '?').slice(0, 2).toUpperCase()

    if (loading && !currentShop) {
        return (
            <div className="flex min-h-screen bg-brand-surface">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-ink"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen bg-brand-surface font-sans text-brand-ink">
            <ToastNotification />
            <Sidebar />

            <div className="flex-1 min-w-0 pb-24">
                <header className="sticky top-0 z-20 bg-brand-surface/[0.9] backdrop-blur-md border-b border-brand-ink/[0.09]">
                    <div className="flex items-center gap-4 px-8 py-4">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-[22px] font-semibold tracking-[-0.03em]">Settings</h1>
                            <div className="text-[13px] text-brand-ink/55 mt-0.5">
                                Workspace <span className="font-mono">{currentShop?.slug}.{getRootDomain()}</span>
                            </div>
                        </div>
                        <span className="w-[38px] h-[38px] rounded-full bg-brand-ink text-brand-surface grid place-items-center text-[13px] font-semibold">{initials}</span>
                    </div>
                </header>

                <div className="px-8 py-6 flex flex-wrap gap-7 items-start">
                    <nav className="grid gap-0.5 flex-1 min-w-[200px] max-w-[240px]">
                        {TABS.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                className={`flex items-start gap-3 text-left w-full border-0 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${tab === t.id ? 'bg-white shadow-sm' : 'bg-transparent hover:bg-white/60'}`}
                            >
                                <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-none" style={{ background: tab === t.id ? '#ed8674' : 'transparent' }} />
                                <span>
                                    <span className="block text-sm font-semibold">{t.label}</span>
                                    <span className="block text-xs text-brand-ink/55 mt-0.5">{t.sub}</span>
                                </span>
                            </button>
                        ))}
                    </nav>

                    <div className="min-w-0 flex-[999_1_480px] max-w-[880px] grid gap-4">

                        {tab === 'shop' && (
                            <div className="grid gap-4">
                                <section className="bg-white border border-brand-ink/[0.09] rounded-2xl p-6">
                                    <h2 className="text-base font-semibold">Business details</h2>
                                    <p className="text-[13px] text-brand-ink/58 mt-1 mb-[22px]">Shown on receipts and to staff when they sign in.</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-[18px]">
                                        <div className="grid gap-[7px]">
                                            <label htmlFor="s-name" className={labelClass}>Shop name</label>
                                            <input id="s-name" type="text" value={shopSettings.name} onChange={(e) => setShopField('name', e.target.value)} className={inputClass} />
                                        </div>
                                        <div className="grid gap-[7px]">
                                            <span className={labelClass}>Workspace address</span>
                                            <div className="h-11 flex items-center gap-2 bg-brand-surface rounded-[11px] pl-3.5 pr-1.5">
                                                <span className="flex-1 min-w-0 font-mono text-[13px] truncate">{currentShop?.slug}.{getRootDomain()}</span>
                                                <button onClick={copyUrl} className="h-8 px-3 bg-white border-0 rounded-lg text-xs font-semibold cursor-pointer">{copied ? 'Copied' : 'Copy'}</button>
                                            </div>
                                        </div>
                                        <div className="grid gap-[7px]">
                                            <label htmlFor="s-email" className={labelClass}>Business email</label>
                                            <input id="s-email" type="email" value={shopSettings.email} onChange={(e) => setShopField('email', e.target.value)} placeholder="shop@example.co.ke" className={inputClass} />
                                        </div>
                                        <div className="grid gap-[7px]">
                                            <label htmlFor="s-phone" className={labelClass}>Phone</label>
                                            <input id="s-phone" type="tel" value={shopSettings.phone} onChange={(e) => setShopField('phone', e.target.value)} placeholder="+254 700 000 000" className={inputClass} />
                                        </div>
                                        <div className="grid gap-[7px] sm:col-span-2">
                                            <label htmlFor="s-addr" className={labelClass}>Address</label>
                                            <textarea id="s-addr" rows={2} value={shopSettings.address} onChange={(e) => setShopField('address', e.target.value)} placeholder="Street, town" className="bg-white border border-brand-ink/[0.16] rounded-[11px] px-3.5 py-3 text-[14.5px] outline-none focus:border-brand-ink transition-colors resize-y" />
                                        </div>
                                    </div>
                                </section>
                                <section className="bg-white border border-brand-ink/[0.09] rounded-2xl p-6">
                                    <h2 className="text-base font-semibold mb-[18px]">Region</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-[18px]">
                                        <div className="grid gap-[7px]">
                                            <label htmlFor="s-cur" className={labelClass}>Currency</label>
                                            <select id="s-cur" value={shopSettings.currency} onChange={(e) => setShopField('currency', e.target.value)} className={inputClass}>
                                                <option value="KES">KES (Kenyan shilling)</option>
                                                <option value="USD">USD (US dollar)</option>
                                                <option value="EUR">EUR (Euro)</option>
                                                <option value="GBP">GBP (British pound)</option>
                                                <option value="TZS">TZS (Tanzanian shilling)</option>
                                                <option value="UGX">UGX (Ugandan shilling)</option>
                                                <option value="NGN">NGN (Nigerian naira)</option>
                                                <option value="ZAR">ZAR (South African rand)</option>
                                            </select>
                                        </div>
                                        <div className="grid gap-[7px]">
                                            <label htmlFor="s-tz" className={labelClass}>Timezone</label>
                                            <select id="s-tz" value={shopSettings.timezone} onChange={(e) => setShopField('timezone', e.target.value)} className={inputClass}>
                                                <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                                                <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                                                <option value="Africa/Johannesburg">Africa/Johannesburg (SAST)</option>
                                                <option value="Africa/Cairo">Africa/Cairo (EET)</option>
                                                <option value="UTC">UTC</option>
                                                <option value="Europe/London">Europe/London (GMT/BST)</option>
                                                <option value="America/New_York">America/New_York (EST/EDT)</option>
                                            </select>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}

                        {tab === 'profile' && (
                            <div className="bg-white border border-brand-ink/[0.09] rounded-2xl p-6">
                                <ProfileSettings />
                            </div>
                        )}

                        {tab === 'staff' && (
                            <div className="bg-white border border-brand-ink/[0.09] rounded-2xl overflow-hidden">
                                <StaffManagement />
                            </div>
                        )}

                        {tab === 'tax' && (
                            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 items-start">
                                <section className="bg-white border border-brand-ink/[0.09] rounded-2xl p-6 grid gap-5">
                                    <div className="flex items-center gap-4 p-4 bg-brand-surface rounded-xl">
                                        <div className="flex-1">
                                            <div className="text-[14.5px] font-semibold">Charge tax on sales</div>
                                            <div className="text-[12.5px] text-brand-ink/58 mt-0.5">Applied to every item unless marked exempt in Inventory.</div>
                                        </div>
                                        <Toggle on={taxSettings.enabled} onClick={() => setTaxField('enabled', !taxSettings.enabled)} ariaLabel="Charge tax" />
                                    </div>
                                    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-[18px] ${taxSettings.enabled ? '' : 'opacity-45'}`}>
                                        <div className="grid gap-[7px]">
                                            <label htmlFor="t-name" className={labelClass}>Tax name</label>
                                            <input id="t-name" type="text" value={taxSettings.name} onChange={(e) => setTaxField('name', e.target.value)} className={inputClass} />
                                        </div>
                                        <div className="grid gap-[7px]">
                                            <label htmlFor="t-rate" className={labelClass}>Rate</label>
                                            <div className="h-11 flex items-center bg-white border border-brand-ink/[0.16] rounded-[11px] px-3.5 focus-within:border-brand-ink transition-colors">
                                                <input id="t-rate" type="number" min="0" max="100" step="0.1" value={taxSettings.rate} onChange={(e) => setTaxField('rate', parseFloat(e.target.value) || 0)} className="flex-1 min-w-0 border-0 outline-none bg-transparent text-[14.5px]" />
                                                <span className="text-brand-ink/50">%</span>
                                            </div>
                                        </div>
                                        <div className="grid gap-[7px] sm:col-span-2">
                                            <label htmlFor="t-pin" className={labelClass}>KRA PIN</label>
                                            <input id="t-pin" type="text" value={taxSettings.taxNumber} onChange={(e) => setTaxField('taxNumber', e.target.value)} placeholder="P000000000X" className={`${inputClass} font-mono`} />
                                            <span className="text-xs text-brand-ink/55">Printed on every receipt.</span>
                                        </div>
                                    </div>
                                    <div className={`grid gap-2.5 ${taxSettings.enabled ? '' : 'opacity-45'}`}>
                                        <span className={labelClass}>Product prices</span>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                            {[
                                                { key: true, label: 'Include tax', sub: 'Shelf price is what the customer pays.' },
                                                { key: false, label: 'Add tax at checkout', sub: 'Tax is added on top of the shelf price.' },
                                            ].map((m) => (
                                                <button
                                                    key={String(m.key)}
                                                    onClick={() => setTaxField('includeInPrice', m.key)}
                                                    className="text-left bg-white rounded-xl p-3.5 cursor-pointer"
                                                    style={{ border: `1.5px solid ${taxSettings.includeInPrice === m.key ? '#14373b' : 'rgba(20,55,59,0.14)'}` }}
                                                >
                                                    <span className="flex items-center gap-2 text-sm font-semibold">
                                                        <span className="w-4 h-4 rounded-full border-2 grid place-items-center" style={{ borderColor: taxSettings.includeInPrice === m.key ? '#14373b' : 'rgba(20,55,59,0.14)' }}>
                                                            {taxSettings.includeInPrice === m.key && <span className="w-1.5 h-1.5 rounded-full bg-brand-ink" />}
                                                        </span>
                                                        {m.label}
                                                    </span>
                                                    <span className="block text-xs text-brand-ink/58 mt-1.5 pl-6">{m.sub}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className={`flex items-center gap-4 border-t border-brand-ink/[0.07] pt-[18px] ${taxSettings.enabled ? '' : 'opacity-45'}`}>
                                        <div className="flex-1">
                                            <div className="text-sm font-semibold">Show tax breakdown on receipts</div>
                                            <div className="text-xs text-brand-ink/58 mt-0.5">Required for VAT-registered businesses.</div>
                                        </div>
                                        <Toggle on={taxSettings.showOnReceipt} onClick={() => setTaxField('showOnReceipt', !taxSettings.showOnReceipt)} ariaLabel="Show tax on receipts" />
                                    </div>
                                </section>
                                <aside className="bg-brand-ink text-brand-surface rounded-2xl p-5 sticky top-24">
                                    <div className="text-xs font-semibold tracking-[0.06em] uppercase text-brand-surface/55">Preview · KSh 1,000 item</div>
                                    <div className="grid gap-2.5 mt-4 text-[13.5px]">
                                        <div className="flex justify-between"><span className="text-brand-surface/70">Subtotal</span><span className="font-mono">{ksh(sub)}</span></div>
                                        <div className="flex justify-between">
                                            <span className="text-brand-surface/70">{taxSettings.enabled ? `${taxSettings.name} ${rate}%${taxSettings.includeInPrice ? ' (incl.)' : ''}` : 'Tax off'}</span>
                                            <span className="font-mono">{ksh(taxAmt)}</span>
                                        </div>
                                        <div className="h-px bg-brand-surface/15" />
                                        <div className="flex justify-between items-baseline"><span className="font-semibold">Customer pays</span><span className="text-2xl font-semibold tracking-[-0.03em] text-brand-accent">{ksh(total)}</span></div>
                                    </div>
                                </aside>
                            </div>
                        )}

                        {tab === 'receipt' && (
                            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 items-start">
                                <section className="bg-white border border-brand-ink/[0.09] rounded-2xl p-6 grid gap-[18px]">
                                    <div className="grid gap-[7px]">
                                        <label htmlFor="r-head" className={labelClass}>Header message</label>
                                        <input id="r-head" type="text" value={receiptSettings.headerText} onChange={(e) => setReceiptField('headerText', e.target.value)} placeholder="Karibu! Welcome to our shop" className={inputClass} />
                                    </div>
                                    <div className="grid gap-[7px]">
                                        <label htmlFor="r-foot" className={labelClass}>Footer message</label>
                                        <input id="r-foot" type="text" value={receiptSettings.footerText} onChange={(e) => setReceiptField('footerText', e.target.value)} placeholder="Asante kwa kununua" className={inputClass} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-[18px]">
                                        <div className="grid gap-[7px]">
                                            <span className={labelClass}>Paper width</span>
                                            <div className="flex gap-[3px] p-[3px] bg-brand-surface rounded-[11px]">
                                                {[['58mm', '58 mm'], ['80mm', '80 mm']].map(([val, label]) => (
                                                    <button key={val} onClick={() => setReceiptField('paperSize', val)} className={`flex-1 border-0 text-[13px] font-semibold py-2.5 rounded-lg cursor-pointer ${receiptSettings.paperSize === val ? 'bg-white shadow-sm' : 'bg-transparent'}`}>{label}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="grid gap-[7px]">
                                            <span className={labelClass}>Text size</span>
                                            <div className="flex gap-[3px] p-[3px] bg-brand-surface rounded-[11px]">
                                                {[['small', 'Small'], ['medium', 'Medium'], ['large', 'Large']].map(([val, label]) => (
                                                    <button key={val} onClick={() => setReceiptField('fontSize', val)} className={`flex-1 border-0 text-[13px] font-semibold py-2.5 rounded-lg cursor-pointer ${receiptSettings.fontSize === val ? 'bg-white shadow-sm' : 'bg-transparent'}`}>{label}</button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid border-t border-brand-ink/[0.07] pt-1.5">
                                        {[
                                            ['showLogo', 'Shop logo'], ['showTaxBreakdown', 'Tax breakdown'], ['showCashierName', 'Cashier name'],
                                            ['showDateTime', 'Date and time'], ['showTransactionId', 'Receipt number'],
                                        ].map(([key, label]) => (
                                            <div key={key} className="flex items-center gap-4 py-[11px] border-b border-brand-ink/[0.06] last:border-b-0">
                                                <span className="flex-1 text-sm">{label}</span>
                                                <Toggle on={receiptSettings[key]} onClick={() => setReceiptField(key, !receiptSettings[key])} ariaLabel={label} />
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <aside className="sticky top-24 bg-brand-ink rounded-2xl p-5 grid justify-items-center gap-3">
                                    <span className="text-xs font-semibold tracking-[0.06em] uppercase text-brand-surface/55">Live preview</span>
                                    <div
                                        className="bg-white text-brand-ink font-mono leading-[1.55] shadow-lg"
                                        style={{ width: receiptSettings.paperSize === '58mm' ? '200px' : '260px', padding: '18px 14px 22px', fontSize: receiptSettings.fontSize === 'small' ? '10.5px' : receiptSettings.fontSize === 'large' ? '13px' : '11.5px' }}
                                    >
                                        <div className="text-center">
                                            {receiptSettings.showLogo && <div className="w-[34px] h-[34px] mx-auto mb-2 rounded-[9px] bg-brand-ink text-brand-surface grid place-items-center font-bold text-[11px]">{initials}</div>}
                                            <div className="font-bold" style={{ fontSize: '1.15em' }}>{shopSettings.name || 'Shop name'}</div>
                                            {receiptSettings.headerText && <div className="opacity-70">{receiptSettings.headerText}</div>}
                                        </div>
                                        <div className="border-t border-dashed border-brand-ink/35 my-2.5" />
                                        {receiptSettings.showTransactionId && <div>Receipt TXN-1C3B426E</div>}
                                        {receiptSettings.showDateTime && <div>{new Date().toLocaleDateString('en-GB')} 14:32</div>}
                                        {receiptSettings.showCashierName && <div>Served by John M.</div>}
                                        <div className="border-t border-dashed border-brand-ink/35 my-2.5" />
                                        <div className="flex justify-between"><span>Unga 2kg x2</span><span>400</span></div>
                                        <div className="flex justify-between"><span>Maziwa 500ml x4</span><span>260</span></div>
                                        <div className="flex justify-between"><span>Supa Loaf x1</span><span>65</span></div>
                                        <div className="border-t border-dashed border-brand-ink/35 my-2.5" />
                                        {receiptSettings.showTaxBreakdown && taxSettings.enabled && (
                                            <div className="flex justify-between opacity-75"><span>{taxSettings.name} {taxSettings.rate}% incl.</span><span>100</span></div>
                                        )}
                                        <div className="flex justify-between font-bold" style={{ fontSize: '1.1em' }}><span>TOTAL</span><span>KSh 725</span></div>
                                        <div className="flex justify-between opacity-75"><span>M-Pesa</span><span>QK81H2XR</span></div>
                                        {taxSettings.taxNumber && taxSettings.showOnReceipt && <div className="opacity-75 mt-1.5">PIN {taxSettings.taxNumber}</div>}
                                        <div className="border-t border-dashed border-brand-ink/35 my-2.5" />
                                        <div className="text-center">{receiptSettings.footerText}</div>
                                    </div>
                                </aside>
                            </div>
                        )}

                    </div>
                </div>

                {dirty && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:left-[calc(50%+124px)] z-50 flex items-center gap-4 bg-brand-ink text-brand-surface rounded-2xl pl-[18px] pr-2.5 py-2.5 shadow-2xl">
                        <span className="w-2 h-2 rounded-full bg-brand-accent flex-none" />
                        <span className="text-sm font-medium whitespace-nowrap">You have unsaved changes</span>
                        <button onClick={discard} className="h-[38px] px-3.5 bg-transparent text-brand-surface border border-brand-surface/25 rounded-[10px] text-[13.5px] font-semibold cursor-pointer">Discard</button>
                        <button onClick={save} disabled={saving} className="h-[38px] px-4 bg-brand-accent text-brand-ink border-0 rounded-[10px] text-[13.5px] font-bold cursor-pointer disabled:opacity-60">
                            {saving ? 'Saving…' : 'Save changes'}
                        </button>
                    </div>
                )}
                {saved && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:left-[calc(50%+124px)] z-50 flex items-center gap-2.5 bg-white border border-brand-ink/[0.12] rounded-2xl px-[18px] py-3 shadow-xl text-sm font-semibold">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#14373b" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"></path></svg>
                        Settings saved
                    </div>
                )}
            </div>
        </div>
    )
}

export default Settings
