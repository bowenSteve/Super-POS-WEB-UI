import { useState, useEffect } from 'react'
import { useShift } from '../context/ShiftContext'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

function ShiftModal({ isOpen, onClose }) {
    const { currentShop } = useAuth()
    const { currentShift, isShiftOpen, openShift, closeShift, exportShiftPDF, loading } = useShift()
    const [openingCash, setOpeningCash] = useState('')
    const [closingCash, setClosingCash] = useState('')
    const [notes, setNotes] = useState('')
    const [closingNotes, setClosingNotes] = useState('')
    const [shiftReport, setShiftReport] = useState(null)
    const [showReport, setShowReport] = useState(false)

    const currency = currentShop?.currency || 'KSh'

    // Reset form when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setOpeningCash('')
            setClosingCash('')
            setNotes('')
            setClosingNotes('')
            setShiftReport(null)
            setShowReport(false)
        }
    }, [isOpen])

    const handleOpenShift = async (e) => {
        e.preventDefault()
        const amount = parseFloat(openingCash)

        if (isNaN(amount) || amount < 0) {
            toast.error('Please enter a valid opening cash amount')
            return
        }

        const result = await openShift(amount, notes)
        if (result.success) {
            toast.success('Shift opened successfully')
            onClose()
        } else {
            toast.error(result.error)
        }
    }

    const handleCloseShift = async (e) => {
        e.preventDefault()
        const amount = parseFloat(closingCash)

        if (isNaN(amount) || amount < 0) {
            toast.error('Please enter a valid closing cash amount')
            return
        }

        const result = await closeShift(amount, closingNotes)
        if (result.success) {
            toast.success('Shift closed successfully')
            setShiftReport(result.data)
            setShowReport(true)
        } else {
            toast.error(result.error)
        }
    }

    const handleExportPDF = async () => {
        if (shiftReport) {
            const result = await exportShiftPDF(shiftReport.id)
            if (result.success) {
                toast.success('PDF downloaded')
            } else {
                toast.error(result.error)
            }
        }
    }

    const handlePrintReport = () => {
        const printContent = document.getElementById('shift-report-content')
        if (!printContent) return

        const printWindow = window.open('', '_blank')
        printWindow.document.write(`
            <html>
            <head>
                <title>Shift Report - ${shiftReport?.shift_id}</title>
                <style>
                    body {
                        font-family: 'Courier New', monospace;
                        padding: 20px;
                        max-width: 300px;
                        margin: 0 auto;
                    }
                    h2 { text-align: center; margin-bottom: 10px; }
                    .header { text-align: center; margin-bottom: 15px; }
                    .divider { border-top: 1px dashed #000; margin: 10px 0; }
                    .row { display: flex; justify-content: space-between; margin: 5px 0; }
                    .label { color: #666; }
                    .value { font-weight: bold; }
                    .total-row { font-size: 1.1em; font-weight: bold; }
                    .signature { margin-top: 40px; }
                    .signature-line { border-top: 1px solid #000; width: 150px; margin: 30px auto 5px; }
                    .signature-label { text-align: center; font-size: 0.9em; }
                    @media print {
                        body { padding: 0; }
                    }
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

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A'
        const date = new Date(dateString)
        return date.toLocaleString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatCurrency = (amount) => {
        return `${currency} ${parseFloat(amount || 0).toFixed(2)}`
    }

    if (!isOpen) return null

    // Show shift report after closing
    if (showReport && shiftReport) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                    <div className="p-5 border-b border-pos-border flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-pos-text">Shift Closing Report</h2>
                        <button
                            onClick={onClose}
                            className="p-1 text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>

                    <div className="p-5" id="shift-report-content">
                        {/* Header */}
                        <div className="text-center mb-4">
                            <h3 className="font-bold text-lg">{currentShop?.name}</h3>
                            <p className="text-sm text-gray-500">Shift Report</p>
                            <p className="text-sm font-medium mt-2">{shiftReport.shift_id}</p>
                        </div>

                        {/* Shift Info */}
                        <div className="border-t border-dashed border-gray-300 py-3">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Cashier:</span>
                                <span className="font-medium">{shiftReport.cashier_name}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Started:</span>
                                <span className="font-medium">{formatDateTime(shiftReport.started_at)}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Ended:</span>
                                <span className="font-medium">{formatDateTime(shiftReport.ended_at)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Duration:</span>
                                <span className="font-medium">{shiftReport.duration_formatted || 'N/A'}</span>
                            </div>
                        </div>

                        {/* Sales Summary */}
                        <div className="border-t border-dashed border-gray-300 py-3">
                            <h4 className="font-semibold mb-2">Sales Summary</h4>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Transactions:</span>
                                <span className="font-medium">{shiftReport.total_transactions}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Total Sales:</span>
                                <span className="font-medium">{formatCurrency(shiftReport.total_sales)}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Discounts:</span>
                                <span className="font-medium">-{formatCurrency(shiftReport.total_discounts)}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Refunds:</span>
                                <span className="font-medium">-{formatCurrency(shiftReport.total_refunds)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold pt-2 border-t border-gray-200">
                                <span>Net Sales:</span>
                                <span>{formatCurrency(parseFloat(shiftReport.total_sales) - parseFloat(shiftReport.total_refunds))}</span>
                            </div>
                        </div>

                        {/* Payment Breakdown */}
                        <div className="border-t border-dashed border-gray-300 py-3">
                            <h4 className="font-semibold mb-2">Payment Methods</h4>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Cash:</span>
                                <span className="font-medium">{formatCurrency(shiftReport.cash_sales)}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">M-Pesa:</span>
                                <span className="font-medium">{formatCurrency(shiftReport.mpesa_sales)}</span>
                            </div>
                            {parseFloat(shiftReport.total_sales) - parseFloat(shiftReport.cash_sales) - parseFloat(shiftReport.mpesa_sales) > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Split:</span>
                                    <span className="font-medium">
                                        {formatCurrency(parseFloat(shiftReport.total_sales) - parseFloat(shiftReport.cash_sales) - parseFloat(shiftReport.mpesa_sales))}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Cash Drawer */}
                        <div className="border-t border-dashed border-gray-300 py-3">
                            <h4 className="font-semibold mb-2">Cash Drawer</h4>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Opening Cash:</span>
                                <span className="font-medium">{formatCurrency(shiftReport.opening_cash)}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Cash Sales:</span>
                                <span className="font-medium">+{formatCurrency(shiftReport.cash_sales)}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Expected Cash:</span>
                                <span className="font-medium">{formatCurrency(shiftReport.expected_cash)}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Counted Cash:</span>
                                <span className="font-medium">{formatCurrency(shiftReport.closing_cash)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold pt-2 border-t border-gray-200">
                                <span>Difference:</span>
                                <span className={`${
                                    parseFloat(shiftReport.cash_difference) > 0
                                        ? 'text-green-600'
                                        : parseFloat(shiftReport.cash_difference) < 0
                                            ? 'text-red-600'
                                            : ''
                                }`}>
                                    {parseFloat(shiftReport.cash_difference) > 0 ? '+' : ''}
                                    {formatCurrency(shiftReport.cash_difference)}
                                    {parseFloat(shiftReport.cash_difference) > 0
                                        ? ' (Over)'
                                        : parseFloat(shiftReport.cash_difference) < 0
                                            ? ' (Short)'
                                            : ' (Balanced)'}
                                </span>
                            </div>
                        </div>

                        {/* Notes */}
                        {(shiftReport.notes || shiftReport.closing_notes) && (
                            <div className="border-t border-dashed border-gray-300 py-3">
                                <h4 className="font-semibold mb-2">Notes</h4>
                                {shiftReport.notes && (
                                    <p className="text-sm text-gray-600 mb-1">Opening: {shiftReport.notes}</p>
                                )}
                                {shiftReport.closing_notes && (
                                    <p className="text-sm text-gray-600">Closing: {shiftReport.closing_notes}</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="p-5 border-t border-pos-border flex gap-3">
                        <button
                            onClick={handlePrintReport}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-pos-border rounded-lg text-pos-text hover:bg-pos-hover transition-colors"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                                <rect x="6" y="14" width="12" height="8"></rect>
                            </svg>
                            Print
                        </button>
                        <button
                            onClick={handleExportPDF}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-pos-border rounded-lg text-pos-text hover:bg-pos-hover transition-colors"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            Download PDF
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 bg-pos-primary text-white rounded-lg hover:bg-pos-primary/90 transition-colors"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // Open shift form
    if (!isShiftOpen) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl w-full max-w-md">
                    <div className="p-5 border-b border-pos-border flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-pos-text">Open Shift</h2>
                        <button
                            onClick={onClose}
                            className="p-1 text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleOpenShift} className="p-5 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-pos-text mb-1.5">
                                Opening Cash Amount
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                    {currency}
                                </span>
                                <input
                                    type="number"
                                    value={openingCash}
                                    onChange={(e) => setOpeningCash(e.target.value)}
                                    className="w-full pl-12 pr-4 py-2.5 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    required
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Enter the starting cash in your drawer
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-pos-text mb-1.5">
                                Notes (Optional)
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full px-4 py-2.5 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary resize-none"
                                placeholder="Any notes for this shift..."
                                rows={2}
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-2.5 border border-pos-border rounded-lg text-pos-text hover:bg-pos-hover transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Opening...' : 'Open Shift'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )
    }

    // Close shift form
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-full max-w-md">
                <div className="p-5 border-b border-pos-border flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-pos-text">Close Shift</h2>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                {/* Current Shift Info */}
                <div className="px-5 py-4 bg-pos-bg border-b border-pos-border">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Shift ID:</span>
                        <span className="font-medium">{currentShift?.shift_id}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Started:</span>
                        <span className="font-medium">{formatDateTime(currentShift?.started_at)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Opening Cash:</span>
                        <span className="font-medium">{formatCurrency(currentShift?.opening_cash)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Transactions:</span>
                        <span className="font-medium">{currentShift?.transaction_count || 0}</span>
                    </div>
                </div>

                <form onSubmit={handleCloseShift} className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-pos-text mb-1.5">
                            Closing Cash Amount
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                {currency}
                            </span>
                            <input
                                type="number"
                                value={closingCash}
                                onChange={(e) => setClosingCash(e.target.value)}
                                className="w-full pl-12 pr-4 py-2.5 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                required
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Count and enter the actual cash in your drawer
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-pos-text mb-1.5">
                            Closing Notes (Optional)
                        </label>
                        <textarea
                            value={closingNotes}
                            onChange={(e) => setClosingNotes(e.target.value)}
                            className="w-full px-4 py-2.5 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary resize-none"
                            placeholder="Any notes about this shift..."
                            rows={2}
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 border border-pos-border rounded-lg text-pos-text hover:bg-pos-hover transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Closing...' : 'Close Shift'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default ShiftModal
