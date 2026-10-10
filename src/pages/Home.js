import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import Sidebar from "../components/Sidebar"
import { useAuth } from "../context/AuthContext"
import { salesAPI, productsAPI, shopsAPI } from "../api/api"
import DashboardShimmer from "../features/shimmers/DashboardShimmer"

const RANGES = [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: '7d', label: '7 days' },
    { key: '30d', label: '30 days' },
]

const COMPARISON_LABEL = { today: 'vs yesterday', yesterday: 'vs day before', '7d': 'vs last week', '30d': 'vs last month' }

const asArray = (data) => Array.isArray(data) ? data : (data?.results || [])
const k = (n) => Math.round(n || 0).toLocaleString('en-KE')
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
const toISODate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

function getRangeDates(range) {
    const today = startOfDay(new Date())
    if (range === 'today') return { from: today, to: today }
    if (range === 'yesterday') {
        const y = new Date(today); y.setDate(y.getDate() - 1)
        return { from: y, to: y }
    }
    const days = range === '7d' ? 6 : 29
    const from = new Date(today); from.setDate(from.getDate() - days)
    return { from, to: today }
}

function getPreviousRangeDates(range) {
    const { from, to } = getRangeDates(range)
    const spanDays = Math.round((to - from) / 86400000) + 1
    const prevTo = new Date(from); prevTo.setDate(prevTo.getDate() - 1)
    const prevFrom = new Date(prevTo); prevFrom.setDate(prevFrom.getDate() - spanDays + 1)
    return { from: prevFrom, to: prevTo }
}

function deltaPct(current, previous) {
    if (!previous) return null
    return ((current - previous) / previous) * 100
}

function formatDelta(pct) {
    if (pct === null) return '—'
    const arrow = pct >= 0 ? '↑' : '↓'
    return `${arrow} ${Math.abs(pct).toFixed(1)}%`
}

function bucketize(transactions, from, to, hourly) {
    if (hourly) {
        const hours = Array.from({ length: 15 }, (_, i) => i + 7) // 07:00 - 21:00
        return hours.map((h) => ({
            label: String(h).padStart(2, '0'),
            fullLabel: `${String(h).padStart(2, '0')}:00`,
            value: transactions
                .filter((t) => new Date(t.created_at).getHours() === h)
                .reduce((s, t) => s + parseFloat(t.total || 0), 0),
        }))
    }
    const days = []
    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) days.push(new Date(d))
    return days.map((day) => {
        const key = toISODate(day)
        return {
            // Just the day number - "DD/MM" doesn't fit a 30-bar-wide slot.
            label: String(day.getDate()),
            fullLabel: day.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
            value: transactions
                .filter((t) => (t.created_at || '').slice(0, 10) === key)
                .reduce((s, t) => s + parseFloat(t.total || 0), 0),
        }
    })
}

function sumQty(t) {
    return (t.items || []).reduce((s, i) => s + (i.quantity || 0), 0)
}

