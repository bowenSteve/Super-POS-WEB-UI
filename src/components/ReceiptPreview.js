import { useRef } from 'react'

/**
 * Receipt Preview Component
 *
 * Shows a preview of the receipt before printing/completing the sale
 * Allows user to review the receipt and optionally print it
 */
function ReceiptPreview({
    show,
    onClose,
    onConfirm,
    cart,
    subtotal,
    taxAmount,
    discountAmount,
    total,
    paymentMethod,
    amountPaid,
    change,
    customer,
    cashier,
    shop,
    currency = 'KSh',
    taxSettings
}) {
    const receiptRef = useRef(null)

    if (!show) return null

    const handlePrint = () => {
        const printWindow = window.open('', '', 'width=300,height=600')
        printWindow.document.write(`
            <html>
                <head>
                    <title>Receipt</title>
                    <style>
                        body {
                            font-family: 'Courier New', monospace;
                            font-size: 12px;
                            margin: 10px;
                            max-width: 300px;
                        }
                        .receipt-header {
                            text-align: center;
                            border-bottom: 2px dashed #000;
                            padding-bottom: 10px;
                            margin-bottom: 10px;
                        }
                        .receipt-header h2 {
                            margin: 5px 0;
                            font-size: 18px;
                        }
                        .receipt-info {
                            font-size: 10px;
                            margin-bottom: 10px;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-bottom: 10px;
                        }
                        th {
                            text-align: left;
                            border-bottom: 1px solid #000;
                            padding: 5px 0;
                        }
                        td {
                            padding: 3px 0;
                        }
                        .text-right {
                            text-align: right;
                        }
                        .totals {
                            border-top: 2px solid #000;
                            padding-top: 10px;
                            margin-top: 10px;
                        }
                        .total-row {
                            display: flex;
                            justify-content: space-between;
                            margin: 5px 0;
                        }
                        .grand-total {
                            font-weight: bold;
                            font-size: 14px;
                            border-top: 2px dashed #000;
                            padding-top: 5px;
                            margin-top: 5px;
                        }
                        .footer {
                            text-align: center;
                            margin-top: 20px;
                            font-size: 10px;
                            border-top: 2px dashed #000;
                            padding-top: 10px;
                        }
                    </style>
                </head>
                <body>
                    ${receiptRef.current?.innerHTML}
                    <script>
                        window.onload = function() {
                            window.print();
                            window.close();
                        }
                    </script>
                </body>
            </html>
        `)
        printWindow.document.close()
    }

    const handleConfirmAndPrint = () => {
        handlePrint()
        onConfirm()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-pos-primary text-white">
                    <h2 className="text-lg font-semibold">Receipt Preview</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                {/* Receipt Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    <div ref={receiptRef} className="bg-white font-mono text-sm">
                        {/* Receipt Header */}
                        <div className="receipt-header text-center border-b-2 border-dashed border-gray-400 pb-3 mb-3">
                            <h2 className="text-xl font-bold mb-1">{shop?.name || 'Super POS'}</h2>
                            {shop?.address && <p className="text-xs">{shop.address}</p>}
                            {shop?.phone && <p className="text-xs">Tel: {shop.phone}</p>}
                            {taxSettings?.taxNumber && (
                                <p className="text-xs">Tax ID: {taxSettings.taxNumber}</p>
                            )}
                        </div>

                        {/* Receipt Info */}
                        <div className="receipt-info text-xs mb-3">
                            <div className="flex justify-between">
                                <span>Date:</span>
                                <span>{new Date().toLocaleString()}</span>
                            </div>
                            {cashier && (
                                <div className="flex justify-between">
                                    <span>Cashier:</span>
                                    <span>{cashier.username || cashier.name}</span>
                                </div>
                            )}
                            {customer && (
                                <div className="flex justify-between">
                                    <span>Customer:</span>
                                    <span>{customer.name}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span>Payment:</span>
                                <span className="uppercase">{paymentMethod}</span>
                            </div>
                        </div>

                        {/* Items Table */}
                        <table className="w-full border-t border-gray-300">
                            <thead>
                                <tr className="border-b border-gray-300">
                                    <th className="text-left py-1">Item</th>
                                    <th className="text-center py-1">Qty</th>
                                    <th className="text-right py-1">Price</th>
                                    <th className="text-right py-1">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cart.map((item, index) => (
                                    <tr key={index}>
                                        <td className="py-1">{item.product.name}</td>
                                        <td className="text-center">{item.quantity}</td>
                                        <td className="text-right">{item.unit_price.toFixed(2)}</td>
                                        <td className="text-right">{(item.quantity * item.unit_price).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Totals */}
                        <div className="totals border-t-2 border-gray-400 pt-2 mt-2">
                            <div className="total-row flex justify-between text-sm">
                                <span>Subtotal:</span>
                                <span>{currency} {subtotal.toFixed(2)}</span>
                            </div>
                            {discountAmount > 0 && (
                                <div className="total-row flex justify-between text-sm text-green-600">
                                    <span>Discount:</span>
                                    <span>-{currency} {discountAmount.toFixed(2)}</span>
                                </div>
                            )}
                            {taxSettings?.enabled && taxAmount > 0 && (
                                <div className="total-row flex justify-between text-sm">
                                    <span>{taxSettings.name} ({taxSettings.rate}%):</span>
                                    <span>{currency} {taxAmount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="grand-total flex justify-between text-base font-bold border-t-2 border-dashed border-gray-400 pt-2 mt-2">
                                <span>TOTAL:</span>
                                <span>{currency} {total.toFixed(2)}</span>
                            </div>
                            {paymentMethod === 'cash' && (
                                <>
                                    <div className="total-row flex justify-between text-sm mt-2">
                                        <span>Cash Paid:</span>
                                        <span>{currency} {parseFloat(amountPaid || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="total-row flex justify-between text-sm font-semibold">
                                        <span>Change:</span>
                                        <span>{currency} {change.toFixed(2)}</span>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="footer text-center mt-4 text-xs border-t-2 border-dashed border-gray-400 pt-3">
                            <p className="font-semibold">Thank you for your business!</p>
                            <p className="mt-1">Powered by Super POS</p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm()}
                        className="flex-1 px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                    >
                        Complete (No Print)
                    </button>
                    <button
                        onClick={handleConfirmAndPrint}
                        className="flex-1 px-4 py-2.5 bg-pos-primary text-white rounded-lg hover:bg-pos-text/90 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="6 9 6 2 18 2 18 9"></polyline>
                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                            <rect x="6" y="14" width="12" height="8"></rect>
                        </svg>
                        Print & Complete
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ReceiptPreview
