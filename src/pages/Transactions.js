import { useState, useEffect } from "react"
import { salesAPI } from "../api/api"
import Sidebar from "../components/Sidebar"
import "../styles/transactions.css"

function Transactions() {
    const [transactions, setTransactions] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [filterPaymentMethod, setFilterPaymentMethod] = useState("")
    const [filterDateFrom, setFilterDateFrom] = useState("")
    const [filterDateTo, setFilterDateTo] = useState("")
    const [selectedTransaction, setSelectedTransaction] = useState(null)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        fetchTransactions()
    }, [])

    const fetchTransactions = async () => {
        setLoading(true)
        setError("")

        try {
            const response = await salesAPI.getTransactions()
            const transactionsData = response.data.results || response.data
            setTransactions(Array.isArray(transactionsData) ? transactionsData : [])
        } catch (err) {
            setError("Failed to fetch transactions")
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    // Filter transactions
    const filteredTransactions = transactions.filter(transaction => {
        const matchesSearch = transaction.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            transaction.cashier_name?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesPayment = !filterPaymentMethod || transaction.payment_method === filterPaymentMethod

        let matchesDate = true
        if (filterDateFrom || filterDateTo) {
            const transactionDate = new Date(transaction.created_at).toISOString().split('T')[0]

            if (filterDateFrom && filterDateTo) {
                matchesDate = transactionDate >= filterDateFrom && transactionDate <= filterDateTo
            } else if (filterDateFrom) {
                matchesDate = transactionDate >= filterDateFrom
            } else if (filterDateTo) {
                matchesDate = transactionDate <= filterDateTo
            }
        }

        return matchesSearch && matchesPayment && matchesDate
    })

    // Calculate totals
    const totalSales = filteredTransactions.reduce((sum, t) => sum + parseFloat(t.total), 0)
    const totalTransactions = filteredTransactions.length

    // View transaction details
    const viewDetails = async (transactionId) => {
        try {
            const response = await salesAPI.getTransactionById(transactionId)
            setSelectedTransaction(response.data)
            setShowDetailModal(true)
        } catch (err) {
            setError("Failed to fetch transaction details")
            console.error(err)
        }
    }

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="home-container">
            <Sidebar />
            <div className="main-wrapper">
                <header className="home-header">
                    <div className="header-content">
                        <h1 className="page-title">Transactions</h1>
                    </div>
                </header>

                <main className="transactions-main">
                    {error && (
                        <div className="alert alert-error">
                            <span className="alert-icon">⚠️</span>
                            {error}
                            <button className="alert-close" onClick={() => setError("")}>×</button>
                        </div>
                    )}

                    {/* Summary Cards */}
                    <div className="summary-cards">
                        <div className="summary-card">
                            <div className="summary-icon">💰</div>
                            <div className="summary-info">
                                <h3>Total Sales</h3>
                                <p className="summary-value">KSh {totalSales.toFixed(2)}</p>
                            </div>
                        </div>

                        <div className="summary-card">
                            <div className="summary-icon">🧾</div>
                            <div className="summary-info">
                                <h3>Total Transactions</h3>
                                <p className="summary-value">{totalTransactions}</p>
                            </div>
                        </div>

                        <div className="summary-card">
                            <div className="summary-icon">📊</div>
                            <div className="summary-info">
                                <h3>Average Sale</h3>
                                <p className="summary-value">
                                    KSh {totalTransactions > 0 ? (totalSales / totalTransactions).toFixed(2) : '0.00'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="transactions-filters">
                        <div className="filter-group">
                            <input
                                type="text"
                                className="filter-search"
                                placeholder="Search by Transaction ID or Cashier..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="filter-group">
                            <select
                                className="filter-select"
                                value={filterPaymentMethod}
                                onChange={(e) => setFilterPaymentMethod(e.target.value)}
                            >
                                <option value="">All Payment Methods</option>
                                <option value="cash">Cash</option>
                                <option value="mpesa">M-Pesa</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label className="filter-label">From:</label>
                            <input
                                type="date"
                                className="filter-date"
                                value={filterDateFrom}
                                onChange={(e) => setFilterDateFrom(e.target.value)}
                            />
                        </div>

                        <div className="filter-group">
                            <label className="filter-label">To:</label>
                            <input
                                type="date"
                                className="filter-date"
                                value={filterDateTo}
                                onChange={(e) => setFilterDateTo(e.target.value)}
                            />
                        </div>

                        <button
                            className="filter-clear-btn"
                            onClick={() => {
                                setSearchTerm("")
                                setFilterPaymentMethod("")
                                setFilterDateFrom("")
                                setFilterDateTo("")
                            }}
                        >
                            Clear Filters
                        </button>
                    </div>

                    {/* Transactions Table */}
                    {loading ? (
                        <div className="loading-state">Loading transactions...</div>
                    ) : (
                        <div className="transactions-table-wrapper">
                            <table className="transactions-table">
                                <thead>
                                    <tr>
                                        <th>Transaction ID</th>
                                        <th>Date & Time</th>
                                        <th>Cashier</th>
                                        <th>Items</th>
                                        <th>Payment Method</th>
                                        <th>Discount</th>
                                        <th>Total</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTransactions.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" className="empty-state">
                                                No transactions found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredTransactions.map(transaction => (
                                            <tr key={transaction.id}>
                                                <td className="transaction-id-cell">
                                                    {transaction.transaction_id}
                                                </td>
                                                <td>{formatDate(transaction.created_at)}</td>
                                                <td>{transaction.cashier_name || 'N/A'}</td>
                                                <td className="items-cell">
                                                    {transaction.items?.length || 0} item(s)
                                                </td>
                                                <td>
                                                    <span className={`payment-badge ${transaction.payment_method}`}>
                                                        {transaction.payment_method === 'cash' ? '💵 Cash' : '📱 M-Pesa'}
                                                    </span>
                                                </td>
                                                <td>KSh {transaction.discount}</td>
                                                <td className="total-cell">KSh {transaction.total}</td>
                                                <td>
                                                    <span className={`status-badge ${transaction.status}`}>
                                                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        className="view-btn"
                                                        onClick={() => viewDetails(transaction.id)}
                                                    >
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </main>

                {/* Transaction Detail Modal */}
                {showDetailModal && selectedTransaction && (
                    <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
                        <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Transaction Details</h2>
                                <button className="modal-close" onClick={() => setShowDetailModal(false)}>×</button>
                            </div>

                            <div className="transaction-detail">
                                {/* Header Info */}
                                <div className="detail-header">
                                    <div className="detail-row">
                                        <span className="detail-label">Transaction ID:</span>
                                        <span className="detail-value transaction-id">{selectedTransaction.transaction_id}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Date & Time:</span>
                                        <span className="detail-value">{formatDate(selectedTransaction.created_at)}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Cashier:</span>
                                        <span className="detail-value">{selectedTransaction.cashier_name || 'N/A'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Payment Method:</span>
                                        <span className={`payment-badge ${selectedTransaction.payment_method}`}>
                                            {selectedTransaction.payment_method === 'cash' ? '💵 Cash' : '📱 M-Pesa'}
                                        </span>
                                    </div>
                                    {selectedTransaction.mpesa_reference && (
                                        <div className="detail-row">
                                            <span className="detail-label">M-Pesa Reference:</span>
                                            <span className="detail-value">{selectedTransaction.mpesa_reference}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Items List */}
                                <div className="detail-section">
                                    <h3>Items</h3>
                                    <table className="items-table">
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th>Quantity</th>
                                                <th>Unit Price</th>
                                                <th>Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedTransaction.items?.map((item, index) => (
                                                <tr key={index}>
                                                    <td>{item.product_name}</td>
                                                    <td>{item.quantity}</td>
                                                    <td>KSh {item.unit_price}</td>
                                                    <td>KSh {item.subtotal}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Summary */}
                                <div className="detail-summary">
                                    <div className="summary-row">
                                        <span>Subtotal:</span>
                                        <span>KSh {selectedTransaction.subtotal}</span>
                                    </div>
                                    <div className="summary-row">
                                        <span>Discount:</span>
                                        <span className="discount-amount">- KSh {selectedTransaction.discount}</span>
                                    </div>
                                    {selectedTransaction.tax > 0 && (
                                        <div className="summary-row">
                                            <span>Tax:</span>
                                            <span>KSh {selectedTransaction.tax}</span>
                                        </div>
                                    )}
                                    <div className="summary-row total-row">
                                        <span>Total:</span>
                                        <span className="total-amount">KSh {selectedTransaction.total}</span>
                                    </div>
                                    <div className="summary-row">
                                        <span>Amount Paid:</span>
                                        <span>KSh {selectedTransaction.amount_paid}</span>
                                    </div>
                                    {selectedTransaction.change_amount > 0 && (
                                        <div className="summary-row">
                                            <span>Change:</span>
                                            <span className="change-amount">KSh {selectedTransaction.change_amount}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Transactions