function Home() {
    const navigate = useNavigate()
    const { user, currentShop } = useAuth()
    const [range, setRange] = useState('today')
    const [transactions, setTransactions] = useState([])
    const [prevTransactions, setPrevTransactions] = useState([])
    const [products, setProducts] = useState([])
    const [members, setMembers] = useState([])
    const [openShifts, setOpenShifts] = useState([])
    const [recentClosedShifts, setRecentClosedShifts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const loadRangeData = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const { from, to } = getRangeDates(range)
            const prev = getPreviousRangeDates(range)
            const [txRes, prevTxRes, prodRes, openShiftRes] = await Promise.all([
                salesAPI.getTransactions({ date_from: toISODate(from), date_to: toISODate(to) }),
                salesAPI.getTransactions({ date_from: toISODate(prev.from), date_to: toISODate(prev.to) }),
                productsAPI.getAll(),
                salesAPI.getShifts({ status: 'open' }),
            ])
            setTransactions(asArray(txRes.data))
            setPrevTransactions(asArray(prevTxRes.data))
            setProducts(asArray(prodRes.data))
            setOpenShifts(asArray(openShiftRes.data))
        } catch (err) {
            setError('Failed to load dashboard data')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }, [range])

    useEffect(() => { loadRangeData() }, [loadRangeData])

    // Staff roster and recent shift closes don't depend on the date range.
    useEffect(() => {
        if (!currentShop?.id) return
        shopsAPI.getMembers(currentShop.id).then((r) => setMembers(asArray(r.data))).catch(() => {})
        salesAPI.getShifts({ status: 'closed' }).then((r) => setRecentClosedShifts(asArray(r.data).slice(0, 5))).catch(() => {})
    }, [currentShop?.id])

    const totalSales = transactions.reduce((s, t) => s + parseFloat(t.total || 0), 0)
    const prevTotalSales = prevTransactions.reduce((s, t) => s + parseFloat(t.total || 0), 0)
    const txCount = transactions.length
    const prevTxCount = prevTransactions.length
    const avgSale = txCount ? totalSales / txCount : 0
    const prevAvgSale = prevTxCount ? prevTotalSales / prevTxCount : 0

    const lowStockItems = products.filter((p) => p.is_low_stock)

    // Payment breakdown - apportions split-payment lines instead of ignoring them.
    let cashTotal = 0, mpesaTotal = 0, cashCount = 0, mpesaCount = 0
    transactions.forEach((t) => {
        if (t.payment_method === 'cash') { cashTotal += parseFloat(t.total || 0); cashCount++ }
        else if (t.payment_method === 'mpesa') { mpesaTotal += parseFloat(t.total || 0); mpesaCount++ }
        else if (t.payment_method === 'split' && Array.isArray(t.payment_details)) {
            let touchedCash = false, touchedMpesa = false
            t.payment_details.forEach((d) => {
                const amt = parseFloat(d.amount || 0)
                if (d.method === 'mpesa') { mpesaTotal += amt; touchedMpesa = true }
                else { cashTotal += amt; touchedCash = true }
            })
            if (touchedCash) cashCount++
            if (touchedMpesa) mpesaCount++
        }
    })

    // Top selling by revenue, computed from this range's line items.
    const productStats = {}
    transactions.forEach((t) => {
        (t.items || []).forEach((item) => {
            const key = item.product_name
            if (!productStats[key]) productStats[key] = { qty: 0, amt: 0 }
            productStats[key].qty += item.quantity || 0
            productStats[key].amt += parseFloat(item.subtotal ?? (item.quantity * item.unit_price)) || 0
        })
    })
    const topProducts = Object.entries(productStats)
        .sort((a, b) => b[1].amt - a[1].amt)
        .slice(0, 5)
        .map(([name, stats]) => ({ name, ...stats }))
    const topMax = topProducts[0]?.amt || 1

    // Sales chart - hourly for Today/Yesterday, daily for 7d/30d, with the
    // equivalent previous period bucketed the same way for comparison bars.
    const hourly = range === 'today' || range === 'yesterday'
    const { from: rangeFrom, to: rangeTo } = getRangeDates(range)
    const prevRange = getPreviousRangeDates(range)
    const nowBuckets = bucketize(transactions, rangeFrom, rangeTo, hourly)
    const prevBuckets = bucketize(prevTransactions, prevRange.from, prevRange.to, hourly)
    const chartMax = Math.max(1, ...nowBuckets.map((b) => b.value), ...prevBuckets.map((b) => b.value))
    const bars = nowBuckets.map((b, i) => ({
        label: b.label,
        fullLabel: b.fullLabel,
        now: b.value,
        nowPct: (b.value / chartMax * 100) + '%',
        prevPct: ((prevBuckets[i]?.value || 0) / chartMax * 100) + '%',
    }))
    // Cap the number of visible axis labels so dense buckets (30 daily bars)
    // don't force the row wider than its container.
    const labelStep = Math.max(1, Math.ceil(bars.length / 10))
    const peakBar = bars.reduce((max, b) => (!max || b.now > max.now) ? b : max, null)

    // Staff performance for the selected range, cross-referenced against
    // who currently has an open shift (shop-wide, not just the viewer's own).
    const staff = members.map((m) => {
        const staffTx = transactions.filter((t) => t.cashier === m.user.id)
        return {
            id: m.user.id,
            name: `${m.user.first_name || ''} ${m.user.last_name || ''}`.trim() || m.user.username,
            role: m.role,
            onDuty: openShifts.some((sh) => sh.cashier === m.user.id),
            sales: staffTx.reduce((s, t) => s + parseFloat(t.total || 0), 0),
            txCount: staffTx.length,
        }
    }).sort((a, b) => b.sales - a.sales)

    // Prefer the roster's real name over the raw username (currently an
    // email address) when we have it.
    const nameById = Object.fromEntries(staff.map((s) => [s.id, s.name]))
    const staffName = (cashierId, fallbackName) => nameById[cashierId] || fallbackName || 'Unknown'

    // Real activity feed from actual sales, refunds and shift closes - no
    // synthetic log, since none of that is tracked as a stored audit trail yet.
    const activity = [
        ...transactions.filter((t) => t.status === 'completed').map((t) => ({
            time: t.created_at,
            who: staffName(t.cashier, t.cashier_name),
            what: `sold ${sumQty(t)} item${sumQty(t) === 1 ? '' : 's'} · ${
                t.payment_method === 'mpesa' ? `M-Pesa ${t.mpesa_reference || ''}` : t.payment_method === 'split' ? 'split payment' : 'cash'
            }`,
            amt: `KSh ${k(t.total)}`,
            dot: '#14373b',
        })),
        ...transactions.filter((t) => t.status === 'refunded').map((t) => ({
            time: t.updated_at || t.created_at,
            who: staffName(t.cashier, t.cashier_name),
            what: `refunded transaction ${t.transaction_id}`,
            amt: `-KSh ${k(t.total)}`,
            dot: '#ed8674',
        })),
        ...recentClosedShifts.map((sh) => ({
            time: sh.ended_at || sh.updated_at,
            who: staffName(sh.cashier, sh.cashier_name),
            what: `closed shift with a ${parseFloat(sh.cash_difference || 0) >= 0 ? '+' : '-'}KSh ${k(Math.abs(sh.cash_difference || 0))} variance`,
            amt: `KSh ${k(sh.total_sales || 0)}`,
            dot: '#d98b2b',
        })),
    ].filter((a) => a.time).sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 8)

    const greeting = (() => {
        const h = new Date().getHours()
        const first = user?.first_name || user?.username || 'there'
        if (h < 12) return `Good morning, ${first}`
        if (h < 17) return `Good afternoon, ${first}`
        return `Good evening, ${first}`
    })()

    return (
        <div className="flex min-h-screen bg-brand-surface font-sans text-brand-ink">
            <Sidebar />

            <div className="flex-1 min-w-0">
                <header className="sticky top-0 z-20 bg-brand-surface/[0.88] backdrop-blur-md border-b border-brand-ink/[0.09]">
                    <div className="flex items-center gap-4 px-8 py-3.5">
                        <label className="flex-1 max-w-[440px] flex items-center gap-2.5 bg-white border border-brand-ink/[0.12] rounded-[11px] px-3 focus-within:border-brand-ink transition-colors">
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="opacity-50 flex-none"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg>
                            <input type="text" placeholder="Search products, receipts, customers" className="flex-1 min-w-0 border-0 outline-none bg-transparent text-sm py-2.5" />
                        </label>
                        <div className="ml-auto flex items-center gap-2.5">
                            <button
                                aria-label="Notifications"
                                onClick={() => navigate('/inventory')}
                                className="relative w-10 h-10 grid place-items-center bg-white border border-brand-ink/[0.12] rounded-[11px] cursor-pointer hover:bg-brand-surface transition-colors"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0"></path></svg>
                                {lowStockItems.length > 0 && (
                                    <span className="absolute top-2 right-2.5 w-[7px] h-[7px] rounded-full bg-brand-accent ring-2 ring-white" />
                                )}
                            </button>
                            <div className="w-px h-7 bg-brand-ink/[0.12] mx-1" />
                            <button onClick={() => navigate('/profile')} className="flex items-center gap-2.5 cursor-pointer">
                                <span className="w-[38px] h-[38px] rounded-full bg-brand-ink text-brand-surface grid place-items-center text-[13px] font-semibold">
                                    {(user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase()}{(user?.last_name?.[0] || '').toUpperCase()}
                                </span>
                                <span className="text-left hidden md:block">
                                    <span className="block text-[13.5px] font-semibold">{user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.username}</span>
                                    <span className="block text-xs text-brand-ink/55 capitalize">{currentShop?.role}</span>
                                </span>
                            </button>
                        </div>
                    </div>
                </header>

                <main className="px-8 pt-7 pb-12">
                    {error && (
                        <div className="mb-5 px-4 py-3 rounded-lg bg-[#c8553d]/10 text-[#c8553d] text-sm">{error}</div>
                    )}

                    {loading ? <DashboardShimmer /> : (
                        <div className="grid gap-5">

                            <div className="flex items-end justify-between gap-5 flex-wrap">
                                <div>
                                    <div className="text-[13px] text-brand-ink/55">
                                        {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                    </div>
                                    <h1 className="text-[28px] font-semibold tracking-[-0.03em] mt-1">{greeting}</h1>
                                </div>
                                <div className="flex gap-1 p-1 bg-white border border-brand-ink/[0.12] rounded-xl">
                                    {RANGES.map((r) => (
                                        <button
                                            key={r.key}
                                            onClick={() => setRange(r.key)}
                                            className={`border-0 text-[13.5px] font-semibold px-3.5 py-2 rounded-[9px] cursor-pointer transition-colors ${
                                                range === r.key ? 'bg-brand-ink text-brand-surface' : 'bg-transparent text-brand-ink/60'
                                            }`}
                                        >
                                            {r.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                                <div className="bg-brand-ink text-brand-surface rounded-2xl px-[22px] py-5 grid gap-3.5">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[13px] font-medium text-brand-surface/70">Total sales</span>
                                        <span className="text-xs font-semibold text-brand-accent">{formatDelta(deltaPct(totalSales, prevTotalSales))} {COMPARISON_LABEL[range]}</span>
                                    </div>
                                    <div className="text-[30px] font-semibold tracking-[-0.035em] leading-none">
                                        <span className="text-base font-medium opacity-60 mr-1">KSh</span>{k(totalSales)}
                                    </div>
                                </div>
                                <div className="bg-white border border-brand-ink/[0.09] rounded-2xl px-[22px] py-5 grid gap-3.5">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[13px] font-medium text-brand-ink/60">Transactions</span>
                                        <span className="text-xs font-semibold text-[#2f7a5f]">{formatDelta(deltaPct(txCount, prevTxCount))}</span>
                                    </div>
                                    <div className="text-[30px] font-semibold tracking-[-0.035em] leading-none">{k(txCount)}</div>
                                    <div className="text-[12.5px] text-brand-ink/55">{txCount ? 'Updated live' : 'No receipts issued'}</div>
                                </div>
                                <div className="bg-white border border-brand-ink/[0.09] rounded-2xl px-[22px] py-5 grid gap-3.5">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[13px] font-medium text-brand-ink/60">Average sale</span>
                                        <span className="text-xs font-semibold text-[#2f7a5f]">{formatDelta(deltaPct(avgSale, prevAvgSale))}</span>
                                    </div>
                                    <div className="text-[30px] font-semibold tracking-[-0.035em] leading-none">
                                        <span className="text-base font-medium opacity-50 mr-1">KSh</span>{k(avgSale)}
                                    </div>
                                    <div className="text-[12.5px] text-brand-ink/55">{COMPARISON_LABEL[range]}</div>
                                </div>
                                <div className="bg-white border border-brand-ink/[0.09] rounded-2xl px-[22px] py-5 grid gap-3.5">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[13px] font-medium text-brand-ink/60">Low stock</span>
                                        <button onClick={() => navigate('/inventory')} className="text-xs font-semibold underline">Review</button>
                                    </div>
                                    <div className="text-[30px] font-semibold tracking-[-0.035em] leading-none" style={{ color: lowStockItems.length ? '#c8553d' : '#14373b' }}>
                                        {lowStockItems.length}
                                    </div>
                                    <div className="text-[12.5px] text-brand-ink/55">{lowStockItems.length ? `${lowStockItems.length} item${lowStockItems.length === 1 ? '' : 's'} below reorder point` : 'Everything above reorder point'}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
                                <section className="bg-white border border-brand-ink/[0.09] rounded-2xl p-6">
                                    <div className="flex justify-between items-baseline gap-3">
                                        <div>
                                            <h2 className="text-base font-semibold tracking-[-0.01em]">{hourly ? 'Sales by hour' : 'Sales by day'}</h2>
                                            <div className="text-[12.5px] text-brand-ink/55 mt-0.5">
                                                {txCount === 0 ? 'No sales recorded yet' : peakBar ? `Peak ${hourly ? 'at' : 'on'} ${peakBar.fullLabel} · KSh ${k(peakBar.now)}` : ''}
                                            </div>
                                        </div>
                                        <div className="flex gap-3.5 text-xs text-brand-ink/60">
                                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-brand-ink" />{RANGES.find((r) => r.key === range)?.label}</span>
                                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-brand-ink/[0.16]" />{COMPARISON_LABEL[range].replace('vs ', '')}</span>
                                        </div>
                                    </div>
                                    <div className={`flex items-end h-[220px] mt-6 px-1 ${bars.length > 15 ? 'gap-1' : 'gap-2'}`}>
                                        {bars.map((b, i) => (
                                            <div key={i} className="flex-1 flex flex-col items-center min-w-0 h-full overflow-hidden">
                                                <div className="flex-1 w-full flex items-end justify-center gap-[3px]">
                                                    <div className="w-[38%] rounded-t bg-brand-ink/[0.14]" style={{ height: b.prevPct }} />
                                                    <div
                                                        title={`KSh ${k(b.now)}`}
                                                        className="w-[38%] rounded-t"
                                                        style={{ height: b.nowPct, background: peakBar === b ? '#ed8674' : '#14373b' }}
                                                    />
                                                </div>
                                                <div className="h-6 pt-1.5 font-mono text-[10.5px] text-brand-ink/45 whitespace-nowrap">
                                                    {i % labelStep === 0 ? b.label : ''}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section className="bg-white border border-brand-ink/[0.09] rounded-2xl p-6 flex flex-col">
                                    <h2 className="text-base font-semibold tracking-[-0.01em]">Payment methods</h2>
                                    <div className="text-[12.5px] text-brand-ink/55 mt-0.5">
                                        {totalSales ? `${Math.round(mpesaTotal / totalSales * 100)}% of revenue via M-Pesa` : 'No payments yet'}
                                    </div>
                                    <div className="flex h-2.5 rounded-full overflow-hidden mt-5 bg-brand-ink/[0.08]">
                                        <div style={{ width: totalSales ? `${mpesaTotal / totalSales * 100}%` : '0%' }} className="bg-brand-ink" />
                                        <div style={{ width: totalSales ? `${cashTotal / totalSales * 100}%` : '0%' }} className="bg-brand-accent" />
                                    </div>
                                    <div className="grid gap-2.5 mt-5">
                                        <div className="flex items-center gap-3 p-3.5 bg-brand-surface rounded-xl">
                                            <span className="w-[34px] h-[34px] rounded-[9px] bg-brand-ink text-brand-surface grid place-items-center flex-none">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="2" width="12" height="20" rx="2"></rect><path d="M11 18h2"></path></svg>
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-semibold">M-Pesa</div>
                                                <div className="text-xs text-brand-ink/55">{mpesaCount} transaction{mpesaCount === 1 ? '' : 's'}</div>
                                            </div>
                                            <div className="font-mono text-[13.5px] font-medium">KSh {k(mpesaTotal)}</div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3.5 bg-brand-surface rounded-xl">
                                            <span className="w-[34px] h-[34px] rounded-[9px] bg-brand-accent text-brand-ink grid place-items-center flex-none">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="2.5"></circle></svg>
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-semibold">Cash</div>
                                                <div className="text-xs text-brand-ink/55">{cashCount} transaction{cashCount === 1 ? '' : 's'}</div>
                                            </div>
                                            <div className="font-mono text-[13.5px] font-medium">KSh {k(cashTotal)}</div>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                <section className="bg-white border border-brand-ink/[0.09] rounded-2xl p-6">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-base font-semibold tracking-[-0.01em]">Top selling</h2>
                                        <button onClick={() => navigate('/reports')} className="text-[12.5px] font-semibold text-brand-ink/60">See report</button>
                                    </div>
                                    {topProducts.length > 0 ? (
                                        <div className="grid gap-1 mt-3.5">
                                            {topProducts.map((t, i) => (
                                                <div key={t.name} className="grid grid-cols-[20px_minmax(0,1fr)_auto] gap-3 items-center py-2.5">
                                                    <span className="font-mono text-xs text-brand-ink/40">{String(i + 1).padStart(2, '0')}</span>
                                                    <div className="min-w-0">
                                                        <div className="flex justify-between gap-2 text-[13.5px]">
                                                            <span className="font-semibold truncate">{t.name}</span>
                                                            <span className="text-brand-ink/55 flex-none">{t.qty} sold</span>
                                                        </div>
                                                        <div className="h-1 rounded-full bg-brand-ink/[0.08] mt-1.5">
                                                            <div className="h-full rounded-full" style={{ width: `${t.amt / topMax * 100}%`, background: i === 0 ? '#ed8674' : '#14373b' }} />
                                                        </div>
                                                    </div>
                                                    <span className="font-mono text-xs min-w-[64px] text-right">{k(t.amt)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 px-2">
                                            <div className="text-sm font-semibold">No sales yet {range === 'today' ? 'today' : 'in this period'}</div>
                                            <p className="text-[13px] text-brand-ink/55 mt-1.5 mb-4">Your best sellers will rank here as soon as the first receipt prints.</p>
                                            <button onClick={() => navigate('/sales')} className="bg-brand-ink text-brand-surface border-0 text-[13.5px] font-semibold px-4 py-2.5 rounded-[10px] cursor-pointer hover:bg-brand-ink/90 transition-colors">Make first sale</button>
                                        </div>
                                    )}
                                </section>

                                <section className="bg-white border border-brand-ink/[0.09] rounded-2xl p-6">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-base font-semibold tracking-[-0.01em]">Inventory alerts</h2>
                                        <span
                                            className="text-xs font-semibold px-2.5 py-[3px] rounded-full"
                                            style={{ background: lowStockItems.length ? 'rgba(200,85,61,0.12)' : 'rgba(47,122,95,0.12)', color: lowStockItems.length ? '#b04a34' : '#2f7a5f' }}
                                        >
                                            {lowStockItems.length ? `${lowStockItems.length} items` : 'All clear'}
                                        </span>
                                    </div>
                                    {lowStockItems.length > 0 ? (
                                        <div className="grid gap-2 mt-4">
                                            {lowStockItems.slice(0, 4).map((item) => (
                                                <div key={item.id} className="flex items-center gap-3 px-3 py-2.5 border border-brand-ink/[0.08] rounded-[11px]">
                                                    <span className="w-2 h-2 rounded-full flex-none" style={{ background: item.stock_quantity === 0 ? '#c8553d' : '#d98b2b' }} />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-[13.5px] font-semibold truncate">{item.name}</div>
                                                        <div className="text-xs text-brand-ink/55">Reorder at {item.reorder_level}</div>
                                                    </div>
                                                    <span className="text-[13px] font-semibold" style={{ color: item.stock_quantity === 0 ? '#c8553d' : '#d98b2b' }}>{item.stock_quantity} left</span>
                                                    <button onClick={() => navigate('/inventory')} className="bg-transparent border border-brand-ink/[0.16] text-xs font-semibold px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-brand-surface transition-colors">Restock</button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 px-2">
                                            <div className="text-sm font-semibold">All items well stocked</div>
                                            <p className="text-[13px] text-brand-ink/55 mt-1.5">Set reorder points in Inventory to get warned early.</p>
                                        </div>
                                    )}
                                </section>

                                <section className="bg-white border border-brand-ink/[0.09] rounded-2xl p-6">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-base font-semibold tracking-[-0.01em]">Staff today</h2>
                                        <button onClick={() => navigate('/settings')} className="text-[12.5px] font-semibold text-brand-ink/60">Manage</button>
                                    </div>
                                    <div className="grid gap-1 mt-3">
                                        {staff.map((p) => (
                                            <div key={p.id} className="flex items-center gap-3 py-2.5 border-b border-brand-ink/[0.07] last:border-b-0">
                                                <span className="relative w-9 h-9 rounded-full bg-brand-ink text-brand-surface grid place-items-center text-xs font-semibold flex-none">
                                                    {p.name.slice(0, 2).toUpperCase()}
                                                    <span
                                                        className="absolute -right-px -bottom-px w-2.5 h-2.5 rounded-full ring-2 ring-white"
                                                        style={{ background: p.onDuty ? '#2f7a5f' : 'rgba(20,55,59,0.3)' }}
                                                    />
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[13.5px] font-semibold truncate">{p.name}</div>
                                                    <div className="text-xs text-brand-ink/55 capitalize">{p.role} · {p.onDuty ? 'on duty' : 'off shift'}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-mono text-xs">KSh {k(p.sales)}</div>
                                                    <div className="text-[11.5px] text-brand-ink/50">{p.txCount} sales</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>

                            <section className="bg-white border border-brand-ink/[0.09] rounded-2xl p-6">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-base font-semibold tracking-[-0.01em]">Activity</h2>
                                    <button onClick={() => navigate('/transactions')} className="text-[12.5px] font-semibold text-brand-ink/60">All transactions</button>
                                </div>
                                {activity.length > 0 ? (
                                    <div className="grid mt-2.5">
                                        {activity.map((n, i) => (
                                            <div key={i} className="grid grid-cols-[58px_10px_minmax(0,1fr)_auto] gap-3.5 items-center py-2.5 border-b border-brand-ink/[0.07] last:border-b-0">
                                                <span className="font-mono text-xs text-brand-ink/50">{new Date(n.time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                                                <span className="w-2 h-2 rounded-full" style={{ background: n.dot }} />
                                                <span className="text-[13.5px] truncate"><strong className="font-semibold">{n.who}</strong> {n.what}</span>
                                                <span className="font-mono text-xs text-brand-ink/70">{n.amt}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-7 px-2 text-center text-[13px] text-brand-ink/55">Nothing yet (sales, refunds and shift changes will appear here).</div>
                                )}
                            </section>

                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}

export default Home
