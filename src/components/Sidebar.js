import { useState } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useShift } from "../context/ShiftContext"
import { usePermissions } from "../hooks/usePermissions"
import ShiftModal from "./ShiftModal"

function Sidebar() {
    const navigate = useNavigate()
    const { logout } = useAuth()
    const { currentShift, isShiftOpen } = useShift()
    const [showShiftModal, setShowShiftModal] = useState(false)
    const {
        canAccessDashboard,
        canAccessPOS,
        canAccessInventory,
        canAccessCustomers,
        canAccessReports,
        canAccessSettings
    } = usePermissions()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const formatShiftTime = (dateString) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }

    const navLinkClass = ({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            isActive
                ? 'bg-pos-hover text-pos-text font-medium'
                : 'text-gray-600 hover:bg-pos-hover hover:text-pos-text'
        }`

    return (
        <aside className="w-[180px] bg-white border-r border-pos-border flex flex-col h-screen sticky top-0">
            <div className="p-4 border-b border-pos-border">
                <h1 className="text-lg font-bold text-pos-text text-center">POS Logo</h1>
            </div>

            <nav className="flex-1 p-3 space-y-1">
                {canAccessDashboard && (
                    <NavLink to="/" className={navLinkClass}>
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                        </svg>
                        <span className="text-sm">Dashboard</span>
                    </NavLink>
                )}
                {canAccessPOS && (
                    <NavLink to="/sales" className={navLinkClass}>
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="9" cy="21" r="1"></circle>
                            <circle cx="20" cy="21" r="1"></circle>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                        <span className="text-sm">New Sales</span>
                    </NavLink>
                )}
                {canAccessPOS && (
                    <NavLink to="/transactions" className={navLinkClass}>
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        <span className="text-sm">Transactions</span>
                    </NavLink>
                )}
                {canAccessInventory && (
                    <NavLink to="/inventory" className={navLinkClass}>
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                            <line x1="12" y1="22.08" x2="12" y2="12"></line>
                        </svg>
                        <span className="text-sm">Inventory</span>
                    </NavLink>
                )}
                {canAccessCustomers && (
                    <NavLink to="/customers" className={navLinkClass}>
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        <span className="text-sm">Customers</span>
                    </NavLink>
                )}
                {canAccessReports && (
                    <NavLink to="/reports" className={navLinkClass}>
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="20" x2="18" y2="10"></line>
                            <line x1="12" y1="20" x2="12" y2="4"></line>
                            <line x1="6" y1="20" x2="6" y2="14"></line>
                        </svg>
                        <span className="text-sm">Reports</span>
                    </NavLink>
                )}
            </nav>

            {/* Shift Status */}
            <div className="p-3 border-t border-pos-border">
                <button
                    onClick={() => setShowShiftModal(true)}
                    className={`w-full p-3 rounded-lg transition-colors ${
                        isShiftOpen
                            ? 'bg-green-50 hover:bg-green-100'
                            : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${isShiftOpen ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <span className={`text-xs font-medium ${isShiftOpen ? 'text-green-700' : 'text-gray-600'}`}>
                            {isShiftOpen ? 'Shift Open' : 'No Shift'}
                        </span>
                    </div>
                    {isShiftOpen && currentShift && (
                        <div className="mt-1.5 text-left">
                            <p className="text-xs text-gray-500">
                                Started: {formatShiftTime(currentShift.started_at)}
                            </p>
                        </div>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                        {isShiftOpen ? 'Click to close shift' : 'Click to open shift'}
                    </p>
                </button>
            </div>

            <div className="p-3 border-t border-pos-border space-y-1">
                {canAccessSettings && (
                    <NavLink to="/settings" className={navLinkClass}>
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg>
                        <span className="text-sm">Settings</span>
                    </NavLink>
                )}
                <button
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                    onClick={handleLogout}
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    <span className="text-sm">Logout</span>
                </button>
            </div>

            {/* Shift Modal */}
            <ShiftModal
                isOpen={showShiftModal}
                onClose={() => setShowShiftModal(false)}
            />
        </aside>
    )
}

export default Sidebar
