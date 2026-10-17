import { useState, useEffect } from "react"
import { NavLink, Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useShift } from "../context/ShiftContext"
import { usePermissions } from "../hooks/usePermissions"
import { productsAPI } from "../api/api"
import ShiftModal from "./ShiftModal"
import ShopSelector from "./ShopSelector"

function Sidebar() {
    const navigate = useNavigate()
    const { user, logout } = useAuth()
    const { isShiftOpen, currentShift } = useShift()
    const [showShiftModal, setShowShiftModal] = useState(false)
    const [lowStockCount, setLowStockCount] = useState(0)
    const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true')
    const {
        canAccessDashboard,
        canAccessPOS,
        canAccessInventory,
        canAccessCustomers,
        canAccessReports,
        canAccessSettings
    } = usePermissions()

    useEffect(() => {
        if (!canAccessInventory) return
        productsAPI.getAll().then((response) => {
            const data = response.data.results || response.data
            const list = Array.isArray(data) ? data : []
            setLowStockCount(list.filter((p) => p.is_low_stock).length)
        }).catch(() => {})
    }, [canAccessInventory])

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const toggleCollapsed = () => {
        const next = !collapsed
        setCollapsed(next)
        localStorage.setItem('sidebar_collapsed', String(next))
    }

    const formatShiftTime = (dateString) => {
        if (!dateString) return ''
        return new Date(dateString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }

    const navLinkClass = ({ isActive }) =>
        `flex items-center gap-3 rounded-[10px] text-sm font-medium transition-colors relative ${collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'} ${
            isActive
                ? 'bg-brand-surface/10 text-brand-surface'
                : 'text-brand-surface/70 hover:bg-brand-surface/[0.06] hover:text-brand-surface'
        }`

    const sectionLabel = "text-[11px] font-semibold tracking-[0.08em] uppercase text-brand-surface/40 px-3 pb-2"

    return (
        <aside className={`${collapsed ? 'w-[80px]' : 'w-[248px]'} bg-brand-ink text-brand-surface flex flex-col h-screen sticky top-0 p-3.5 font-sans transition-[width] duration-200`}>
            <div className={`flex items-center gap-2 pb-4 pt-1 ${collapsed ? 'flex-col' : 'justify-between px-2.5'}`}>
                <Link to="/dashboard" className="flex items-center gap-2.5 min-w-0 overflow-hidden">
                    <span className="w-[26px] h-[26px] rounded-lg bg-brand-surface grid place-items-center flex-none">
                        <span className="w-[9px] h-[9px] rounded-full bg-brand-accent" />
                    </span>
                    {!collapsed && <span className="text-[19px] font-semibold tracking-[-0.02em] whitespace-nowrap">Singla-POS</span>}
                </Link>
                <button
                    onClick={toggleCollapsed}
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    className="w-7 h-7 grid place-items-center rounded-lg text-brand-surface/55 hover:text-brand-surface hover:bg-brand-surface/[0.08] transition-colors cursor-pointer flex-none"
                >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${collapsed ? 'rotate-180' : ''}`}>
                        <path d="M15 18l-6-6 6-6"></path>
                    </svg>
                </button>
            </div>

            <ShopSelector collapsed={collapsed} />

            {canAccessPOS && (
                <button
                    onClick={() => navigate('/sales')}
                    title={collapsed ? 'New sale' : undefined}
                    className="mt-3.5 flex items-center justify-center gap-2 bg-brand-accent text-brand-ink border-0 rounded-xl py-3 text-sm font-bold cursor-pointer hover:bg-brand-surface transition-colors"
                >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14"></path></svg>
                    {!collapsed && 'New sale'}
                </button>
            )}

            <nav className="mt-5 grid gap-0.5 overflow-y-auto">
                {(canAccessDashboard || canAccessPOS) && (
                    collapsed
                        ? <div className="h-px bg-brand-surface/10 mx-2 mb-2" />
                        : <div className={sectionLabel}>Overview</div>
                )}
                {canAccessDashboard && (
                    <NavLink to="/dashboard" className={navLinkClass} title={collapsed ? 'Dashboard' : undefined}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"></path></svg>
                        {!collapsed && 'Dashboard'}
                    </NavLink>
                )}
                {canAccessPOS && (
                    <NavLink to="/sales" className={navLinkClass} title={collapsed ? 'Sell' : undefined}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="20" r="1.4"></circle><circle cx="18" cy="20" r="1.4"></circle><path d="M2.5 3h2.6l2.4 12.2a1 1 0 0 0 1 .8h9.4a1 1 0 0 0 1-.8L21 7H6"></path></svg>
                        {!collapsed && 'Sell'}
                    </NavLink>
                )}
                {canAccessPOS && (
                    <NavLink to="/transactions" className={navLinkClass} title={collapsed ? 'Transactions' : undefined}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2h12v20l-3-2-3 2-3-2-3 2z"></path><path d="M9 7h6M9 11h6M9 15h4"></path></svg>
                        {!collapsed && 'Transactions'}
                    </NavLink>
                )}

                {(canAccessInventory || canAccessCustomers || canAccessReports) && (
                    collapsed
                        ? <div className="h-px bg-brand-surface/10 mx-2 mt-3 mb-2" />
                        : <div className={`${sectionLabel} pt-4`}>Manage</div>
                )}
                {canAccessInventory && (
                    <NavLink to="/inventory" className={navLinkClass} title={collapsed ? 'Inventory' : undefined}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8 12 3 3 8v8l9 5 9-5z"></path><path d="M3 8l9 5 9-5M12 13v8"></path></svg>
                        {!collapsed && <span className="flex-1">Inventory</span>}
                        {lowStockCount > 0 && !collapsed && (
                            <span className="text-[11px] font-bold bg-brand-accent text-brand-ink px-1.5 py-px rounded-full">{lowStockCount}</span>
                        )}
                        {lowStockCount > 0 && collapsed && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-accent" />
                        )}
                    </NavLink>
                )}
                {canAccessCustomers && (
                    <NavLink to="/customers" className={navLinkClass} title={collapsed ? 'Customers' : undefined}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.5"></circle><path d="M2.5 20a6.5 6.5 0 0 1 13 0"></path><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5"></path></svg>
                        {!collapsed && 'Customers'}
                    </NavLink>
                )}
                {canAccessReports && (
                    <NavLink to="/reports" className={navLinkClass} title={collapsed ? 'Reports' : undefined}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"></path></svg>
                        {!collapsed && 'Reports'}
                    </NavLink>
                )}
            </nav>

            <div className="mt-auto grid gap-0.5 pt-3">
                {canAccessPOS && (
                    <button
                        onClick={() => setShowShiftModal(true)}
                        title={collapsed ? (isShiftOpen ? 'Shift open (tap to close)' : 'No shift open (tap to open)') : undefined}
                        className={`text-left mb-3 rounded-xl cursor-pointer border transition-colors ${collapsed ? 'flex items-center justify-center px-0 py-3' : 'px-3.5 py-3'} ${
                            isShiftOpen
                                ? 'bg-[rgba(111,211,168,0.08)] border-[rgba(111,211,168,0.25)]'
                                : 'bg-brand-surface/[0.04] border-brand-surface/10'
                        }`}
                    >
                        {collapsed ? (
                            <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{
                                    background: isShiftOpen ? '#6fd3a8' : 'rgba(240,248,245,0.4)',
                                    boxShadow: `0 0 0 3px ${isShiftOpen ? 'rgba(111,211,168,0.2)' : 'transparent'}`
                                }}
                            />
                        ) : (
                            <>
                                <span className="flex items-center gap-2 text-[13px] font-semibold">
                                    <span
                                        className="w-2 h-2 rounded-full"
                                        style={{
                                            background: isShiftOpen ? '#6fd3a8' : 'rgba(240,248,245,0.4)',
                                            boxShadow: `0 0 0 3px ${isShiftOpen ? 'rgba(111,211,168,0.2)' : 'transparent'}`
                                        }}
                                    />
                                    {isShiftOpen && currentShift ? `Shift open · ${formatShiftTime(currentShift.started_at)}` : 'No shift open'}
                                </span>
                                <span className="block text-xs text-brand-surface/60 mt-1 pl-4">
                                    {isShiftOpen ? 'Tap to count cash & close' : 'Tap to open a shift'}
                                </span>
                            </>
                        )}
                    </button>
                )}
                {canAccessSettings && (
                    <NavLink to="/settings" className={navLinkClass} title={collapsed ? 'Settings' : undefined}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"></path></svg>
                        {!collapsed && 'Settings'}
                    </NavLink>
                )}
                {user?.is_superuser && (
                    <NavLink to="/super-admin" className={navLinkClass} title={collapsed ? 'Platform admin' : undefined}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 4 6v6c0 5 3.4 8.3 8 9 4.6-.7 8-4 8-9V6z"></path><path d="m9 12 2 2 4-4"></path></svg>
                        {!collapsed && 'Platform admin'}
                    </NavLink>
                )}
                <button
                    className={`flex items-center gap-3 rounded-[10px] text-sm font-medium text-brand-surface/70 hover:bg-brand-surface/[0.06] hover:text-brand-surface transition-colors cursor-pointer ${collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'}`}
                    onClick={handleLogout}
                    title={collapsed ? 'Log out' : undefined}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3"></path></svg>
                    {!collapsed && 'Log out'}
                </button>
            </div>

            <ShiftModal isOpen={showShiftModal} onClose={() => setShowShiftModal(false)} />
        </aside>
    )
}

export default Sidebar
