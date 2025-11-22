import { NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import "../styles/sidebar.css"

function Sidebar() {
    const navigate = useNavigate()
    const { logout } = useAuth()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h1 className="sidebar-brand">SuperPOS</h1>
            </div>

            <nav className="sidebar-nav">
                <NavLink to="/" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <span className="nav-icon">🏠</span>
                    <span className="nav-label">Dashboard</span>
                </NavLink>
                <NavLink to="/sales" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <span className="nav-icon">🛒</span>
                    <span className="nav-label">New Sale</span>
                </NavLink>
                <NavLink to="/transactions" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <span className="nav-icon">🧾</span>
                    <span className="nav-label">Transactions</span>
                </NavLink>
                <NavLink to="/inventory" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <span className="nav-icon">📦</span>
                    <span className="nav-label">Inventory</span>
                </NavLink>
                <NavLink to="/customers" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <span className="nav-icon">👥</span>
                    <span className="nav-label">Customers</span>
                </NavLink>
                <NavLink to="/reports" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <span className="nav-icon">📊</span>
                    <span className="nav-label">Reports</span>
                </NavLink>
                <NavLink to="/settings" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <span className="nav-icon">⚙️</span>
                    <span className="nav-label">Settings</span>
                </NavLink>
            </nav>

            <div className="sidebar-footer">
                <button className="logout-btn" onClick={handleLogout}>
                    <span className="nav-icon">🚪</span>
                    <span className="nav-label">Logout</span>
                </button>
            </div>
        </aside>
    )
}

export default Sidebar
