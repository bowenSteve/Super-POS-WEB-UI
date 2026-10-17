import { useState, useEffect, useRef } from "react"
import { useAuth } from "../context/AuthContext"
import { salesAPI, productsAPI } from "../api/api"
import Sidebar from "../components/Sidebar"
import ToastNotification, { toast } from '../components/ToastNotification'

const defaultTaxSettings = { enabled: true, rate: 16, name: 'VAT', includeInPrice: false, showOnReceipt: true, taxNumber: '' }
const defaultReceiptSettings = {
    showLogo: true, headerText: '', footerText: 'Thank you for your business!', showTaxBreakdown: true,
    showCashierName: true, showDateTime: true, showTransactionId: true, paperSize: '80mm', fontSize: 'medium'
}

const REFUND_REASONS = [
    { value: 'defective', label: 'Defective Product' },
    { value: 'wrong_item', label: 'Wrong Item' },
    { value: 'customer_change_mind', label: 'Customer Changed Mind' },
    { value: 'overcharge', label: 'Overcharge' },
    { value: 'damaged', label: 'Damaged Product' },
    { value: 'other', label: 'Other' },
]

const PAY_FILTERS = [['', 'All'], ['mpesa', 'M-Pesa'], ['cash', 'Cash'], ['split', 'Split']]
const STATUS_FILTERS = [['', 'Any status'], ['completed', 'Completed'], ['refunded', 'Refunded'], ['cancelled', 'Cancelled']]
const payDot = { mpesa: '#14373b', cash: '#ed8674', split: 'linear-gradient(90deg,#14373b 50%,#ed8674 50%)' }
const payLabel = { mpesa: 'M-Pesa', cash: 'Cash', split: 'Split' }
const statusStyle = {
    completed: ['#f0f8f5', '#14373b', 'transparent'],
    pending: ['#fff', '#14373b', 'rgba(20,55,59,0.25)'],
    refunded: ['rgba(237,134,116,0.16)', '#14373b', 'transparent'],
    cancelled: ['rgba(20,55,59,0.08)', 'rgba(20,55,59,0.5)', 'transparent'],
}

