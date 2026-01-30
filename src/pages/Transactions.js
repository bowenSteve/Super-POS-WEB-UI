import { useState, useEffect } from "react"
import { salesAPI } from "../api/api"
import Sidebar from "../components/Sidebar"

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

    const totalSales = filteredTransactions.reduce((sum, t) => sum + parseFloat(t.total), 0)
    const totalTransactions = filteredTransactions.length

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

    // SVG Icons
    const DollarIcon = () => (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
    )

    const ReceiptIcon = () => (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
        </svg>
    )

    const ChartIcon = () => (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
    )

    const AlertIcon = () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
    )

    const SearchIcon = () => (
        <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="M21 21l-4.35-4.35"></path>
        </svg>
    )

    const CashIcon = () => (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
            <line x1="1" y1="10" x2="23" y2="10"></line>
        </svg>
    )

    const PhoneIcon = () => (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
            <line x1="12" y1="18" x2="12.01" y2="18"></line>
        </svg>
    )

    const EyeIcon = () => (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>
    )

    return (
        <div className="flex min-h-screen bg-pos-bg">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <header className="bg-white px-6 py-4 border-b border-pos-border">
                    <h1 className="text-xl font-semibold text-pos-text">Transactions</h1>
                </header>

                <main className="flex-1 p-6">
                    {error && (
                        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                            <AlertIcon />
                            <span>{error}</span>
                            <button className="ml-auto text-red-500 hover:text-red-700" onClick={() => setError("")}>
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                    )}

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-xl p-5 flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                                <DollarIcon />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Sales</p>
                                <p className="text-xl font-semibold text-pos-text">KSh {totalSales.toFixed(2)}</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-5 flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                <ReceiptIcon />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Transactions</p>
                                <p className="text-xl font-semibold text-pos-text">{totalTransactions}</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-5 flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                                <ChartIcon />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Average Sale</p>
                                <p className="text-xl font-semibold text-pos-text">
                                    KSh {totalTransactions > 0 ? (totalSales / totalTransactions).toFixed(2) : '0.00'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-xl p-4 mb-6">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="relative flex-1 min-w-[200px]">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                    <SearchIcon />
                                </div>
                                <input
                                    type="text"
                                    className="w-full pl-10 pr-4 py-2 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                    placeholder="Search by Transaction ID or Cashier..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <select
                                className="px-4 py-2 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary bg-white"
                                value={filterPaymentMethod}
                                onChange={(e) => setFilterPaymentMethod(e.target.value)}
                            >
                                <option value="">All Payment Methods</option>
                                <option value="cash">Cash</option>
                                <option value="mpesa">M-Pesa</option>
                            </select>

                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-500">From:</label>
                                <input
                                    type="date"
                                    className="px-3 py-2 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                    value={filterDateFrom}
                                    onChange={(e) => setFilterDateFrom(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-500">To:</label>
                                <input
                                    type="date"
                                    className="px-3 py-2 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                    value={filterDateTo}
                                    onChange={(e) => setFilterDateTo(e.target.value)}
                                />
                            </div>

                            <button
                                className="px-4 py-2 text-sm text-gray-600 hover:text-pos-text hover:bg-pos-hover rounded-lg transition-colors"
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
                    </div>

                    {/* Transactions Table */}
                    {loading ? (
                        <div className="bg-white rounded-xl p-12 text-center text-gray-500">
                            Loading transactions...
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-pos-border">
                                        <tr>
                                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Transaction ID</th>
                                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Date & Time</th>
                                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Cashier</th>
                                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Items</th>
                                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Payment</th>
                                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Discount</th>
                                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Total</th>
                                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-pos-border">
                                        {filteredTransactions.length === 0 ? (
                                            <tr>
                                                <td colSpan="9" className="px-4 py-12 text-center text-gray-500">
                                                    No transactions found
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredTransactions.map(transaction => (
                                                <tr key={transaction.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 font-mono text-sm text-pos-text">
                                                        {transaction.transaction_id}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(transaction.created_at)}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">{transaction.cashier_name || 'N/A'}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">
                                                        {transaction.items?.length || 0} item(s)
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                                            transaction.payment_method === 'cash'
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                            {transaction.payment_method === 'cash' ? <CashIcon /> : <PhoneIcon />}
                                                            {transaction.payment_method === 'cash' ? 'Cash' : 'M-Pesa'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">KSh {transaction.discount}</td>
                                                    <td className="px-4 py-3 text-sm font-medium text-pos-text">KSh {transaction.total}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                                                            transaction.status === 'completed'
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <button
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-pos-text hover:bg-pos-hover rounded-lg transition-colors"
                                                            onClick={() => viewDetails(transaction.id)}
                                                        >
                                                            <EyeIcon />
                                                            View
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </main>

                {/* Transaction Detail Modal */}
                {showDetailModal && selectedTransaction && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetailModal(false)}>
                        <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between px-6 py-4 border-b border-pos-border">
                                <h2 className="text-lg font-semibold text-pos-text">Transaction Details</h2>
                                <button className="text-gray-400 hover:text-gray-600" onClick={() => setShowDetailModal(false)}>
                                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>

                            <div className="p-6">
                                {/* Header Info */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <p className="text-sm text-gray-500">Transaction ID</p>
                                        <p className="font-mono text-pos-text">{selectedTransaction.transaction_id}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Date & Time</p>
                                        <p className="text-pos-text">{formatDate(selectedTransaction.created_at)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Cashier</p>
                                        <p className="text-pos-text">{selectedTransaction.cashier_name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Payment Method</p>
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                            selectedTransaction.payment_method === 'cash'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {selectedTransaction.payment_method === 'cash' ? <CashIcon /> : <PhoneIcon />}
                                            {selectedTransaction.payment_method === 'cash' ? 'Cash' : 'M-Pesa'}
                                        </span>
                                    </div>
                                    {selectedTransaction.mpesa_reference && (
                                        <div className="col-span-2">
                                            <p className="text-sm text-gray-500">M-Pesa Reference</p>
                                            <p className="font-mono text-pos-text">{selectedTransaction.mpesa_reference}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Items List */}
                                <div className="mb-6">
                                    <h3 className="text-sm font-medium text-gray-600 mb-3">Items</h3>
                                    <div className="border border-pos-border rounded-lg overflow-hidden">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="text-left px-4 py-2 text-sm font-medium text-gray-600">Product</th>
                                                    <th className="text-left px-4 py-2 text-sm font-medium text-gray-600">Qty</th>
                                                    <th className="text-left px-4 py-2 text-sm font-medium text-gray-600">Unit Price</th>
                                                    <th className="text-left px-4 py-2 text-sm font-medium text-gray-600">Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-pos-border">
                                                {selectedTransaction.items?.map((item, index) => (
                                                    <tr key={index}>
                                                        <td className="px-4 py-2 text-sm text-pos-text">{item.product_name}</td>
                                                        <td className="px-4 py-2 text-sm text-gray-600">{item.quantity}</td>
                                                        <td className="px-4 py-2 text-sm text-gray-600">KSh {item.unit_price}</td>
                                                        <td className="px-4 py-2 text-sm text-pos-text">KSh {item.subtotal}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Summary */}
                                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="text-pos-text">KSh {selectedTransaction.subtotal}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Discount</span>
                                        <span className="text-red-500">- KSh {selectedTransaction.discount}</span>
                                    </div>
                                    {selectedTransaction.tax > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Tax</span>
                                            <span className="text-pos-text">KSh {selectedTransaction.tax}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-base font-semibold pt-2 border-t border-pos-border">
                                        <span className="text-pos-text">Total</span>
                                        <span className="text-pos-text">KSh {selectedTransaction.total}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Amount Paid</span>
                                        <span className="text-pos-text">KSh {selectedTransaction.amount_paid}</span>
                                    </div>
                                    {selectedTransaction.change_amount > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Change</span>
                                            <span className="text-green-600">KSh {selectedTransaction.change_amount}</span>
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
