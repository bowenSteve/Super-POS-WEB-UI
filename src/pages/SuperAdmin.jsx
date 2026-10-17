import { useState, useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { platformAdminAPI } from '../api/api'

const getRoleBadgeStyle = (role) => {
    const styles = {
        owner: { background: '#14373b', color: '#f0f8f5' },
        manager: { background: 'rgba(237,134,116,0.18)', color: '#14373b' },
        cashier: { background: 'rgba(47,122,95,0.12)', color: '#2f7a5f' },
        inventory: { background: 'rgba(20,55,59,0.08)', color: '#14373b' },
    }
    return styles[role] || { background: 'rgba(20,55,59,0.08)', color: '#14373b' }
}

function Pagination({ page, setPage, pageSize, setPageSize, totalCount, totalPages }) {
    if (totalCount === 0) return null
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
            <div className="text-sm text-brand-ink/55">
                Showing <span className="font-semibold text-brand-ink">{(page - 1) * pageSize + 1}</span>
                {'–'}
                <span className="font-semibold text-brand-ink">{Math.min(page * pageSize, totalCount)}</span> of{' '}
                <span className="font-semibold text-brand-ink">{totalCount}</span>
            </div>
            <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-brand-ink/60">
                    Show
                    <select
                        className="h-9 px-2.5 border border-brand-ink/[0.16] rounded-lg outline-none focus:border-brand-ink bg-white text-sm transition-colors"
                        value={pageSize}
                        onChange={(e) => { setPageSize(parseInt(e.target.value)); setPage(1) }}
                    >
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </label>
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="h-9 px-3 border border-brand-ink/[0.16] rounded-lg text-sm font-semibold hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                        Prev
                    </button>
                    <span className="text-sm text-brand-ink/60 px-1">
                        Page <span className="font-semibold text-brand-ink">{page}</span> of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="h-9 px-3 border border-brand-ink/[0.16] rounded-lg text-sm font-semibold hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    )
}

function SuperAdmin() {
    const { isAuthenticated, loading, user, logout } = useAuth()
    const navigate = useNavigate()

    const [overview, setOverview] = useState(null)
    const [view, setView] = useState('shops')

    const [shops, setShops] = useState([])
    const [shopsLoading, setShopsLoading] = useState(true)
    const [shopsSearch, setShopsSearch] = useState('')
    const [shopsPage, setShopsPage] = useState(1)
    const [shopsPageSize, setShopsPageSize] = useState(20)
    const [shopsCount, setShopsCount] = useState(0)
    const [shopsTotalPages, setShopsTotalPages] = useState(1)

    const [users, setUsers] = useState([])
    const [usersLoading, setUsersLoading] = useState(true)
    const [usersSearch, setUsersSearch] = useState('')
    const [usersPage, setUsersPage] = useState(1)
    const [usersPageSize, setUsersPageSize] = useState(20)
    const [usersCount, setUsersCount] = useState(0)
    const [usersTotalPages, setUsersTotalPages] = useState(1)

    const isAdmin = !!user?.is_superuser

    useEffect(() => {
        if (!isAdmin) return
        platformAdminAPI.getOverview().then((res) => setOverview(res.data)).catch(() => {})
    }, [isAdmin])

    useEffect(() => {
        if (!isAdmin || view !== 'shops') return
        setShopsLoading(true)
        const timer = setTimeout(() => {
            platformAdminAPI.getShops({ page: shopsPage, page_size: shopsPageSize, search: shopsSearch || undefined })
                .then((res) => {
                    setShops(res.data.results || [])
                    setShopsCount(res.data.count || 0)
                    setShopsTotalPages(res.data.total_pages || 1)
                })
                .finally(() => setShopsLoading(false))
        }, shopsSearch ? 300 : 0)
        return () => clearTimeout(timer)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdmin, view, shopsPage, shopsPageSize, shopsSearch])

    useEffect(() => {
        if (!isAdmin || view !== 'users') return
        setUsersLoading(true)
        const timer = setTimeout(() => {
            platformAdminAPI.getUsers({ page: usersPage, page_size: usersPageSize, search: usersSearch || undefined })
                .then((res) => {
                    setUsers(res.data.results || [])
                    setUsersCount(res.data.count || 0)
                    setUsersTotalPages(res.data.total_pages || 1)
                })
                .finally(() => setUsersLoading(false))
        }, usersSearch ? 300 : 0)
        return () => clearTimeout(timer)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdmin, view, usersPage, usersPageSize, usersSearch])

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

    if (!isAdmin) {
        return <Navigate to="/dashboard" replace />
    }

    const formatCurrency = (amount) => `KSh ${Number(amount || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`

    return (
        <div className="min-h-screen bg-brand-surface font-sans text-brand-ink">
            <header className="sticky top-0 z-20 bg-brand-ink text-brand-surface">
                <div className="flex items-center gap-4 px-8 py-4">
                    <div className="flex items-center gap-2.5">
                        <span className="w-[26px] h-[26px] rounded-lg bg-brand-surface grid place-items-center">
                            <span className="w-[9px] h-[9px] rounded-full bg-brand-accent" />
                        </span>
                        <span className="text-[17px] font-semibold tracking-[-0.02em]">Singla-POS</span>
                        <span className="text-brand-surface/40">·</span>
                        <span className="text-[15px] text-brand-surface/70">Platform admin</span>
                    </div>
                    <div className="flex-1" />
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-3.5 py-2 text-sm font-semibold text-brand-surface/80 hover:text-brand-surface transition-colors cursor-pointer"
                    >
                        Back to app
                    </button>
                    <button
                        onClick={() => { logout(); navigate('/login') }}
                        className="px-3.5 py-2 bg-brand-surface/10 hover:bg-brand-surface/[0.16] rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                    >
                        Log out
                    </button>
                </div>
            </header>

            <main className="px-8 py-6 max-w-[1240px] mx-auto">
                {/* Overview */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white border border-brand-ink/[0.09] rounded-2xl p-5">
                        <div className="text-[12.5px] text-brand-ink/55">Shops</div>
                        <div className="text-2xl font-semibold tracking-[-0.03em] mt-1.5">{overview?.shops_count ?? '—'}</div>
                    </div>
                    <div className="bg-white border border-brand-ink/[0.09] rounded-2xl p-5">
                        <div className="text-[12.5px] text-brand-ink/55">Users</div>
                        <div className="text-2xl font-semibold tracking-[-0.03em] mt-1.5">{overview?.users_count ?? '—'}</div>
                    </div>
                    <div className="bg-white border border-brand-ink/[0.09] rounded-2xl p-5">
                        <div className="text-[12.5px] text-brand-ink/55">Products</div>
                        <div className="text-2xl font-semibold tracking-[-0.03em] mt-1.5">{overview?.products_count ?? '—'}</div>
                    </div>
                    <div className="bg-brand-ink text-brand-surface rounded-2xl p-5">
                        <div className="text-[12.5px] text-brand-surface/60">Platform revenue</div>
                        <div className="text-2xl font-semibold tracking-[-0.03em] mt-1.5">
                            {overview ? formatCurrency(overview.total_revenue) : '—'}
                        </div>
                        <div className="text-xs text-brand-surface/50 mt-1">{overview?.transactions_count ?? 0} completed transactions</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-5 flex items-center gap-1 bg-white border border-brand-ink/[0.09] rounded-xl p-1 w-fit">
                    <button
                        onClick={() => setView('shops')}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors cursor-pointer ${view === 'shops' ? 'bg-brand-ink text-brand-surface' : 'text-brand-ink/55 hover:bg-brand-surface'}`}
                    >
                        Shops
                    </button>
                    <button
                        onClick={() => setView('users')}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors cursor-pointer ${view === 'users' ? 'bg-brand-ink text-brand-surface' : 'text-brand-ink/55 hover:bg-brand-surface'}`}
                    >
                        Users
                    </button>
                </div>

                {view === 'shops' && (
                    <>
                        <div className="bg-white border border-brand-ink/[0.09] rounded-2xl p-3.5 mb-5">
                            <input
                                type="text"
                                value={shopsSearch}
                                onChange={(e) => { setShopsSearch(e.target.value); setShopsPage(1) }}
                                placeholder="Search by shop name, slug, or owner email…"
                                className="w-full h-[42px] px-3.5 bg-brand-surface rounded-xl outline-none focus:ring-1 focus:ring-brand-ink text-sm transition-shadow"
                            />
                        </div>

                        {shopsLoading ? (
                            <div className="bg-white border border-brand-ink/[0.09] rounded-2xl p-12 text-center text-brand-ink/55">Loading…</div>
                        ) : (
                            <div className="bg-white border border-brand-ink/[0.09] rounded-2xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-[13.5px]">
                                        <thead className="bg-[#fafcfb] border-b border-brand-ink/[0.08]">
                                            <tr>
                                                <th className="text-left px-[18px] py-3 text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50">Shop</th>
                                                <th className="text-left px-3 py-3 text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50">Owner</th>
                                                <th className="text-left px-3 py-3 text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50">Staff</th>
                                                <th className="text-left px-3 py-3 text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50">Products</th>
                                                <th className="text-left px-3 py-3 text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50">Transactions</th>
                                                <th className="text-left px-3 py-3 text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50">Status</th>
                                                <th className="text-left px-[18px] py-3 text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50">Created</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-brand-ink/[0.06]">
                                            {shops.length === 0 ? (
                                                <tr><td colSpan="7" className="px-4 py-12 text-center text-brand-ink/55">No shops found</td></tr>
                                            ) : (
                                                shops.map((shop) => (
                                                    <tr key={shop.id} className="hover:bg-brand-surface/60 transition-colors">
                                                        <td className="px-[18px] py-3">
                                                            <div className="font-semibold">{shop.name}</div>
                                                            <div className="font-mono text-xs text-brand-ink/50">{shop.slug}</div>
                                                        </td>
                                                        <td className="px-3 py-3 text-brand-ink/65">{shop.owner_email}</td>
                                                        <td className="px-3 py-3">{shop.member_count}</td>
                                                        <td className="px-3 py-3">{shop.product_count}</td>
                                                        <td className="px-3 py-3">{shop.transaction_count}</td>
                                                        <td className="px-3 py-3">
                                                            <span
                                                                className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold"
                                                                style={shop.is_active ? { background: 'rgba(47,122,95,0.12)', color: '#2f7a5f' } : { background: 'rgba(20,55,59,0.08)', color: 'rgba(20,55,59,0.6)' }}
                                                            >
                                                                {shop.is_active ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </td>
                                                        <td className="px-[18px] py-3 text-brand-ink/55">{new Date(shop.created_at).toLocaleDateString()}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                        <Pagination page={shopsPage} setPage={setShopsPage} pageSize={shopsPageSize} setPageSize={setShopsPageSize} totalCount={shopsCount} totalPages={shopsTotalPages} />
                    </>
                )}

                {view === 'users' && (
                    <>
                        <div className="bg-white border border-brand-ink/[0.09] rounded-2xl p-3.5 mb-5">
                            <input
                                type="text"
                                value={usersSearch}
                                onChange={(e) => { setUsersSearch(e.target.value); setUsersPage(1) }}
                                placeholder="Search by name or email…"
                                className="w-full h-[42px] px-3.5 bg-brand-surface rounded-xl outline-none focus:ring-1 focus:ring-brand-ink text-sm transition-shadow"
                            />
                        </div>

                        {usersLoading ? (
                            <div className="bg-white border border-brand-ink/[0.09] rounded-2xl p-12 text-center text-brand-ink/55">Loading…</div>
                        ) : (
                            <div className="bg-white border border-brand-ink/[0.09] rounded-2xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-[13.5px]">
                                        <thead className="bg-[#fafcfb] border-b border-brand-ink/[0.08]">
                                            <tr>
                                                <th className="text-left px-[18px] py-3 text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50">User</th>
                                                <th className="text-left px-3 py-3 text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50">Shops &amp; roles</th>
                                                <th className="text-left px-3 py-3 text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50">Verified</th>
                                                <th className="text-left px-[18px] py-3 text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50">Joined</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-brand-ink/[0.06]">
                                            {users.length === 0 ? (
                                                <tr><td colSpan="4" className="px-4 py-12 text-center text-brand-ink/55">No users found</td></tr>
                                            ) : (
                                                users.map((u) => (
                                                    <tr key={u.id} className="hover:bg-brand-surface/60 transition-colors">
                                                        <td className="px-[18px] py-3">
                                                            <div className="font-semibold flex items-center gap-2">
                                                                {u.first_name} {u.last_name}
                                                                {u.is_superuser && (
                                                                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wide" style={{ background: 'rgba(237,134,116,0.18)', color: '#14373b' }}>Admin</span>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-brand-ink/50">{u.email}</div>
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {u.memberships.length === 0 ? (
                                                                    <span className="text-brand-ink/40 text-xs">No shops</span>
                                                                ) : (
                                                                    u.memberships.map((m) => (
                                                                        <span
                                                                            key={m.shop_slug}
                                                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                                                                            style={getRoleBadgeStyle(m.role)}
                                                                            title={m.shop_name}
                                                                        >
                                                                            {m.shop_name} · {m.role}
                                                                        </span>
                                                                    ))
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            {u.email_verified ? (
                                                                <span className="text-xs font-semibold" style={{ color: '#2f7a5f' }}>Verified</span>
                                                            ) : (
                                                                <span className="text-xs text-brand-ink/40">Unverified</span>
                                                            )}
                                                        </td>
                                                        <td className="px-[18px] py-3 text-brand-ink/55">{new Date(u.date_joined).toLocaleDateString()}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                        <Pagination page={usersPage} setPage={setUsersPage} pageSize={usersPageSize} setPageSize={setUsersPageSize} totalCount={usersCount} totalPages={usersTotalPages} />
                    </>
                )}
            </main>
        </div>
    )
}

export default SuperAdmin
