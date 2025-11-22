import { useState, useEffect } from "react"
import "../styles/home.css"
import Sidebar from "../components/Sidebar"
import { useAuth } from "../context/AuthContext"
import { salesAPI, productsAPI } from "../api/api"

function Home() {
    const { user } = useAuth()
    const [transactions, setTransactions] = useState([])
    const [lowStockCount, setLowStockCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        setLoading(true)
        setError("")

        try {
            // Fetch all transactions
            const transactionsResponse = await salesAPI.getTransactions()
            const transactionsData = transactionsResponse.data.results || transactionsResponse.data
            setTransactions(Array.isArray(transactionsData) ? transactionsData : [])

            // Fetch products to count low stock items
            const productsResponse = await productsAPI.getAll()
            const productsData = productsResponse.data.results || productsResponse.data
            const products = Array.isArray(productsData) ? productsData : []
            const lowStock = products.filter(p => p.is_low_stock).length
            setLowStockCount(lowStock)
        } catch (err) {
            setError("Failed to fetch dashboard data")
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    // Calculate today's transactions
    const today = new Date().toISOString().split('T')[0]
    const todayTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.created_at).toISOString().split('T')[0]
        return transactionDate === today
    })

    // Calculate today's sales total
    const todaySales = todayTransactions.reduce((sum, t) => sum + parseFloat(t.total || 0), 0)

    // Get recent transactions (latest 5)
    const recentTransactions = [...transactions]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }
    return (
        <div className="home-container">
            <Sidebar />

            {/* Main Content Wrapper */}
            <div className="main-wrapper">
                {/* Header Section */}
                <header className="home-header">
                    <div className="header-content">
                        <h1 className="page-title">Dashboard</h1>
                        <div className="header-actions">
                            <button className="icon-btn">
                                <span className="icon">🔔</span>
                            </button>
                            <div className="user-profile">
                                <span className="user-name">{user?.username || 'User'}</span>
                                <div className="user-avatar">{user?.username?.[0]?.toUpperCase() || 'U'}</div>
                            </div>
                        </div>
                    </div>
                </header>

            {/* Main Content */}
            <main className="home-main">
                {error && (
                    <div className="alert alert-error" style={{
                        padding: '1rem 1.5rem',
                        borderRadius: '8px',
                        marginBottom: '1.5rem',
                        background: '#fee2e2',
                        color: '#991b1b',
                        border: '1px solid #fecaca'
                    }}>
                        {error}
                    </div>
                )}

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                        Loading dashboard data...
                    </div>
                ) : (
                    <>
                        {/* Quick Stats Section */}
                        <section className="stats-section">
                            <div className="stat-card">
                                <div className="stat-icon sales">💰</div>
                                <div className="stat-info">
                                    <h3 className="stat-label">Today's Sales</h3>
                                    <p className="stat-value">KSh {todaySales.toFixed(2)}</p>
                                    <span className="stat-change positive">{todayTransactions.length} transactions</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon transactions">🧾</div>
                                <div className="stat-info">
                                    <h3 className="stat-label">Today's Transactions</h3>
                                    <p className="stat-value">{todayTransactions.length}</p>
                                    <span className="stat-change positive">Total: {transactions.length}</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon inventory">📦</div>
                                <div className="stat-info">
                                    <h3 className="stat-label">Low Stock Items</h3>
                                    <p className="stat-value">{lowStockCount}</p>
                                    <span className="stat-change warning">{lowStockCount > 0 ? 'Needs attention' : 'All good'}</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon customers">👥</div>
                                <div className="stat-info">
                                    <h3 className="stat-label">Total Transactions</h3>
                                    <p className="stat-value">{transactions.length}</p>
                                    <span className="stat-change positive">All time</span>
                                </div>
                            </div>
                        </section>
                    </>
                )}

                {/* Quick Actions Section */}
                <section className="quick-actions">
                    <h2 className="section-title">Quick Actions</h2>
                    <div className="actions-grid">
                        <button className="action-card">
                            <div className="action-icon new-sale">🛒</div>
                            <h3>New Sale</h3>
                            <p>Start a new transaction</p>
                        </button>
                        <button className="action-card">
                            <div className="action-icon inventory-mgmt">📋</div>
                            <h3>Manage Inventory</h3>
                            <p>View and update stock</p>
                        </button>
                        <button className="action-card">
                            <div className="action-icon reports">📊</div>
                            <h3>Reports</h3>
                            <p>View sales analytics</p>
                        </button>
                        <button className="action-card">
                            <div className="action-icon customers-mgmt">👤</div>
                            <h3>Customers</h3>
                            <p>Manage customer data</p>
                        </button>
                    </div>
                </section>

                {/* Recent Activity Section */}
                {!loading && (
                    <section className="recent-activity">
                        <h2 className="section-title">Recent Transactions</h2>
                        <div className="activity-table">
                            <div className="table-header">
                                <div className="header-cell">Time</div>
                                <div className="header-cell">Transaction ID</div>
                                <div className="header-cell">Items</div>
                                <div className="header-cell">Amount</div>
                                <div className="header-cell">Payment</div>
                            </div>
                            {recentTransactions.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                                    No transactions yet
                                </div>
                            ) : (
                                recentTransactions.map(transaction => (
                                    <div key={transaction.id} className="table-row">
                                        <div className="table-cell">{formatDate(transaction.created_at)}</div>
                                        <div className="table-cell">{transaction.transaction_id}</div>
                                        <div className="table-cell">{transaction.items?.length || 0} item{transaction.items?.length !== 1 ? 's' : ''}</div>
                                        <div className="table-cell">KSh {transaction.total}</div>
                                        <div className="table-cell">
                                            <span className={`badge ${transaction.payment_method}`}>
                                                {transaction.payment_method === 'cash' ? 'Cash' : 'M-Pesa'}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                )}
            </main>
            </div>
        </div>
    )
}

export default Home