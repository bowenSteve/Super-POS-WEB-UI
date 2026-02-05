import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { salesAPI } from "../api/api"
import Sidebar from "../components/Sidebar"
import ProfileDropdown from "../components/ProfileDropdown"
import ToastNotification, { toast } from '../components/ToastNotification'

// Default settings
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

function Transactions() {
    const { currentShop } = useAuth()
    const [transactions, setTransactions] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [filterPaymentMethod, setFilterPaymentMethod] = useState("")
    const [filterDateFrom, setFilterDateFrom] = useState("")
    const [filterDateTo, setFilterDateTo] = useState("")
    const [selectedTransaction, setSelectedTransaction] = useState(null)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [showExportModal, setShowExportModal] = useState(false)
    const [exportDateFrom, setExportDateFrom] = useState("")
    const [exportDateTo, setExportDateTo] = useState("")
    const [exporting, setExporting] = useState(false)
    // Refund state
    const [showRefundModal, setShowRefundModal] = useState(false)
    const [refundType, setRefundType] = useState("full")
    const [refundReason, setRefundReason] = useState("other")
    const [refundReasonDetails, setRefundReasonDetails] = useState("")
    const [restoreStock, setRestoreStock] = useState(true)
    const [refundItems, setRefundItems] = useState([])
    const [processingRefund, setProcessingRefund] = useState(false)
    // Receipt state
    const [showReceiptModal, setShowReceiptModal] = useState(false)
    const [receiptTransaction, setReceiptTransaction] = useState(null)
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const [pageSize, setPageSize] = useState(50)

    // Get settings from shop
    const taxSettings = currentShop?.tax_settings
        ? { ...defaultTaxSettings, ...currentShop.tax_settings }
        : defaultTaxSettings
    const receiptSettings = currentShop?.receipt_settings
        ? { ...defaultReceiptSettings, ...currentShop.receipt_settings }
        : defaultReceiptSettings
    const currency = currentShop?.currency || 'KSh'
    const shopName = currentShop?.name || 'Super POS'
    const shopAddress = currentShop?.address || ''
    const shopPhone = currentShop?.phone || ''
    const shopEmail = currentShop?.email || ''

    useEffect(() => {
        fetchTransactions()
    }, [currentPage, pageSize, filterPaymentMethod, filterDateFrom, filterDateTo, searchTerm])

    const fetchTransactions = async () => {
        setLoading(true)

        try {
            const params = {
                page: currentPage,
                page_size: pageSize,
            }

            // Add filters
            if (searchTerm) params.search = searchTerm
            if (filterPaymentMethod) params.payment_method = filterPaymentMethod
            if (filterDateFrom) params.date_from = filterDateFrom
            if (filterDateTo) params.date_to = filterDateTo

            const response = await salesAPI.getTransactions(params)
            const data = response.data

            setTransactions(data.results || [])
            setTotalCount(data.count || 0)
            setTotalPages(data.total_pages || 1)
        } catch (err) {
            toast.error("Failed to fetch transactions")
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    // Reset to page 1 when filters change
    const handleFilterChange = (setter, value) => {
        setter(value)
        setCurrentPage(1)
    }

    const totalSales = transactions.reduce((sum, t) => sum + parseFloat(t.total), 0)
    const totalTransactions = totalCount

    const viewDetails = async (transactionId) => {
        try {
            const response = await salesAPI.getTransactionById(transactionId)
            setSelectedTransaction(response.data)
            setShowDetailModal(true)
        } catch (err) {
            toast.error("Failed to fetch transaction details")
            console.error(err)
        }
    }

    const handleExportPDF = async () => {
        if (!exportDateFrom || !exportDateTo) {
            toast.error("Please select both start and end dates")
            return
        }

        if (exportDateFrom > exportDateTo) {
            toast.error("Start date cannot be after end date")
            return
        }

        setExporting(true)
        toast.loading("Generating PDF...", { id: 'export-toast' })

        try {
            const response = await salesAPI.exportPDF(exportDateFrom, exportDateTo)

            // Create blob and download
            const blob = new Blob([response.data], { type: 'application/pdf' })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `transactions_${exportDateFrom}_to_${exportDateTo}.pdf`
            document.body.appendChild(link)
            link.click()

            // Cleanup
            window.URL.revokeObjectURL(url)
            document.body.removeChild(link)

            toast.success("PDF exported successfully!", { id: 'export-toast' })
            setShowExportModal(false)
            setExportDateFrom("")
            setExportDateTo("")
        } catch (err) {
            const errorMsg = err.response?.data?.error || "Failed to export PDF"
            toast.error(errorMsg, { id: 'export-toast' })
            console.error(err)
        } finally {
            setExporting(false)
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

    const REFUND_REASONS = [
        { value: 'defective', label: 'Defective Product' },
        { value: 'wrong_item', label: 'Wrong Item' },
        { value: 'customer_change_mind', label: 'Customer Changed Mind' },
        { value: 'overcharge', label: 'Overcharge' },
        { value: 'damaged', label: 'Damaged Product' },
        { value: 'other', label: 'Other' },
    ]

    const openRefundModal = () => {
        if (!selectedTransaction) return

        // Initialize refund items with available quantities
        const items = selectedTransaction.items.map(item => ({
            id: item.id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            subtotal: item.subtotal,
            refunded_quantity: item.refunded_quantity || 0,
            available_quantity: item.quantity - (item.refunded_quantity || 0),
            refund_quantity: 0
        }))

        setRefundItems(items)
        setRefundType("full")
        setRefundReason("other")
        setRefundReasonDetails("")
        setRestoreStock(true)
        setShowRefundModal(true)
    }

    const updateRefundItemQuantity = (itemId, quantity) => {
        setRefundItems(prev => prev.map(item => {
            if (item.id === itemId) {
                const qty = Math.max(0, Math.min(parseInt(quantity) || 0, item.available_quantity))
                return { ...item, refund_quantity: qty }
            }
            return item
        }))
    }

    const calculatePartialRefundAmount = () => {
        return refundItems.reduce((total, item) => {
            if (item.refund_quantity > 0) {
                const unitPriceAfterDiscount = parseFloat(item.subtotal) / item.quantity
                return total + (unitPriceAfterDiscount * item.refund_quantity)
            }
            return total
        }, 0)
    }

    const handleProcessRefund = async () => {
        if (!selectedTransaction) return

        // Validate partial refund has items selected
        if (refundType === "partial") {
            const hasItems = refundItems.some(item => item.refund_quantity > 0)
            if (!hasItems) {
                toast.error("Please select at least one item to refund")
                return
            }
        }

        setProcessingRefund(true)
        toast.loading("Processing refund...", { id: 'refund-toast' })

        try {
            const data = {
                refund_type: refundType,
                reason: refundReason,
                reason_details: refundReasonDetails,
                restore_stock: restoreStock
            }

            if (refundType === "partial") {
                data.items = refundItems
                    .filter(item => item.refund_quantity > 0)
                    .map(item => ({
                        transaction_item_id: item.id,
                        quantity: item.refund_quantity
                    }))
            }

            await salesAPI.createRefund(selectedTransaction.id, data)

            toast.success("Refund processed successfully!", { id: 'refund-toast' })
            setShowRefundModal(false)
            setShowDetailModal(false)
            fetchTransactions()
        } catch (err) {
            const errorMsg = err.response?.data?.error || "Failed to process refund"
            toast.error(errorMsg, { id: 'refund-toast' })
            console.error(err)
        } finally {
            setProcessingRefund(false)
        }
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

    const SplitIcon = () => (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="5" width="20" height="14" rx="2"></rect>
            <line x1="2" y1="10" x2="22" y2="10"></line>
        </svg>
    )

    const EyeIcon = () => (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>
    )

    const DownloadIcon = () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
    )

    const XIcon = () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    )

    const RefundIcon = () => (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
        </svg>
    )

    const PrinterIcon = () => (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
        </svg>
    )

    const viewReceipt = async (transactionId) => {
        try {
            const response = await salesAPI.getTransactionById(transactionId)
            setReceiptTransaction(response.data)
            setShowReceiptModal(true)
        } catch (err) {
            toast.error("Failed to load receipt")
            console.error(err)
        }
    }

    const handlePrintReceipt = () => {
        const printContent = document.getElementById('receipt-content')
        const printWindow = window.open('', '_blank')
        const paperWidth = receiptSettings.paperSize === '58mm' ? '220px' : '300px'
        const fontSize = receiptSettings.fontSize === 'small' ? '11px' : receiptSettings.fontSize === 'large' ? '14px' : '12px'
        printWindow.document.write(`
            <html>
                <head>
                    <title>Receipt - ${receiptTransaction?.transaction_id}</title>
                    <style>
                        body { font-family: 'Courier New', monospace; padding: 20px; max-width: ${paperWidth}; margin: 0 auto; font-size: ${fontSize}; }
                        .text-center { text-align: center; }
                        .text-right { text-align: right; }
                        .font-bold { font-weight: bold; }
                        .border-dashed { border-top: 1px dashed #000; margin: 10px 0; }
                        .item-row { display: flex; justify-content: space-between; margin: 5px 0; }
                        .shop-name { font-size: 18px; font-weight: bold; }
                        .small { font-size: 12px; }
                        @media print { body { padding: 0; } }
                    </style>
                </head>
                <body>
                    ${printContent.innerHTML}
                </body>
            </html>
        `)
        printWindow.document.close()
        printWindow.print()
    }

    const formatReceiptDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        })
    }

    return (
        <div className="flex min-h-screen bg-pos-bg">
            <ToastNotification />
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <header className="bg-white px-6 py-4 border-b border-pos-border flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-pos-text">Transactions</h1>
                    <div className="flex items-center gap-4">
                        <button
                            className="inline-flex items-center gap-2 px-4 py-2 border-2 border-pos-primary text-pos-primary rounded-lg hover:bg-pos-primary hover:text-white transition-colors"
                            onClick={() => setShowExportModal(true)}
                        >
                            <DownloadIcon />
                            Export PDF
                        </button>
                        <ProfileDropdown />
                    </div>
                </header>

                <main className="flex-1 p-6">

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-xl p-5 flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                                <DollarIcon />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Sales</p>
                                <p className="text-xl font-semibold text-pos-text">{currency} {totalSales.toFixed(2)}</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-5 flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
                                <ReceiptIcon />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Transactions</p>
                                <p className="text-xl font-semibold text-pos-text">{totalTransactions}</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-5 flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
                                <ChartIcon />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Average Sale</p>
                                <p className="text-xl font-semibold text-pos-text">
                                    {currency} {totalTransactions > 0 ? (totalSales / totalTransactions).toFixed(2) : '0.00'}
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
                                    onChange={(e) => handleFilterChange(setSearchTerm, e.target.value)}
                                />
                            </div>

                            <select
                                className="px-4 py-2 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary bg-white"
                                value={filterPaymentMethod}
                                onChange={(e) => handleFilterChange(setFilterPaymentMethod, e.target.value)}
                            >
                                <option value="">All Payment Methods</option>
                                <option value="cash">Cash</option>
                                <option value="mpesa">M-Pesa</option>
                                <option value="split">Split Payment</option>
                            </select>

                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-500">From:</label>
                                <input
                                    type="date"
                                    className="px-3 py-2 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                    value={filterDateFrom}
                                    onChange={(e) => handleFilterChange(setFilterDateFrom, e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-500">To:</label>
                                <input
                                    type="date"
                                    className="px-3 py-2 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                    value={filterDateTo}
                                    onChange={(e) => handleFilterChange(setFilterDateTo, e.target.value)}
                                />
                            </div>

                            <button
                                className="px-4 py-2 text-sm text-gray-600 hover:text-pos-text hover:bg-pos-hover rounded-lg transition-colors"
                                onClick={() => {
                                    setSearchTerm("")
                                    setFilterPaymentMethod("")
                                    setFilterDateFrom("")
                                    setFilterDateTo("")
                                    setCurrentPage(1)
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
                                        {transactions.length === 0 ? (
                                            <tr>
                                                <td colSpan="9" className="px-4 py-12 text-center text-gray-500">
                                                    No transactions found
                                                </td>
                                            </tr>
                                        ) : (
                                            transactions.map(transaction => (
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
                                                                : 'bg-gray-100 text-gray-700'
                                                        }`}>
                                                            {transaction.payment_method === 'cash' ? <CashIcon /> :
                                                             transaction.payment_method === 'mpesa' ? <PhoneIcon /> : <SplitIcon />}
                                                            {transaction.payment_method === 'cash' ? 'Cash' :
                                                             transaction.payment_method === 'mpesa' ? 'M-Pesa' : 'Split'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">{currency} {transaction.discount}</td>
                                                    <td className="px-4 py-3 text-sm font-medium text-pos-text">{currency} {transaction.total}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                                                            transaction.status === 'completed'
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-gray-100 text-gray-700'
                                                        }`}>
                                                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-pos-text hover:bg-pos-hover rounded-lg transition-colors"
                                                                onClick={() => viewDetails(transaction.id)}
                                                            >
                                                                <EyeIcon />
                                                                View
                                                            </button>
                                                            <button
                                                                className="p-2 text-gray-500 hover:text-pos-text hover:bg-pos-hover rounded-lg transition-colors"
                                                                onClick={() => viewReceipt(transaction.id)}
                                                                title="View Receipt"
                                                            >
                                                                <PrinterIcon />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalCount >= 25 && (
                                <div className="flex items-center justify-between px-4 py-3 border-t border-pos-border">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <span>Showing</span>
                                        <span className="font-medium">
                                            {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalCount)}
                                        </span>
                                        <span>of</span>
                                        <span className="font-medium">{totalCount}</span>
                                        <span>transactions</span>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        {/* Items per page */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-600">Per page:</span>
                                            <select
                                                className="px-2 py-1 text-sm border border-pos-border rounded focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary bg-white"
                                                value={pageSize}
                                                onChange={(e) => {
                                                    setPageSize(Number(e.target.value))
                                                    setCurrentPage(1)
                                                }}
                                            >
                                                <option value={25}>25</option>
                                                <option value={50}>50</option>
                                                <option value={100}>100</option>
                                            </select>
                                        </div>

                                        {/* Page navigation */}
                                        <div className="flex items-center gap-1">
                                            <button
                                                className="px-3 py-1 text-sm rounded border border-pos-border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                onClick={() => setCurrentPage(1)}
                                                disabled={currentPage === 1}
                                            >
                                                First
                                            </button>
                                            <button
                                                className="px-3 py-1 text-sm rounded border border-pos-border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                disabled={currentPage === 1}
                                            >
                                                Prev
                                            </button>

                                            {/* Page numbers */}
                                            <div className="flex items-center gap-1 mx-2">
                                                {(() => {
                                                    const pages = []
                                                    let start = Math.max(1, currentPage - 2)
                                                    let end = Math.min(totalPages, currentPage + 2)

                                                    if (currentPage <= 3) {
                                                        end = Math.min(5, totalPages)
                                                    }
                                                    if (currentPage >= totalPages - 2) {
                                                        start = Math.max(1, totalPages - 4)
                                                    }

                                                    for (let i = start; i <= end; i++) {
                                                        pages.push(
                                                            <button
                                                                key={i}
                                                                className={`w-8 h-8 text-sm rounded ${
                                                                    currentPage === i
                                                                        ? 'bg-pos-primary text-white'
                                                                        : 'border border-pos-border hover:bg-gray-50'
                                                                }`}
                                                                onClick={() => setCurrentPage(i)}
                                                            >
                                                                {i}
                                                            </button>
                                                        )
                                                    }
                                                    return pages
                                                })()}
                                            </div>

                                            <button
                                                className="px-3 py-1 text-sm rounded border border-pos-border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                disabled={currentPage === totalPages}
                                            >
                                                Next
                                            </button>
                                            <button
                                                className="px-3 py-1 text-sm rounded border border-pos-border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                onClick={() => setCurrentPage(totalPages)}
                                                disabled={currentPage === totalPages}
                                            >
                                                Last
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
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
                                                : 'bg-gray-100 text-gray-700'
                                        }`}>
                                            {selectedTransaction.payment_method === 'cash' ? <CashIcon /> :
                                             selectedTransaction.payment_method === 'mpesa' ? <PhoneIcon /> : <SplitIcon />}
                                            {selectedTransaction.payment_method === 'cash' ? 'Cash' :
                                             selectedTransaction.payment_method === 'mpesa' ? 'M-Pesa' : 'Split Payment'}
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
                                                    <th className="text-left px-4 py-2 text-sm font-medium text-gray-600">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-pos-border">
                                                {selectedTransaction.items?.map((item, index) => (
                                                    <tr key={index}>
                                                        <td className="px-4 py-2 text-sm text-pos-text">{item.product_name}</td>
                                                        <td className="px-4 py-2 text-sm text-gray-600">{item.quantity}</td>
                                                        <td className="px-4 py-2 text-sm text-gray-600">{currency} {item.unit_price}</td>
                                                        <td className="px-4 py-2 text-sm text-pos-text">{currency} {item.subtotal}</td>
                                                        <td className="px-4 py-2 text-sm">
                                                            {item.refunded_quantity > 0 ? (
                                                                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                                    {item.refunded_quantity === item.quantity
                                                                        ? 'Refunded'
                                                                        : `${item.refunded_quantity} refunded`}
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-400">-</span>
                                                            )}
                                                        </td>
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
                                        <span className="text-pos-text">{currency} {selectedTransaction.subtotal}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Discount</span>
                                        <span className="text-gray-600">- {currency} {selectedTransaction.discount}</span>
                                    </div>
                                    {parseFloat(selectedTransaction.tax) > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">{taxSettings.name} ({taxSettings.rate}%)</span>
                                            <span className="text-pos-text">{currency} {selectedTransaction.tax}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-base font-semibold pt-2 border-t border-pos-border">
                                        <span className="text-pos-text">Total</span>
                                        <span className="text-pos-text">{currency} {selectedTransaction.total}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Amount Paid</span>
                                        <span className="text-pos-text">{currency} {selectedTransaction.amount_paid}</span>
                                    </div>
                                    {selectedTransaction.change_amount > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Change</span>
                                            <span className="text-green-600">{currency} {selectedTransaction.change_amount}</span>
                                        </div>
                                    )}
                                    {selectedTransaction.total_refunded > 0 && (
                                        <div className="flex justify-between text-sm pt-2 border-t border-pos-border">
                                            <span className="text-gray-600">Total Refunded</span>
                                            <span className="text-red-600">- {currency} {selectedTransaction.total_refunded?.toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Refund Button */}
                                {selectedTransaction.can_refund && selectedTransaction.status !== 'cancelled' && (
                                    <div className="mt-4 pt-4 border-t border-pos-border">
                                        <button
                                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                                            onClick={openRefundModal}
                                        >
                                            <RefundIcon />
                                            Process Refund
                                        </button>
                                    </div>
                                )}

                                {/* Refund Status Message */}
                                {selectedTransaction.status === 'refunded' && (
                                    <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                                        <p className="text-sm text-gray-600 text-center">
                                            This transaction has been fully refunded.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Export PDF Modal */}
                {showExportModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowExportModal(false)}>
                        <div className="bg-white rounded-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between px-6 py-4 border-b border-pos-border">
                                <h2 className="text-lg font-semibold text-pos-text">Export Transactions to PDF</h2>
                                <button className="text-gray-400 hover:text-gray-600" onClick={() => setShowExportModal(false)}>
                                    <XIcon />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <p className="text-sm text-gray-600">
                                    Select a date range to export transactions to PDF format.
                                </p>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2.5 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                        value={exportDateFrom}
                                        onChange={(e) => setExportDateFrom(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2.5 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                        value={exportDateTo}
                                        onChange={(e) => setExportDateTo(e.target.value)}
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        className="flex-1 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                        onClick={() => {
                                            setShowExportModal(false)
                                            setExportDateFrom("")
                                            setExportDateTo("")
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="flex-1 py-2.5 bg-pos-primary text-white rounded-lg font-medium hover:bg-pos-text/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={handleExportPDF}
                                        disabled={exporting || !exportDateFrom || !exportDateTo}
                                    >
                                        {exporting ? 'Exporting...' : 'Export PDF'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Refund Modal */}
                {showRefundModal && selectedTransaction && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowRefundModal(false)}>
                        <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between px-6 py-4 border-b border-pos-border">
                                <h2 className="text-lg font-semibold text-pos-text">Process Refund</h2>
                                <button className="text-gray-400 hover:text-gray-600" onClick={() => setShowRefundModal(false)}>
                                    <XIcon />
                                </button>
                            </div>

                            <div className="p-6 space-y-5">
                                {/* Transaction Info */}
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-sm text-gray-500">Transaction</p>
                                    <p className="font-mono text-pos-text">{selectedTransaction.transaction_id}</p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Total: {currency} {selectedTransaction.total} |
                                        Refunded: {currency} {selectedTransaction.total_refunded?.toFixed(2) || '0.00'}
                                    </p>
                                </div>

                                {/* Refund Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Refund Type</label>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${
                                                refundType === 'full'
                                                    ? 'bg-pos-primary text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                            onClick={() => setRefundType('full')}
                                        >
                                            Full Refund
                                        </button>
                                        <button
                                            type="button"
                                            className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${
                                                refundType === 'partial'
                                                    ? 'bg-pos-primary text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                            onClick={() => setRefundType('partial')}
                                        >
                                            Partial Refund
                                        </button>
                                    </div>
                                </div>

                                {/* Item Selection for Partial Refund */}
                                {refundType === 'partial' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Items to Refund</label>
                                        <div className="border border-pos-border rounded-lg overflow-hidden">
                                            <table className="w-full">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="text-left px-3 py-2 text-xs font-medium text-gray-600">Product</th>
                                                        <th className="text-center px-3 py-2 text-xs font-medium text-gray-600">Available</th>
                                                        <th className="text-center px-3 py-2 text-xs font-medium text-gray-600">Refund Qty</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-pos-border">
                                                    {refundItems.map(item => (
                                                        <tr key={item.id} className={item.available_quantity === 0 ? 'opacity-50' : ''}>
                                                            <td className="px-3 py-2 text-sm text-pos-text">{item.product_name}</td>
                                                            <td className="px-3 py-2 text-sm text-gray-600 text-center">
                                                                {item.available_quantity}
                                                            </td>
                                                            <td className="px-3 py-2 text-center">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max={item.available_quantity}
                                                                    value={item.refund_quantity}
                                                                    onChange={(e) => updateRefundItemQuantity(item.id, e.target.value)}
                                                                    disabled={item.available_quantity === 0}
                                                                    className="w-16 px-2 py-1 text-center border border-pos-border rounded focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary disabled:bg-gray-100"
                                                                />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <p className="mt-2 text-sm text-gray-600">
                                            Refund Amount: <span className="font-medium">{currency} {calculatePartialRefundAmount().toFixed(2)}</span>
                                        </p>
                                    </div>
                                )}

                                {/* Refund Reason */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Refund</label>
                                    <select
                                        className="w-full px-3 py-2.5 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary bg-white"
                                        value={refundReason}
                                        onChange={(e) => setRefundReason(e.target.value)}
                                    >
                                        {REFUND_REASONS.map(reason => (
                                            <option key={reason.value} value={reason.value}>
                                                {reason.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Reason Details */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Additional Details (Optional)</label>
                                    <textarea
                                        className="w-full px-3 py-2.5 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary resize-none"
                                        rows="2"
                                        placeholder="Enter any additional details about this refund..."
                                        value={refundReasonDetails}
                                        onChange={(e) => setRefundReasonDetails(e.target.value)}
                                    />
                                </div>

                                {/* Restore Stock */}
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="restoreStock"
                                        checked={restoreStock}
                                        onChange={(e) => setRestoreStock(e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 text-pos-primary focus:ring-pos-primary"
                                    />
                                    <label htmlFor="restoreStock" className="text-sm text-gray-700">
                                        Restore stock for refunded items
                                    </label>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        className="flex-1 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                        onClick={() => setShowRefundModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="flex-1 py-2.5 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={handleProcessRefund}
                                        disabled={processingRefund || (refundType === 'partial' && calculatePartialRefundAmount() === 0)}
                                    >
                                        {processingRefund ? 'Processing...' : 'Process Refund'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Receipt Modal */}
                {showReceiptModal && receiptTransaction && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowReceiptModal(false)}>
                        <div className={`bg-white rounded-xl ${receiptSettings.paperSize === '58mm' ? 'max-w-[280px]' : 'max-w-sm'} w-full max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between px-4 py-3 border-b border-pos-border">
                                <h2 className="text-lg font-semibold text-pos-text">Receipt</h2>
                                <div className="flex items-center gap-2">
                                    <button
                                        className="p-2 text-gray-500 hover:text-pos-text hover:bg-gray-100 rounded-lg transition-colors"
                                        onClick={handlePrintReceipt}
                                        title="Print Receipt"
                                    >
                                        <PrinterIcon />
                                    </button>
                                    <button className="text-gray-400 hover:text-gray-600" onClick={() => setShowReceiptModal(false)}>
                                        <XIcon />
                                    </button>
                                </div>
                            </div>

                            {/* Receipt Content */}
                            <div id="receipt-content" className={`p-4 font-mono ${receiptSettings.fontSize === 'small' ? 'text-xs' : receiptSettings.fontSize === 'large' ? 'text-base' : 'text-sm'}`}>
                                {/* Header */}
                                <div className="text-center mb-4">
                                    {receiptSettings.showLogo && (
                                        <div className="w-10 h-10 bg-gray-200 rounded mx-auto mb-2 flex items-center justify-center text-gray-400 text-xs">
                                            Logo
                                        </div>
                                    )}
                                    <p className="shop-name text-lg font-bold">{shopName.toUpperCase()}</p>
                                    {shopAddress && <p className="text-xs text-gray-500">{shopAddress}</p>}
                                    {shopPhone && <p className="text-xs text-gray-500">Tel: {shopPhone}</p>}
                                    {shopEmail && <p className="text-xs text-gray-500">{shopEmail}</p>}
                                    {receiptSettings.headerText && (
                                        <p className="text-xs text-gray-500 mt-1">{receiptSettings.headerText}</p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">--------------------------------</p>
                                </div>

                                {/* Transaction Info */}
                                <div className="mb-3 text-xs">
                                    {receiptSettings.showTransactionId && (
                                        <div className="flex justify-between">
                                            <span>Receipt #:</span>
                                            <span>{receiptTransaction.transaction_id}</span>
                                        </div>
                                    )}
                                    {receiptSettings.showDateTime && (
                                        <div className="flex justify-between">
                                            <span>Date:</span>
                                            <span>{formatReceiptDate(receiptTransaction.created_at)}</span>
                                        </div>
                                    )}
                                    {receiptSettings.showCashierName && (
                                        <div className="flex justify-between">
                                            <span>Cashier:</span>
                                            <span>{receiptTransaction.cashier_name || 'N/A'}</span>
                                        </div>
                                    )}
                                    {receiptTransaction.customer_name && (
                                        <div className="flex justify-between">
                                            <span>Customer:</span>
                                            <span>{receiptTransaction.customer_name}</span>
                                        </div>
                                    )}
                                </div>

                                <p className="text-center text-xs text-gray-500">--------------------------------</p>

                                {/* Items */}
                                <div className="my-3">
                                    {receiptTransaction.items?.map((item, index) => (
                                        <div key={index} className="mb-2">
                                            <p className="font-medium truncate">{item.product_name}</p>
                                            <div className="flex justify-between text-xs text-gray-600">
                                                <span>{item.quantity} x {currency} {parseFloat(item.unit_price).toFixed(2)}</span>
                                                <span>{currency} {parseFloat(item.subtotal).toFixed(2)}</span>
                                            </div>
                                            {parseFloat(item.discount) > 0 && (
                                                <div className="flex justify-between text-xs text-gray-500">
                                                    <span>Discount</span>
                                                    <span>-{currency} {parseFloat(item.discount).toFixed(2)}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <p className="text-center text-xs text-gray-500">--------------------------------</p>

                                {/* Totals */}
                                <div className="my-3 text-xs">
                                    <div className="flex justify-between">
                                        <span>Subtotal:</span>
                                        <span>{currency} {parseFloat(receiptTransaction.subtotal).toFixed(2)}</span>
                                    </div>
                                    {parseFloat(receiptTransaction.discount) > 0 && (
                                        <div className="flex justify-between text-gray-600">
                                            <span>Discount:</span>
                                            <span>-{currency} {parseFloat(receiptTransaction.discount).toFixed(2)}</span>
                                        </div>
                                    )}
                                    {parseFloat(receiptTransaction.tax) > 0 && receiptSettings.showTaxBreakdown && (
                                        <div className="flex justify-between">
                                            <span>{taxSettings.name} ({taxSettings.rate}%):</span>
                                            <span>{currency} {parseFloat(receiptTransaction.tax).toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t border-dashed border-gray-300">
                                        <span>TOTAL:</span>
                                        <span>{currency} {parseFloat(receiptTransaction.total).toFixed(2)}</span>
                                    </div>
                                </div>

                                <p className="text-center text-xs text-gray-500">--------------------------------</p>

                                {/* Payment Info */}
                                <div className="my-3 text-xs">
                                    <div className="flex justify-between">
                                        <span>Payment:</span>
                                        <span className="uppercase">
                                            {receiptTransaction.payment_method === 'mpesa' ? 'M-Pesa' :
                                             receiptTransaction.payment_method === 'split' ? 'Split' : 'Cash'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Amount Paid:</span>
                                        <span>{currency} {parseFloat(receiptTransaction.amount_paid).toFixed(2)}</span>
                                    </div>
                                    {parseFloat(receiptTransaction.change_amount) > 0 && (
                                        <div className="flex justify-between font-medium">
                                            <span>Change:</span>
                                            <span>{currency} {parseFloat(receiptTransaction.change_amount).toFixed(2)}</span>
                                        </div>
                                    )}
                                    {receiptTransaction.mpesa_reference && (
                                        <div className="flex justify-between mt-1">
                                            <span>M-Pesa Ref:</span>
                                            <span>{receiptTransaction.mpesa_reference}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="text-center mt-4 pt-3 border-t border-dashed border-gray-300">
                                    {receiptSettings.footerText && (
                                        <p className="text-xs text-gray-500">{receiptSettings.footerText}</p>
                                    )}
                                    {taxSettings.taxNumber && taxSettings.showOnReceipt && (
                                        <p className="text-xs text-gray-400 mt-1">PIN: {taxSettings.taxNumber}</p>
                                    )}
                                </div>
                            </div>

                            {/* Print Button */}
                            <div className="px-4 pb-4">
                                <button
                                    className="w-full py-2.5 bg-pos-primary text-white rounded-lg font-medium hover:bg-pos-text/90 transition-colors inline-flex items-center justify-center gap-2"
                                    onClick={handlePrintReceipt}
                                >
                                    <PrinterIcon />
                                    Print Receipt
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Transactions