function Transactions() {
    const { currentShop } = useAuth()
    const [transactions, setTransactions] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [filterPaymentMethod, setFilterPaymentMethod] = useState("")
    const [filterStatus, setFilterStatus] = useState("")
    const [filterDateFrom, setFilterDateFrom] = useState("")
    const [filterDateTo, setFilterDateTo] = useState("")
    const [selectedTransaction, setSelectedTransaction] = useState(null)
    const [showExportModal, setShowExportModal] = useState(false)
    const [exportDateFrom, setExportDateFrom] = useState("")
    const [exportDateTo, setExportDateTo] = useState("")
    const [exporting, setExporting] = useState(false)
    const [showRefundModal, setShowRefundModal] = useState(false)
    const [refundType, setRefundType] = useState("full")
    const [refundReason, setRefundReason] = useState("other")
    const [refundReasonDetails, setRefundReasonDetails] = useState("")
    const [restoreStock, setRestoreStock] = useState(true)
    const [refundItems, setRefundItems] = useState([])
    const [processingRefund, setProcessingRefund] = useState(false)
    const [showReceiptModal, setShowReceiptModal] = useState(false)
    const [receiptTransaction, setReceiptTransaction] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const [pageSize] = useState(50)

    // Historical sales import (backfilling sales recorded on paper)
    const [showImportModal, setShowImportModal] = useState(false)
    const [importMode, setImportMode] = useState('upload')
    const [importing, setImporting] = useState(false)
    const [importResults, setImportResults] = useState(null)
    const importFileInputRef = useRef(null)
    const [qaDate, setQaDate] = useState("")
    const [qaAmount, setQaAmount] = useState("")
    const [qaProductName, setQaProductName] = useState("")
    const [qaProductResults, setQaProductResults] = useState([])
    const [qaPaymentMethod, setQaPaymentMethod] = useState("cash")
    const [qaNotes, setQaNotes] = useState("")
    const [submittingQuickAdd, setSubmittingQuickAdd] = useState(false)

    const taxSettings = currentShop?.tax_settings ? { ...defaultTaxSettings, ...currentShop.tax_settings } : defaultTaxSettings
    const receiptSettings = currentShop?.receipt_settings ? { ...defaultReceiptSettings, ...currentShop.receipt_settings } : defaultReceiptSettings
    const currency = currentShop?.currency || 'KSh'
    const shopName = currentShop?.name || 'Super POS'
    const shopAddress = currentShop?.address || ''
    const shopPhone = currentShop?.phone || ''
    const shopEmail = currentShop?.email || ''

    useEffect(() => {
        fetchTransactions()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, pageSize, filterPaymentMethod, filterStatus, filterDateFrom, filterDateTo, searchTerm])

    const fetchTransactions = async () => {
        setLoading(true)
        try {
            const params = { page: currentPage, page_size: pageSize }
            if (searchTerm) params.search = searchTerm
            if (filterPaymentMethod) params.payment_method = filterPaymentMethod
            if (filterStatus) params.status = filterStatus
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

    useEffect(() => {
        if (qaProductName.trim().length < 2) { setQaProductResults([]); return }
        const timer = setTimeout(async () => {
            try {
                const response = await productsAPI.getAll({ search: qaProductName.trim(), page_size: 5 })
                setQaProductResults(response.data.results || response.data || [])
            } catch (err) { /* silent - this is just a convenience lookup */ }
        }, 350)
        return () => clearTimeout(timer)
    }, [qaProductName])

    const resetQuickAddForm = () => {
        setQaDate(""); setQaAmount(""); setQaProductName(""); setQaProductResults([]); setQaPaymentMethod("cash"); setQaNotes("")
    }

    const closeImportModal = () => {
        setShowImportModal(false); setImportResults(null); setImportMode('upload'); resetQuickAddForm()
    }

    const handleDownloadImportSample = async () => {
        try {
            toast.loading('Preparing template...', { id: 'import-sample-toast' })
            const response = await salesAPI.downloadImportSample()
            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = 'sales_import_sample.xlsx'
            document.body.appendChild(link)
            link.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(link)
            toast.success('Template downloaded!', { id: 'import-sample-toast' })
        } catch (err) {
            toast.error('Failed to download template', { id: 'import-sample-toast' })
        }
    }

    const handleImportFileSelect = async (event) => {
        const file = event.target.files[0]
        if (!file) return
        const validExt = ['.csv', '.xlsx', '.xls'].some((ext) => file.name.toLowerCase().endsWith(ext))
        if (!validExt) {
            toast.error('Please select a .csv, .xlsx, or .xls file')
            event.target.value = ''
            return
        }
        setImporting(true)
        toast.loading('Importing sales...', { id: 'import-sales-toast' })
        try {
            const response = await salesAPI.importSales(file)
            setImportResults(response.data.results)
            toast.success(response.data.message, { id: 'import-sales-toast' })
            fetchTransactions()
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to import sales', { id: 'import-sales-toast' })
        } finally {
            setImporting(false)
            event.target.value = ''
        }
    }

    const handleQuickAddSale = async () => {
        if (!qaDate || !qaAmount) { toast.error('Date and amount are required'); return }
        setSubmittingQuickAdd(true)
        try {
            await salesAPI.quickAddSale({
                date: qaDate, amount: qaAmount, product_name: qaProductName || undefined,
                payment_method: qaPaymentMethod, notes: qaNotes
            })
            toast.success('Sale added')
            resetQuickAddForm()
            fetchTransactions()
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to add sale')
        } finally {
            setSubmittingQuickAdd(false)
        }
    }

    const handleFilterChange = (setter, value) => { setter(value); setCurrentPage(1) }
    const hasFilters = !!(searchTerm || filterPaymentMethod || filterStatus || filterDateFrom || filterDateTo)
    const clearFilters = () => {
        setSearchTerm(""); setFilterPaymentMethod(""); setFilterStatus(""); setFilterDateFrom(""); setFilterDateTo(""); setCurrentPage(1)
    }

    const completedOnPage = transactions.filter((t) => t.status === 'completed')
    const refundedOnPage = transactions.filter((t) => t.status === 'refunded')
    const netSales = completedOnPage.reduce((sum, t) => sum + (parseFloat(t.total) || 0) - (parseFloat(t.discount) || 0), 0)
    const refundedTotal = refundedOnPage.reduce((sum, t) => sum + (parseFloat(t.total) || 0), 0)

    const viewDetails = async (transactionId) => {
        try {
            const response = await salesAPI.getTransactionById(transactionId)
            setSelectedTransaction(response.data)
        } catch (err) {
            toast.error("Failed to fetch transaction details")
            console.error(err)
        }
    }

    const handleExportPDF = async () => {
        if (!exportDateFrom || !exportDateTo) { toast.error("Please select both start and end dates"); return }
        if (exportDateFrom > exportDateTo) { toast.error("Start date cannot be after end date"); return }
        setExporting(true)
        toast.loading("Generating PDF...", { id: 'export-toast' })
        try {
            const response = await salesAPI.exportPDF(exportDateFrom, exportDateTo)
            const blob = new Blob([response.data], { type: 'application/pdf' })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `transactions_${exportDateFrom}_to_${exportDateTo}.pdf`
            document.body.appendChild(link)
            link.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(link)
            toast.success("PDF exported successfully!", { id: 'export-toast' })
            setShowExportModal(false); setExportDateFrom(""); setExportDateTo("")
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to export PDF", { id: 'export-toast' })
        } finally {
            setExporting(false)
        }
    }

    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    const formatTime = (dateString) => new Date(dateString).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

    const openRefundModal = () => {
        if (!selectedTransaction) return
        const items = selectedTransaction.items.map((item) => ({
            id: item.id, product_name: item.product_name, quantity: item.quantity, unit_price: item.unit_price,
            subtotal: item.subtotal, refunded_quantity: item.refunded_quantity || 0,
            available_quantity: item.quantity - (item.refunded_quantity || 0), refund_quantity: 0
        }))
        setRefundItems(items); setRefundType("full"); setRefundReason("other"); setRefundReasonDetails(""); setRestoreStock(true)
        setShowRefundModal(true)
    }

    const updateRefundItemQuantity = (itemId, quantity) => {
        setRefundItems((prev) => prev.map((item) => item.id === itemId
            ? { ...item, refund_quantity: Math.max(0, Math.min(parseInt(quantity) || 0, item.available_quantity)) }
            : item))
    }

    const calculatePartialRefundAmount = () => refundItems.reduce((total, item) => {
        if (item.refund_quantity > 0) return total + (parseFloat(item.subtotal) / item.quantity) * item.refund_quantity
        return total
    }, 0)

    const handleProcessRefund = async () => {
        if (!selectedTransaction) return
        if (refundType === "partial" && !refundItems.some((i) => i.refund_quantity > 0)) {
            toast.error("Please select at least one item to refund"); return
        }
        setProcessingRefund(true)
        toast.loading("Processing refund...", { id: 'refund-toast' })
        try {
            const data = { refund_type: refundType, reason: refundReason, reason_details: refundReasonDetails, restore_stock: restoreStock }
            if (refundType === "partial") {
                data.items = refundItems.filter((i) => i.refund_quantity > 0).map((i) => ({ transaction_item_id: i.id, quantity: i.refund_quantity }))
            }
            await salesAPI.createRefund(selectedTransaction.id, data)
            toast.success("Refund processed successfully!", { id: 'refund-toast' })
            setShowRefundModal(false); setSelectedTransaction(null)
            fetchTransactions()
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to process refund", { id: 'refund-toast' })
        } finally {
            setProcessingRefund(false)
        }
    }

    const viewReceipt = async (transactionId) => {
        try {
            const response = await salesAPI.getTransactionById(transactionId)
            setReceiptTransaction(response.data)
            setShowReceiptModal(true)
        } catch (err) {
            toast.error("Failed to load receipt")
        }
    }

    const handlePrintReceipt = () => {
        const printContent = document.getElementById('receipt-content')
        const printWindow = window.open('', '_blank')
        const paperWidth = receiptSettings.paperSize === '58mm' ? '220px' : '300px'
        const fontSize = receiptSettings.fontSize === 'small' ? '11px' : receiptSettings.fontSize === 'large' ? '14px' : '12px'
        printWindow.document.write(`<html><head><title>Receipt - ${receiptTransaction?.transaction_id}</title>
            <style>body{font-family:'Courier New',monospace;padding:20px;max-width:${paperWidth};margin:0 auto;font-size:${fontSize}}
            .text-center{text-align:center}@media print{body{padding:0}}</style></head>
            <body>${printContent.innerHTML}</body></html>`)
        printWindow.document.close()
        printWindow.print()
    }

    const initials = (currentShop?.name || '?').slice(0, 2).toUpperCase()

    return (
        <div className="flex min-h-screen bg-brand-surface font-sans text-brand-ink">
            <ToastNotification />
            <Sidebar />

            <div className="flex-1 min-w-0">
                <header className="sticky top-0 z-20 bg-brand-surface/[0.9] backdrop-blur-md border-b border-brand-ink/[0.09]">
                    <div className="flex items-center gap-4 px-8 py-4">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-[22px] font-semibold tracking-[-0.03em]">Transactions</h1>
                            <div className="text-[13px] text-brand-ink/55 mt-0.5">Every receipt issued in {shopName}</div>
                        </div>
                        <button onClick={() => setShowImportModal(true)} className="h-10 flex items-center gap-2 px-3.5 bg-white border border-brand-ink/[0.14] rounded-[11px] text-[13.5px] font-semibold cursor-pointer hover:bg-brand-surface transition-colors">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15V3M8 7l4-4 4 4M4 21h16"></path></svg>
                            Import past sales
                        </button>
                        <button onClick={() => setShowExportModal(true)} className="h-10 flex items-center gap-2 px-3.5 bg-brand-ink text-brand-surface border-0 rounded-[11px] text-[13.5px] font-semibold cursor-pointer hover:bg-brand-ink/90 transition-colors">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 10l5 5 5-5M4 21h16"></path></svg>
                            Export PDF
                        </button>
                        <span className="w-[38px] h-[38px] rounded-full bg-brand-ink text-brand-surface grid place-items-center text-[13px] font-semibold">{initials}</span>
                    </div>
                </header>

                <div className="px-8 py-6 grid gap-4">

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-px bg-brand-ink/[0.09] border border-brand-ink/[0.09] rounded-2xl overflow-hidden">
                        <div className="bg-brand-ink text-brand-surface px-[22px] py-[18px]">
                            <div className="text-[12.5px] text-brand-surface/65">Net sales (this page)</div>
                            <div className="text-2xl font-semibold tracking-[-0.035em] mt-1.5">{currency} {netSales.toFixed(2)}</div>
                        </div>
                        <div className="bg-white px-[22px] py-[18px]">
                            <div className="text-[12.5px] text-brand-ink/60">Transactions</div>
                            <div className="text-2xl font-semibold tracking-[-0.035em] mt-1.5">{totalCount}</div>
                        </div>
                        <div className="bg-white px-[22px] py-[18px]">
                            <div className="text-[12.5px] text-brand-ink/60">Average sale (this page)</div>
                            <div className="text-2xl font-semibold tracking-[-0.035em] mt-1.5">{currency} {completedOnPage.length ? (netSales / completedOnPage.length).toFixed(2) : '0.00'}</div>
                        </div>
                        <div className="bg-white px-[22px] py-[18px]">
                            <div className="text-[12.5px] text-brand-ink/60">Refunds (this page)</div>
                            <div className="text-2xl font-semibold tracking-[-0.035em] mt-1.5">{refundedOnPage.length} · {currency} {refundedTotal.toFixed(2)}</div>
                        </div>
                    </div>

                    <div className="bg-white border border-brand-ink/[0.09] rounded-2xl p-3.5 flex flex-wrap gap-2.5 items-center">
                        <label className="flex-1 min-w-[220px] flex items-center gap-2.5 bg-brand-surface rounded-[11px] px-3 h-[42px] focus-within:ring-1 focus-within:ring-brand-ink transition-shadow">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="opacity-50 flex-none"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg>
                            <input type="text" value={searchTerm} onChange={(e) => handleFilterChange(setSearchTerm, e.target.value)} placeholder="Search receipt #, cashier, M-Pesa code" className="flex-1 min-w-0 border-0 outline-none bg-transparent text-sm" />
                        </label>
                        <div className="flex gap-[3px] p-[3px] bg-brand-surface rounded-[11px]">
                            {PAY_FILTERS.map(([val, label]) => (
                                <button key={val} onClick={() => handleFilterChange(setFilterPaymentMethod, val)} className={`border-0 text-[13px] font-semibold px-3 py-2 rounded-lg cursor-pointer ${filterPaymentMethod === val ? 'bg-white shadow-sm' : 'bg-transparent text-brand-ink/60'}`}>{label}</button>
                            ))}
                        </div>
                        <div className="flex gap-[3px] p-[3px] bg-brand-surface rounded-[11px]">
                            {STATUS_FILTERS.map(([val, label]) => (
                                <button key={val} onClick={() => handleFilterChange(setFilterStatus, val)} className={`border-0 text-[13px] font-semibold px-3 py-2 rounded-lg cursor-pointer ${filterStatus === val ? 'bg-white shadow-sm' : 'bg-transparent text-brand-ink/60'}`}>{label}</button>
                            ))}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <input type="date" value={filterDateFrom} onChange={(e) => handleFilterChange(setFilterDateFrom, e.target.value)} className="h-[42px] px-2.5 border border-brand-ink/[0.14] rounded-[11px] text-[13px]" />
                            <span className="text-brand-ink/40">–</span>
                            <input type="date" value={filterDateTo} onChange={(e) => handleFilterChange(setFilterDateTo, e.target.value)} className="h-[42px] px-2.5 border border-brand-ink/[0.14] rounded-[11px] text-[13px]" />
                        </div>
                        {hasFilters && <button onClick={clearFilters} className="border-0 bg-transparent text-[13px] font-semibold text-brand-ink/60 cursor-pointer underline px-1.5">Clear</button>}
                    </div>

                    <div className="bg-white border border-brand-ink/[0.09] rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-[13.5px] min-w-[760px]">
                                <thead>
                                    <tr className="bg-[#fafcfb] border-b border-brand-ink/[0.08]">
                                        <th className="text-left text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50 px-[18px] py-3">Receipt</th>
                                        <th className="text-left text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50 px-3 py-3">Time</th>
                                        <th className="text-left text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50 px-3 py-3">Cashier</th>
                                        <th className="text-right text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50 px-3 py-3">Items</th>
                                        <th className="text-left text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50 px-3 py-3">Payment</th>
                                        <th className="text-left text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50 px-3 py-3">Status</th>
                                        <th className="text-right text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50 px-[18px] py-3">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={7} className="px-4 py-12 text-center text-brand-ink/50">Loading transactions…</td></tr>
                                    ) : transactions.length === 0 ? (
                                        <tr><td colSpan={7} className="px-4 py-12 text-center">
                                            <div className="text-[15px] font-semibold">No transactions match these filters</div>
                                            {hasFilters && <button onClick={clearFilters} className="mt-3 bg-brand-surface border-0 text-[13px] font-semibold px-3.5 py-2 rounded-[10px] cursor-pointer">Clear filters</button>}
                                        </td></tr>
                                    ) : transactions.map((t) => {
                                        const ss = statusStyle[t.status] || statusStyle.completed
                                        const on = selectedTransaction?.id === t.id
                                        return (
                                            <tr key={t.id} onClick={() => viewDetails(t.id)} className="border-b border-brand-ink/[0.06] cursor-pointer hover:bg-brand-surface/60 transition-colors" style={{ background: on ? '#f0f8f5' : '#fff' }}>
                                                <td className="px-[18px] py-3 font-mono text-[12.5px] font-medium whitespace-nowrap">{t.transaction_id}</td>
                                                <td className="px-3 py-3 whitespace-nowrap text-brand-ink/70">{formatTime(t.created_at)}</td>
                                                <td className="px-3 py-3 whitespace-nowrap">{t.cashier_name || 'N/A'}</td>
                                                <td className="px-3 py-3 text-right text-brand-ink/70">{t.items?.length || 0}</td>
                                                <td className="px-3 py-3 whitespace-nowrap">
                                                    <span className="inline-flex items-center gap-[7px] font-medium">
                                                        <span className="w-2 h-2 rounded-sm" style={{ background: payDot[t.payment_method] }} />
                                                        {payLabel[t.payment_method] || t.payment_method}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <span className="inline-flex items-center gap-1.5 flex-wrap">
                                                        <span className="inline-block text-xs font-semibold px-2.5 py-[3px] rounded-full whitespace-nowrap" style={{ background: ss[0], color: ss[1], border: `1px solid ${ss[2]}` }}>
                                                            {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                                                        </span>
                                                        {t.source === 'imported' && (
                                                            <span className="inline-block text-xs font-semibold px-2.5 py-[3px] rounded-full whitespace-nowrap bg-brand-surface text-brand-ink/60 border border-brand-ink/[0.14]">Imported</span>
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="px-[18px] py-3 text-right font-mono font-medium whitespace-nowrap" style={{ textDecoration: t.status === 'refunded' ? 'line-through' : 'none' }}>
                                                    {currency} {t.total}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex flex-wrap gap-2.5 justify-between items-center px-[18px] py-3 border-t border-brand-ink/[0.06] text-[13px] text-brand-ink/60">
                            <span>Showing {transactions.length} of {totalCount} transactions</span>
                            {totalPages > 1 && (
                                <span className="flex gap-1.5">
                                    <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-8 px-3 bg-white border border-brand-ink/[0.14] rounded-lg text-[13px] disabled:opacity-50 cursor-pointer">Previous</button>
                                    <span className="px-2 py-1.5">{currentPage} / {totalPages}</span>
                                    <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-8 px-3 bg-white border border-brand-ink/[0.14] rounded-lg text-[13px] disabled:opacity-50 cursor-pointer">Next</button>
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {selectedTransaction && (
                    <>
                        <div onClick={() => setSelectedTransaction(null)} className="fixed inset-0 bg-[rgba(12,34,37,0.35)] z-[90]" />
                        <aside className="fixed top-0 right-0 bottom-0 w-full sm:w-[400px] bg-white border-l border-brand-ink/[0.12] shadow-2xl overflow-y-auto z-[100]">
                            <div className="bg-brand-ink text-brand-surface px-5 py-[18px]">
                                <div className="flex justify-between items-center">
                                    <span className="font-mono text-[12.5px] text-brand-surface/70">{selectedTransaction.transaction_id}</span>
                                    <button onClick={() => setSelectedTransaction(null)} aria-label="Close" className="w-[30px] h-[30px] border-0 rounded-lg bg-brand-surface/10 text-brand-surface cursor-pointer grid place-items-center">
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18"></path></svg>
                                    </button>
                                </div>
                                <div className="text-[30px] font-semibold tracking-[-0.04em] mt-1.5">{currency} {selectedTransaction.total}</div>
                                <div className="text-[12.5px] text-brand-surface/62 mt-0.5">
                                    {selectedTransaction.source === 'imported' && selectedTransaction.transaction_date
                                        ? new Date(selectedTransaction.transaction_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                        : formatDate(selectedTransaction.created_at)
                                    } · {selectedTransaction.status}{selectedTransaction.source === 'imported' && ' · Imported'}
                                </div>
                            </div>
                            <div className="p-5 grid gap-3.5">
                                <div className="grid">
                                    {selectedTransaction.items?.map((l, i) => (
                                        <div key={i} className="flex justify-between gap-2.5 py-2.5 border-b border-dashed border-brand-ink/[0.12] text-[13.5px]">
                                            <span><span className="font-semibold">{l.quantity}×</span> {l.product_name}</span>
                                            <span className="font-mono text-[12.5px]">{currency} {l.subtotal}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="grid gap-1.5 text-[13px] text-brand-ink/65">
                                    <div className="flex justify-between"><span>Subtotal</span><span className="font-mono">{currency} {selectedTransaction.subtotal}</span></div>
                                    <div className="flex justify-between"><span>Discount</span><span className="font-mono">-{currency} {selectedTransaction.discount}</span></div>
                                    {parseFloat(selectedTransaction.tax) > 0 && (
                                        <div className="flex justify-between"><span>{taxSettings.name} {taxSettings.rate}%</span><span className="font-mono">{currency} {selectedTransaction.tax}</span></div>
                                    )}
                                </div>
                                <div className="bg-brand-surface rounded-xl px-3.5 py-3 grid gap-1.5 text-[13px]">
                                    <div className="flex justify-between"><span className="text-brand-ink/60">Paid by</span><span className="font-semibold">{payLabel[selectedTransaction.payment_method] || selectedTransaction.payment_method}</span></div>
                                    {selectedTransaction.mpesa_reference && <div className="flex justify-between"><span className="text-brand-ink/60">Reference</span><span className="font-mono text-[12.5px]">{selectedTransaction.mpesa_reference}</span></div>}
                                    <div className="flex justify-between"><span className="text-brand-ink/60">Cashier</span><span className="font-semibold">{selectedTransaction.cashier_name || 'N/A'}</span></div>
                                    <div className="flex justify-between"><span className="text-brand-ink/60">Customer</span><span className="font-semibold">{selectedTransaction.customer_name || 'Walk-in'}</span></div>
                                    {selectedTransaction.total_refunded > 0 && (
                                        <div className="flex justify-between"><span className="text-brand-ink/60">Refunded</span><span className="font-semibold text-[#c8553d]">-{currency} {selectedTransaction.total_refunded?.toFixed(2)}</span></div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => viewReceipt(selectedTransaction.id)} className="h-[42px] bg-brand-ink text-brand-surface border-0 rounded-[11px] text-[13.5px] font-semibold cursor-pointer hover:bg-brand-ink/90 transition-colors">Print receipt</button>
                                    <button disabled title="Coming soon" className="h-[42px] bg-white border border-brand-ink/[0.14] rounded-[11px] text-[13.5px] font-semibold opacity-50 cursor-not-allowed">Send by SMS</button>
                                </div>
                                {selectedTransaction.can_refund && selectedTransaction.status !== 'cancelled' && (
                                    <button onClick={openRefundModal} className="h-10 bg-transparent border rounded-[11px] text-[13px] font-semibold cursor-pointer" style={{ borderColor: 'rgba(237,134,116,0.6)' }}>Refund sale</button>
                                )}
                                {selectedTransaction.status === 'refunded' && (
                                    <p className="text-[13px] text-brand-ink/60 text-center bg-brand-surface rounded-lg py-2.5">This transaction has been fully refunded.</p>
                                )}
                            </div>
                        </aside>
                    </>
                )}

                <input
                    ref={importFileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleImportFileSelect}
                    style={{ display: 'none' }}
                />

                {showImportModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-4" onClick={closeImportModal}>
                        <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 grid gap-5" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold">Import past sales</h2>
                                <button onClick={closeImportModal} className="text-brand-ink/40 hover:text-brand-ink">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>

                            {importResults ? (
                                <div className="grid gap-4">
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-brand-surface rounded-xl p-3">
                                            <p className="text-xs text-brand-ink/60 font-medium mb-1">Total rows</p>
                                            <p className="text-xl font-semibold">{importResults.total_rows}</p>
                                        </div>
                                        <div className="rounded-xl p-3" style={{ background: 'rgba(47,122,95,0.1)' }}>
                                            <p className="text-xs font-medium mb-1" style={{ color: '#2f7a5f' }}>Imported</p>
                                            <p className="text-xl font-semibold" style={{ color: '#2f7a5f' }}>{importResults.success.length}</p>
                                        </div>
                                        <div className="bg-brand-surface rounded-xl p-3">
                                            <p className="text-xs text-brand-ink/60 font-medium mb-1">Errors</p>
                                            <p className="text-xl font-semibold">{importResults.errors.length}</p>
                                        </div>
                                    </div>
                                    {importResults.errors.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-semibold mb-2">Errors</h3>
                                            <div className="bg-brand-surface rounded-xl p-3 max-h-48 overflow-y-auto grid gap-2">
                                                {importResults.errors.map((item) => (
                                                    <div key={`error-${item.row}`} className="text-sm"><span className="font-semibold">Row {item.row}:</span> {item.error}</div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <button onClick={closeImportModal} className="py-2.5 bg-brand-ink text-brand-surface rounded-[11px] font-semibold cursor-pointer">Done</button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex gap-2.5">
                                        {['upload', 'quick'].map((m) => (
                                            <button key={m} onClick={() => setImportMode(m)} className={`flex-1 py-2.5 rounded-[11px] font-semibold cursor-pointer ${importMode === m ? 'bg-brand-ink text-brand-surface' : 'bg-brand-surface'}`}>
                                                {m === 'upload' ? 'Upload file' : 'Add one sale'}
                                            </button>
                                        ))}
                                    </div>

                                    {importMode === 'upload' ? (
                                        <div className="grid gap-3">
                                            <p className="text-[13px] text-brand-ink/65">Upload a CSV or Excel file with columns <span className="font-mono">date, amount</span> (required) and optionally <span className="font-mono">product_name, payment_method, notes</span>. This never affects stock levels.</p>
                                            <button onClick={handleDownloadImportSample} className="text-[13px] font-semibold text-left underline w-fit cursor-pointer bg-transparent border-0 p-0">Download template</button>
                                            <button onClick={() => importFileInputRef.current.click()} disabled={importing} className="py-2.5 bg-brand-ink text-brand-surface rounded-[11px] font-semibold cursor-pointer disabled:opacity-50">
                                                {importing ? 'Importing…' : 'Choose file to upload'}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="grid gap-3.5">
                                            <div className="grid gap-[7px]">
                                                <label className="text-[13px] font-semibold">Date of sale</label>
                                                <input type="date" value={qaDate} onChange={(e) => setQaDate(e.target.value)} className="h-11 border border-brand-ink/[0.16] rounded-[11px] px-3.5" />
                                            </div>
                                            <div className="grid gap-[7px]">
                                                <label className="text-[13px] font-semibold">Amount ({currency})</label>
                                                <input type="number" min="0" step="0.01" value={qaAmount} onChange={(e) => setQaAmount(e.target.value)} className="h-11 border border-brand-ink/[0.16] rounded-[11px] px-3.5" />
                                            </div>
                                            <div className="grid gap-[7px] relative">
                                                <label className="text-[13px] font-semibold">Product (optional)</label>
                                                <input type="text" value={qaProductName} onChange={(e) => setQaProductName(e.target.value)} placeholder="Type a product name, or leave blank" className="h-11 border border-brand-ink/[0.16] rounded-[11px] px-3.5" autoComplete="off" />
                                                {qaProductResults.length > 0 && (
                                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-brand-ink/[0.14] rounded-[11px] shadow-lg z-10 max-h-40 overflow-y-auto">
                                                        {qaProductResults.map((p) => (
                                                            <button key={p.id} onClick={() => { setQaProductName(p.name); setQaProductResults([]) }} className="w-full text-left px-3.5 py-2 text-sm hover:bg-brand-surface cursor-pointer">{p.name}</button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="grid gap-[7px]">
                                                <label className="text-[13px] font-semibold">Payment method</label>
                                                <select value={qaPaymentMethod} onChange={(e) => setQaPaymentMethod(e.target.value)} className="h-11 border border-brand-ink/[0.16] rounded-[11px] px-3.5">
                                                    <option value="cash">Cash</option>
                                                    <option value="mpesa">M-Pesa</option>
                                                    <option value="split">Split</option>
                                                    <option value="unknown">Not sure</option>
                                                </select>
                                            </div>
                                            <textarea value={qaNotes} onChange={(e) => setQaNotes(e.target.value)} rows={2} placeholder="Notes (optional)" className="border border-brand-ink/[0.16] rounded-[11px] px-3.5 py-2.5 resize-none" />
                                            <button onClick={handleQuickAddSale} disabled={submittingQuickAdd || !qaDate || !qaAmount} className="py-2.5 bg-brand-ink text-brand-surface rounded-[11px] font-semibold cursor-pointer disabled:opacity-50">
                                                {submittingQuickAdd ? 'Adding…' : 'Add sale'}
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {showExportModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-4" onClick={() => setShowExportModal(false)}>
                        <div className="bg-white rounded-2xl w-full max-w-md p-6 grid gap-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold">Export transactions to PDF</h2>
                                <button onClick={() => setShowExportModal(false)} className="text-brand-ink/40 hover:text-brand-ink">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>
                            <div className="grid gap-[7px]">
                                <label className={"text-[13px] font-semibold"}>From date</label>
                                <input type="date" value={exportDateFrom} onChange={(e) => setExportDateFrom(e.target.value)} className="h-11 border border-brand-ink/[0.16] rounded-[11px] px-3.5" />
                            </div>
                            <div className="grid gap-[7px]">
                                <label className={"text-[13px] font-semibold"}>To date</label>
                                <input type="date" value={exportDateTo} onChange={(e) => setExportDateTo(e.target.value)} className="h-11 border border-brand-ink/[0.16] rounded-[11px] px-3.5" />
                            </div>
                            <div className="flex gap-2.5 pt-2">
                                <button onClick={() => setShowExportModal(false)} className="flex-1 py-2.5 border border-brand-ink/20 rounded-[11px] font-semibold cursor-pointer">Cancel</button>
                                <button onClick={handleExportPDF} disabled={exporting || !exportDateFrom || !exportDateTo} className="flex-1 py-2.5 bg-brand-ink text-brand-surface rounded-[11px] font-semibold cursor-pointer disabled:opacity-50">{exporting ? 'Exporting…' : 'Export PDF'}</button>
                            </div>
                        </div>
                    </div>
                )}

                {showRefundModal && selectedTransaction && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-4" onClick={() => setShowRefundModal(false)}>
                        <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 grid gap-5" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold">Process refund</h2>
                                <button onClick={() => setShowRefundModal(false)} className="text-brand-ink/40 hover:text-brand-ink">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>
                            <div className="bg-brand-surface rounded-xl p-3">
                                <p className="font-mono text-sm">{selectedTransaction.transaction_id}</p>
                                <p className="text-[13px] text-brand-ink/65 mt-1">Total: {currency} {selectedTransaction.total} · Refunded: {currency} {selectedTransaction.total_refunded?.toFixed(2) || '0.00'}</p>
                            </div>
                            <div className="flex gap-2.5">
                                {['full', 'partial'].map((t) => (
                                    <button key={t} onClick={() => setRefundType(t)} className={`flex-1 py-2.5 rounded-[11px] font-semibold cursor-pointer capitalize ${refundType === t ? 'bg-brand-ink text-brand-surface' : 'bg-brand-surface'}`}>{t} refund</button>
                                ))}
                            </div>
                            {refundType === 'partial' && (
                                <div>
                                    <div className="border border-brand-ink/[0.14] rounded-xl overflow-hidden">
                                        <table className="w-full text-[13px]">
                                            <thead><tr className="bg-brand-surface"><th className="text-left px-3 py-2 font-semibold">Product</th><th className="text-center px-3 py-2 font-semibold">Available</th><th className="text-center px-3 py-2 font-semibold">Qty</th></tr></thead>
                                            <tbody>
                                                {refundItems.map((item) => (
                                                    <tr key={item.id} className={`border-t border-brand-ink/[0.08] ${item.available_quantity === 0 ? 'opacity-50' : ''}`}>
                                                        <td className="px-3 py-2">{item.product_name}</td>
                                                        <td className="px-3 py-2 text-center">{item.available_quantity}</td>
                                                        <td className="px-3 py-2 text-center">
                                                            <input type="number" min="0" max={item.available_quantity} value={item.refund_quantity} onChange={(e) => updateRefundItemQuantity(item.id, e.target.value)} disabled={item.available_quantity === 0} className="w-16 text-center border border-brand-ink/[0.16] rounded px-1 py-1 disabled:bg-brand-surface" />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <p className="mt-2 text-sm">Refund amount: <span className="font-semibold">{currency} {calculatePartialRefundAmount().toFixed(2)}</span></p>
                                </div>
                            )}
                            <div className="grid gap-[7px]">
                                <label className="text-[13px] font-semibold">Reason for refund</label>
                                <select value={refundReason} onChange={(e) => setRefundReason(e.target.value)} className="h-11 border border-brand-ink/[0.16] rounded-[11px] px-3.5">
                                    {REFUND_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                                </select>
                            </div>
                            <textarea value={refundReasonDetails} onChange={(e) => setRefundReasonDetails(e.target.value)} rows={2} placeholder="Additional details (optional)" className="border border-brand-ink/[0.16] rounded-[11px] px-3.5 py-2.5 resize-none" />
                            <label className="flex items-center gap-2.5 text-sm">
                                <input type="checkbox" checked={restoreStock} onChange={(e) => setRestoreStock(e.target.checked)} className="w-4 h-4 accent-brand-ink" />
                                Restore stock for refunded items
                            </label>
                            <div className="flex gap-2.5">
                                <button onClick={() => setShowRefundModal(false)} className="flex-1 py-2.5 border border-brand-ink/20 rounded-[11px] font-semibold cursor-pointer">Cancel</button>
                                <button onClick={handleProcessRefund} disabled={processingRefund || (refundType === 'partial' && calculatePartialRefundAmount() === 0)} className="flex-1 py-2.5 bg-brand-ink text-brand-surface rounded-[11px] font-semibold cursor-pointer disabled:opacity-50">{processingRefund ? 'Processing…' : 'Process refund'}</button>
                            </div>
                        </div>
                    </div>
                )}

                {showReceiptModal && receiptTransaction && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-4" onClick={() => setShowReceiptModal(false)}>
                        <div className={`bg-white rounded-2xl ${receiptSettings.paperSize === '58mm' ? 'max-w-[280px]' : 'max-w-sm'} w-full max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between px-4 py-3 border-b border-brand-ink/[0.1]">
                                <h2 className="text-lg font-semibold">Receipt</h2>
                                <div className="flex items-center gap-2">
                                    <button onClick={handlePrintReceipt} className="p-2 hover:bg-brand-surface rounded-lg" title="Print">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                                    </button>
                                    <button onClick={() => setShowReceiptModal(false)} className="text-brand-ink/40 hover:text-brand-ink">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                </div>
                            </div>
                            <div id="receipt-content" className={`p-4 font-mono ${receiptSettings.fontSize === 'small' ? 'text-xs' : receiptSettings.fontSize === 'large' ? 'text-base' : 'text-sm'}`}>
                                <div className="text-center mb-4">
                                    <p className="text-lg font-bold">{shopName.toUpperCase()}</p>
                                    {shopAddress && <p className="text-xs text-gray-500">{shopAddress}</p>}
                                    {shopPhone && <p className="text-xs text-gray-500">Tel: {shopPhone}</p>}
                                    {shopEmail && <p className="text-xs text-gray-500">{shopEmail}</p>}
                                    {receiptSettings.headerText && <p className="text-xs text-gray-500 mt-1">{receiptSettings.headerText}</p>}
                                    <p className="text-xs text-gray-500 mt-1">--------------------------------</p>
                                </div>
                                <div className="mb-3 text-xs">
                                    {receiptSettings.showTransactionId && <div className="flex justify-between"><span>Receipt #:</span><span>{receiptTransaction.transaction_id}</span></div>}
                                    {receiptSettings.showDateTime && <div className="flex justify-between"><span>Date:</span><span>{formatDate(receiptTransaction.created_at)}</span></div>}
                                    {receiptSettings.showCashierName && <div className="flex justify-between"><span>Cashier:</span><span>{receiptTransaction.cashier_name || 'N/A'}</span></div>}
                                    {receiptTransaction.customer_name && <div className="flex justify-between"><span>Customer:</span><span>{receiptTransaction.customer_name}</span></div>}
                                </div>
                                <p className="text-center text-xs text-gray-500">--------------------------------</p>
                                <div className="my-3">
                                    {receiptTransaction.items?.map((item, index) => (
                                        <div key={index} className="mb-2">
                                            <p className="font-medium truncate">{item.product_name}</p>
                                            <div className="flex justify-between text-xs text-gray-600">
                                                <span>{item.quantity} x {currency} {parseFloat(item.unit_price).toFixed(2)}</span>
                                                <span>{currency} {parseFloat(item.subtotal).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-center text-xs text-gray-500">--------------------------------</p>
                                <div className="my-3 text-xs">
                                    <div className="flex justify-between"><span>Subtotal:</span><span>{currency} {parseFloat(receiptTransaction.subtotal).toFixed(2)}</span></div>
                                    {parseFloat(receiptTransaction.tax) > 0 && receiptSettings.showTaxBreakdown && (
                                        <div className="flex justify-between"><span>{taxSettings.name} ({taxSettings.rate}%):</span><span>{currency} {parseFloat(receiptTransaction.tax).toFixed(2)}</span></div>
                                    )}
                                    <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t border-dashed border-gray-300"><span>TOTAL:</span><span>{currency} {parseFloat(receiptTransaction.total).toFixed(2)}</span></div>
                                </div>
                                <p className="text-center text-xs text-gray-500">--------------------------------</p>
                                <div className="my-3 text-xs">
                                    <div className="flex justify-between"><span>Payment:</span><span className="uppercase">{payLabel[receiptTransaction.payment_method] || receiptTransaction.payment_method}</span></div>
                                    {receiptTransaction.mpesa_reference && <div className="flex justify-between mt-1"><span>M-Pesa Ref:</span><span>{receiptTransaction.mpesa_reference}</span></div>}
                                </div>
                                <div className="text-center mt-4 pt-3 border-t border-dashed border-gray-300">
                                    {receiptSettings.footerText && <p className="text-xs text-gray-500">{receiptSettings.footerText}</p>}
                                    {taxSettings.taxNumber && taxSettings.showOnReceipt && <p className="text-xs text-gray-400 mt-1">PIN: {taxSettings.taxNumber}</p>}
                                </div>
                            </div>
                            <div className="px-4 pb-4">
                                <button onClick={handlePrintReceipt} className="w-full py-2.5 bg-brand-ink text-brand-surface rounded-[11px] font-semibold cursor-pointer">Print receipt</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Transactions
