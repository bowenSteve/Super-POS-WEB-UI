import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useShift } from '../context/ShiftContext'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const inputClass = 'w-full border border-brand-ink/[0.16] rounded-xl px-4 py-2.5 outline-none focus:border-brand-ink transition-colors'
const labelClass = 'block text-sm font-semibold mb-1.5'

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

    useEffect(() => {
        if (!isOpen) {
            setOpeningCash('')
            setClosingCash('')
            setNotes('')
            setClosingNotes('')
            setShiftReport(null)
            setShowReport(false)
        } else if (isShiftOpen && currentShift) {
            const expectedCash = parseFloat(currentShift.opening_cash || 0) + parseFloat(currentShift.cash_sales || 0)
            setClosingCash(expectedCash.toFixed(2))
        }
    }, [isOpen, isShiftOpen, currentShift])

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
            if (result.success) toast.success('PDF downloaded')
            else toast.error(result.error)
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
                    body { font-family: 'Courier New', monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
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
                    @media print { body { padding: 0; } }
                </style>
            </head>
            <body>${printContent.innerHTML}</body>
            </html>
        `)
        printWindow.document.close()
        printWindow.print()
    }

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    }
    const formatCurrency = (amount) => `${currency} ${parseFloat(amount || 0).toFixed(2)}`

    if (!isOpen) return null

    if (showReport && shiftReport) {
        return createPortal(
            <div className="fixed inset-0 bg-[rgba(12,34,37,0.5)] backdrop-blur-sm flex items-start justify-center z-50 py-8 font-sans text-brand-ink">
                <div className="bg-white rounded-[22px] w-full max-w-lg max-h-[calc(100vh-4rem)] overflow-y-auto">
                    <div className="bg-brand-ink text-brand-surface px-5 py-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Shift closing report</h2>
                        <button onClick={onClose} className="w-8 h-8 rounded-lg bg-brand-surface/10 hover:bg-brand-surface/20 grid place-items-center cursor-pointer">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>

                    <div className="p-5" id="shift-report-content">
                        <div className="text-center mb-4">
                            <h3 className="font-bold text-lg">{currentShop?.name}</h3>
                            <p className="text-sm text-brand-ink/55">Shift report</p>
                            <p className="text-sm font-medium font-mono mt-2">{shiftReport.shift_id}</p>
                        </div>

                        <div className="border-t border-dashed border-brand-ink/20 py-3">
                            <div className="flex justify-between text-sm mb-1"><span className="text-brand-ink/60">Cashier:</span><span className="font-medium">{shiftReport.cashier_name}</span></div>
                            <div className="flex justify-between text-sm mb-1"><span className="text-brand-ink/60">Started:</span><span className="font-medium">{formatDateTime(shiftReport.started_at)}</span></div>
                            <div className="flex justify-between text-sm mb-1"><span className="text-brand-ink/60">Ended:</span><span className="font-medium">{formatDateTime(shiftReport.ended_at)}</span></div>
                            <div className="flex justify-between text-sm"><span className="text-brand-ink/60">Duration:</span><span className="font-medium">{shiftReport.duration_formatted || 'N/A'}</span></div>
                        </div>

                        <div className="border-t border-dashed border-brand-ink/20 py-3">
                            <h4 className="font-semibold mb-2">Sales summary</h4>
                            <div className="flex justify-between text-sm mb-1"><span className="text-brand-ink/60">Transactions:</span><span className="font-medium">{shiftReport.total_transactions}</span></div>
                            <div className="flex justify-between text-sm mb-1"><span className="text-brand-ink/60">Total sales:</span><span className="font-medium">{formatCurrency(shiftReport.total_sales)}</span></div>
                            <div className="flex justify-between text-sm mb-1"><span className="text-brand-ink/60">Discounts:</span><span className="font-medium">-{formatCurrency(shiftReport.total_discounts)}</span></div>
                            <div className="flex justify-between text-sm mb-1"><span className="text-brand-ink/60">Refunds:</span><span className="font-medium">-{formatCurrency(shiftReport.total_refunds)}</span></div>
                            <div className="flex justify-between text-sm font-bold pt-2 border-t border-brand-ink/10"><span>Net sales:</span><span>{formatCurrency(parseFloat(shiftReport.total_sales) - parseFloat(shiftReport.total_refunds))}</span></div>
                        </div>

                        <div className="border-t border-dashed border-brand-ink/20 py-3">
                            <h4 className="font-semibold mb-2">Payment methods</h4>
                            <div className="flex justify-between text-sm mb-1"><span className="text-brand-ink/60">Cash:</span><span className="font-medium">{formatCurrency(shiftReport.cash_sales)}</span></div>
                            <div className="flex justify-between text-sm mb-1"><span className="text-brand-ink/60">M-Pesa:</span><span className="font-medium">{formatCurrency(shiftReport.mpesa_sales)}</span></div>
                            {parseFloat(shiftReport.total_sales) - parseFloat(shiftReport.cash_sales) - parseFloat(shiftReport.mpesa_sales) > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-brand-ink/60">Split:</span>
                                    <span className="font-medium">{formatCurrency(parseFloat(shiftReport.total_sales) - parseFloat(shiftReport.cash_sales) - parseFloat(shiftReport.mpesa_sales))}</span>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-dashed border-brand-ink/20 py-3">
                            <h4 className="font-semibold mb-2">Cash drawer</h4>
                            <div className="flex justify-between text-sm mb-1"><span className="text-brand-ink/60">Opening cash:</span><span className="font-medium">{formatCurrency(shiftReport.opening_cash)}</span></div>
                            <div className="flex justify-between text-sm mb-1"><span className="text-brand-ink/60">Cash sales:</span><span className="font-medium">+{formatCurrency(shiftReport.cash_sales)}</span></div>
                            <div className="flex justify-between text-sm mb-1"><span className="text-brand-ink/60">Expected cash:</span><span className="font-medium">{formatCurrency(shiftReport.expected_cash)}</span></div>
                            <div className="flex justify-between text-sm mb-1"><span className="text-brand-ink/60">Counted cash:</span><span className="font-medium">{formatCurrency(shiftReport.closing_cash)}</span></div>
                            <div className="flex justify-between text-sm font-bold pt-2 border-t border-brand-ink/10">
                                <span>Difference:</span>
                                <span style={{ color: parseFloat(shiftReport.cash_difference) > 0 ? '#2f7a5f' : parseFloat(shiftReport.cash_difference) < 0 ? '#c8553d' : undefined }}>
                                    {parseFloat(shiftReport.cash_difference) > 0 ? '+' : ''}{formatCurrency(shiftReport.cash_difference)}
                                    {parseFloat(shiftReport.cash_difference) > 0 ? ' (Over)' : parseFloat(shiftReport.cash_difference) < 0 ? ' (Short)' : ' (Balanced)'}
                                </span>
                            </div>
                        </div>

                        {(shiftReport.notes || shiftReport.closing_notes) && (
                            <div className="border-t border-dashed border-brand-ink/20 py-3">
                                <h4 className="font-semibold mb-2">Notes</h4>
                                {shiftReport.notes && <p className="text-sm text-brand-ink/60 mb-1">Opening: {shiftReport.notes}</p>}
                                {shiftReport.closing_notes && <p className="text-sm text-brand-ink/60">Closing: {shiftReport.closing_notes}</p>}
                            </div>
                        )}
                    </div>

                    <div className="p-5 border-t border-brand-ink/10 flex gap-3">
                        <button onClick={handlePrintReport} className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-brand-ink/[0.16] rounded-xl hover:bg-brand-surface transition-colors cursor-pointer">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                            Print
                        </button>
                        <button onClick={handleExportPDF} className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-brand-ink/[0.16] rounded-xl hover:bg-brand-surface transition-colors cursor-pointer">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            Download PDF
                        </button>
                        <button onClick={onClose} className="flex-1 py-2.5 bg-brand-ink text-brand-surface rounded-xl hover:bg-brand-ink/90 transition-colors cursor-pointer">Done</button>
                    </div>
                </div>
            </div>,
            document.body
        )
    }

    if (!isShiftOpen) {
        return createPortal(
            <div className="fixed inset-0 bg-[rgba(12,34,37,0.5)] backdrop-blur-sm flex items-center justify-center z-50 font-sans text-brand-ink">
                <div className="bg-white rounded-[22px] w-full max-w-md">
                    <div className="px-5 py-4 border-b border-brand-ink/10 flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Open shift</h2>
                        <button onClick={onClose} className="p-1 text-brand-ink/40 hover:text-brand-ink cursor-pointer">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>

                    <form onSubmit={handleOpenShift} className="p-5 grid gap-4">
                        <div>
                            <label className={labelClass}>Opening cash amount</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-ink/50 font-mono">{currency}</span>
                                <input type="number" value={openingCash} onChange={(e) => setOpeningCash(e.target.value)} className={`${inputClass} pl-14 font-mono`} placeholder="0.00" step="0.01" min="0" required />
                            </div>
                            <p className="text-xs text-brand-ink/55 mt-1">Enter the starting cash in your drawer</p>
                        </div>
                        <div>
                            <label className={labelClass}>Notes (optional)</label>
                            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={`${inputClass} resize-none`} placeholder="Any notes for this shift…" rows={2} />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-brand-ink/[0.16] rounded-xl hover:bg-brand-surface transition-colors cursor-pointer">Cancel</button>
                            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-[#2f7a5f] text-white rounded-xl hover:bg-[#2f7a5f]/90 transition-colors disabled:opacity-50 cursor-pointer">{loading ? 'Opening…' : 'Open shift'}</button>
                        </div>
                    </form>
                </div>
            </div>,
            document.body
        )
    }

    return createPortal(
        <div className="fixed inset-0 bg-[rgba(12,34,37,0.5)] backdrop-blur-sm flex items-center justify-center z-50 font-sans text-brand-ink">
            <div className="bg-white rounded-[22px] w-full max-w-md">
                <div className="px-5 py-4 border-b border-brand-ink/10 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Close shift</h2>
                    <button onClick={onClose} className="p-1 text-brand-ink/40 hover:text-brand-ink cursor-pointer">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                <div className="px-5 py-4 bg-brand-surface border-b border-brand-ink/10">
                    <div className="flex justify-between text-sm mb-1"><span className="text-brand-ink/60">Shift ID:</span><span className="font-medium font-mono">{currentShift?.shift_id}</span></div>
                    <div className="flex justify-between text-sm mb-1"><span className="text-brand-ink/60">Started:</span><span className="font-medium">{formatDateTime(currentShift?.started_at)}</span></div>
                    <div className="flex justify-between text-sm mb-1"><span className="text-brand-ink/60">Opening cash:</span><span className="font-medium">{formatCurrency(currentShift?.opening_cash)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-brand-ink/60">Transactions:</span><span className="font-medium">{currentShift?.transaction_count || 0}</span></div>
                </div>

                <form onSubmit={handleCloseShift} className="p-5 grid gap-4">
                    <div>
                        <label className={labelClass}>Closing cash amount</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-ink/50 font-mono">{currency}</span>
                            <input type="number" value={closingCash} onChange={(e) => setClosingCash(e.target.value)} className={`${inputClass} pl-14 font-mono`} placeholder="0.00" step="0.01" min="0" required />
                        </div>
                        <p className="text-xs text-brand-ink/55 mt-1">Count and enter the actual cash in your drawer</p>
                    </div>
                    <div>
                        <label className={labelClass}>Closing notes (optional)</label>
                        <textarea value={closingNotes} onChange={(e) => setClosingNotes(e.target.value)} className={`${inputClass} resize-none`} placeholder="Any notes about this shift…" rows={2} />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-brand-ink/[0.16] rounded-xl hover:bg-brand-surface transition-colors cursor-pointer">Cancel</button>
                        <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-[#c8553d] text-white rounded-xl hover:bg-[#c8553d]/90 transition-colors disabled:opacity-50 cursor-pointer">{loading ? 'Closing…' : 'Close shift'}</button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    )
}

export default ShiftModal
