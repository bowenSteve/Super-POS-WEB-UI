import { useState, useEffect } from 'react'
import Sidebar from "../components/Sidebar"
import { salesAPI, productsAPI } from '../api/api'
import { FiDollarSign, FiShoppingCart, FiTrendingUp, FiUsers, FiCalendar, FiDownload, FiRefreshCw } from 'react-icons/fi'
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import toast from 'react-hot-toast'

function Reports() {
    const [activeView, setActiveView] = useState('analytics') // 'analytics' or 'shifts'
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [shifts, setShifts] = useState([])
    const [dateRange, setDateRange] = useState('week') // 'today', 'week', 'month', 'year', 'custom'
    const [customDateFrom, setCustomDateFrom] = useState('')
    const [customDateTo, setCustomDateTo] = useState('')

    // Computed analytics state
    const [analytics, setAnalytics] = useState({
        totalSales: 0,
        totalTransactions: 0,
        averageOrderValue: 0,
        totalItemsSold: 0,
        salesTrend: [],
        paymentBreakdown: [],
        topProducts: [],
        comparisonPercentage: 0
    })

    const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

    // Get date range for API calls
    const getDateParams = () => {
        const now = new Date()
        let dateFrom, dateTo

        dateTo = now.toISOString().split('T')[0]

        switch (dateRange) {
            case 'today':
                dateFrom = dateTo
                break
            case 'week':
                const weekAgo = new Date(now)
                weekAgo.setDate(weekAgo.getDate() - 7)
                dateFrom = weekAgo.toISOString().split('T')[0]
                break
            case 'month':
                const monthAgo = new Date(now)
                monthAgo.setMonth(monthAgo.getMonth() - 1)
                dateFrom = monthAgo.toISOString().split('T')[0]
                break
            case 'year':
                const yearAgo = new Date(now)
                yearAgo.setFullYear(yearAgo.getFullYear() - 1)
                dateFrom = yearAgo.toISOString().split('T')[0]
                break
            case 'custom':
                dateFrom = customDateFrom || dateTo
                dateTo = customDateTo || dateTo
                break
            default:
                const defaultWeekAgo = new Date(now)
                defaultWeekAgo.setDate(defaultWeekAgo.getDate() - 7)
                dateFrom = defaultWeekAgo.toISOString().split('T')[0]
        }

        return { dateFrom, dateTo }
    }

    // Fetch shifts data
    const fetchShifts = async () => {
        try {
            setLoading(true)
            const response = await salesAPI.getShifts({ page_size: 100, ordering: '-started_at' })
            const shiftsData = response.data.results || response.data || []
            setShifts(Array.isArray(shiftsData) ? shiftsData : [])
        } catch (error) {
            console.error('Error fetching shifts:', error)
            toast.error('Failed to load shifts')
        } finally {
            setLoading(false)
        }
    }

    // Fetch data
    const fetchData = async (showToast = false) => {
        try {
            if (showToast) setRefreshing(true)
            else setLoading(true)

            const { dateFrom, dateTo } = getDateParams()

            // Fetch all transactions within date range (with high page size to get all)
            const [transactionsRes, productsRes] = await Promise.all([
                salesAPI.getTransactions({
                    date_from: dateFrom,
                    date_to: dateTo,
                    page_size: 1000
                }),
                productsAPI.getAll({ page_size: 1000 })
            ])

            const txData = transactionsRes.data.results || transactionsRes.data || []
            const prodData = productsRes.data.results || productsRes.data || []

            // Compute analytics from transactions
            computeAnalytics(txData, prodData)

            if (showToast) toast.success('Data refreshed')
        } catch (error) {
            console.error('Error fetching report data:', error)
            toast.error('Failed to load report data')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    // Compute analytics from transaction data
    const computeAnalytics = (txData, prodData) => {
        // Filter only completed transactions
        const completedTx = txData.filter(tx => tx.status === 'completed')

        // Total sales
        const totalSales = completedTx.reduce((sum, tx) => sum + parseFloat(tx.total || 0), 0)

        // Total transactions
        const totalTransactions = completedTx.length

        // Average order value
        const averageOrderValue = totalTransactions > 0 ? totalSales / totalTransactions : 0

        // Total items sold
        const totalItemsSold = completedTx.reduce((sum, tx) => {
            const items = tx.items || []
            return sum + items.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0)
        }, 0)

        // Sales trend (group by date)
        const salesByDate = {}
        completedTx.forEach(tx => {
            const date = tx.created_at?.split('T')[0] || 'Unknown'
            if (!salesByDate[date]) {
                salesByDate[date] = { date, sales: 0, transactions: 0 }
            }
            salesByDate[date].sales += parseFloat(tx.total || 0)
            salesByDate[date].transactions += 1
        })

        const salesTrend = Object.values(salesByDate)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map(item => ({
                ...item,
                date: formatDate(item.date),
                sales: Math.round(item.sales * 100) / 100
            }))

        // Payment breakdown
        const paymentCounts = {}
        completedTx.forEach(tx => {
            const method = tx.payment_method || 'Unknown'
            const displayMethod = method.charAt(0).toUpperCase() + method.slice(1)
            if (!paymentCounts[displayMethod]) {
                paymentCounts[displayMethod] = { name: displayMethod, value: 0, amount: 0 }
            }
            paymentCounts[displayMethod].value += 1
            paymentCounts[displayMethod].amount += parseFloat(tx.total || 0)
        })

        const paymentBreakdown = Object.values(paymentCounts)

        // Top products
        const productSales = {}
        completedTx.forEach(tx => {
            const items = tx.items || []
            items.forEach(item => {
                const productId = item.product_id || item.product
                const productName = item.product_name || `Product #${productId}`
                if (!productSales[productId]) {
                    productSales[productId] = {
                        id: productId,
                        name: productName,
                        quantity: 0,
                        revenue: 0
                    }
                }
                productSales[productId].quantity += item.quantity || 0
                productSales[productId].revenue += parseFloat(item.subtotal || item.total || 0)
            })
        })

        const topProducts = Object.values(productSales)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10)

        // Compute comparison with previous period
        // For simplicity, we'll show growth based on available data
        let comparisonPercentage = 0
        if (salesTrend.length >= 2) {
            const midPoint = Math.floor(salesTrend.length / 2)
            const firstHalf = salesTrend.slice(0, midPoint).reduce((sum, d) => sum + d.sales, 0)
            const secondHalf = salesTrend.slice(midPoint).reduce((sum, d) => sum + d.sales, 0)
            if (firstHalf > 0) {
                comparisonPercentage = ((secondHalf - firstHalf) / firstHalf) * 100
            }
        }

        setAnalytics({
            totalSales,
            totalTransactions,
            averageOrderValue,
            totalItemsSold,
            salesTrend,
            paymentBreakdown,
            topProducts,
            comparisonPercentage
        })
    }

    const formatDate = (dateStr) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount)
    }

    const formatNumber = (num) => {
        return new Intl.NumberFormat('en-US').format(num)
    }

    // Download shift PDF
    const handleDownloadShiftPDF = async (shiftId) => {
        try {
            const response = await salesAPI.exportShiftPDF(shiftId)
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `shift_report_${shiftId}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            toast.success('PDF downloaded')
        } catch (error) {
            console.error('Error downloading shift PDF:', error)
            toast.error('Failed to download PDF')
        }
    }

    // Export report as PDF
    const handleExportPDF = async () => {
        try {
            const { dateFrom, dateTo } = getDateParams()
            const response = await salesAPI.exportPDF(dateFrom, dateTo)

            const blob = new Blob([response.data], { type: 'application/pdf' })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `sales-report-${dateFrom}-to-${dateTo}.pdf`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

            toast.success('Report exported successfully')
        } catch (error) {
            console.error('Error exporting PDF:', error)
            toast.error('Failed to export report')
        }
    }

    useEffect(() => {
        if (activeView === 'analytics') {
            fetchData()
        } else if (activeView === 'shifts') {
            fetchShifts()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRange, customDateFrom, customDateTo, activeView])

    // Custom tooltip for charts
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-pos-bg-secondary border border-pos-border rounded-lg p-3 shadow-lg">
                    <p className="text-pos-text-primary font-medium">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-pos-text-secondary text-sm">
                            {entry.name}: {entry.name === 'sales' ? formatCurrency(entry.value) : entry.value}
                        </p>
                    ))}
                </div>
            )
        }
        return null
    }

    if (loading) {
        return (
            <div className="flex min-h-screen bg-pos-bg">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pos-primary"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen bg-pos-bg">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-auto">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-pos-text-primary">Reports & Analytics</h1>
                            <p className="text-pos-text-secondary text-sm mt-1">
                                Track your sales performance and business insights
                            </p>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                            {/* Date Range Selector */}
                            <div className="flex items-center gap-2 bg-pos-bg-secondary border border-pos-border rounded-lg p-1">
                                {['today', 'week', 'month', 'year'].map((range) => (
                                    <button
                                        key={range}
                                        onClick={() => setDateRange(range)}
                                        className={`px-3 py-1.5 text-sm rounded-md transition-colors capitalize ${
                                            dateRange === range
                                                ? 'bg-pos-primary text-white'
                                                : 'text-pos-text-secondary hover:bg-pos-bg-tertiary'
                                        }`}
                                    >
                                        {range === 'week' ? '7 Days' : range === 'month' ? '30 Days' : range === 'year' ? '1 Year' : 'Today'}
                                    </button>
                                ))}
                            </div>

                            {/* Custom Date Range */}
                            <div className="flex items-center gap-2">
                                <FiCalendar className="text-pos-text-secondary" />
                                <input
                                    type="date"
                                    value={customDateFrom}
                                    onChange={(e) => {
                                        setCustomDateFrom(e.target.value)
                                        setDateRange('custom')
                                    }}
                                    className="px-3 py-1.5 text-sm border border-pos-border rounded-lg bg-pos-bg-secondary text-pos-text-primary"
                                />
                                <span className="text-pos-text-secondary">to</span>
                                <input
                                    type="date"
                                    value={customDateTo}
                                    onChange={(e) => {
                                        setCustomDateTo(e.target.value)
                                        setDateRange('custom')
                                    }}
                                    className="px-3 py-1.5 text-sm border border-pos-border rounded-lg bg-pos-bg-secondary text-pos-text-primary"
                                />
                            </div>

                            {/* Actions */}
                            <button
                                onClick={() => fetchData(true)}
                                disabled={refreshing}
                                className="p-2 rounded-lg border border-pos-border hover:bg-pos-bg-secondary transition-colors"
                                title="Refresh data"
                            >
                                <FiRefreshCw className={`text-pos-text-secondary ${refreshing ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                                onClick={handleExportPDF}
                                className="flex items-center gap-2 px-4 py-2 bg-pos-primary text-white rounded-lg hover:bg-pos-primary-dark transition-colors"
                            >
                                <FiDownload size={16} />
                                Export PDF
                            </button>
                        </div>
                    </div>

                    {/* Tabs Navigation */}
                    <div className="mb-6 border-b border-pos-border">
                        <nav className="flex gap-1">
                            <button
                                onClick={() => setActiveView('analytics')}
                                className={`px-4 py-3 border-b-2 font-medium transition-colors ${
                                    activeView === 'analytics'
                                        ? 'border-pos-text text-pos-text'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Analytics
                            </button>
                            <button
                                onClick={() => setActiveView('shifts')}
                                className={`px-4 py-3 border-b-2 font-medium transition-colors ${
                                    activeView === 'shifts'
                                        ? 'border-pos-text text-pos-text'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Shift History
                            </button>
                        </nav>
                    </div>

                    {/* Analytics View */}
                    {activeView === 'analytics' && (
                    <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-pos-bg-secondary border border-pos-border rounded-xl p-5">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-pos-text-secondary text-sm">Total Sales</span>
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <FiDollarSign className="text-green-600" size={20} />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-pos-text-primary">
                                {formatCurrency(analytics.totalSales)}
                            </p>
                            {analytics.comparisonPercentage !== 0 && (
                                <p className={`text-sm mt-1 ${analytics.comparisonPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {analytics.comparisonPercentage >= 0 ? '↑' : '↓'} {Math.abs(analytics.comparisonPercentage).toFixed(1)}% vs previous period
                                </p>
                            )}
                        </div>

                        <div className="bg-pos-bg-secondary border border-pos-border rounded-xl p-5">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-pos-text-secondary text-sm">Transactions</span>
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <FiShoppingCart className="text-blue-600" size={20} />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-pos-text-primary">
                                {formatNumber(analytics.totalTransactions)}
                            </p>
                            <p className="text-sm text-pos-text-secondary mt-1">
                                Completed orders
                            </p>
                        </div>

                        <div className="bg-pos-bg-secondary border border-pos-border rounded-xl p-5">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-pos-text-secondary text-sm">Avg Order Value</span>
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <FiTrendingUp className="text-purple-600" size={20} />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-pos-text-primary">
                                {formatCurrency(analytics.averageOrderValue)}
                            </p>
                            <p className="text-sm text-pos-text-secondary mt-1">
                                Per transaction
                            </p>
                        </div>

                        <div className="bg-pos-bg-secondary border border-pos-border rounded-xl p-5">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-pos-text-secondary text-sm">Items Sold</span>
                                <div className="p-2 bg-orange-100 rounded-lg">
                                    <FiUsers className="text-orange-600" size={20} />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-pos-text-primary">
                                {formatNumber(analytics.totalItemsSold)}
                            </p>
                            <p className="text-sm text-pos-text-secondary mt-1">
                                Total units
                            </p>
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        {/* Sales Trend Chart */}
                        <div className="lg:col-span-2 bg-pos-bg-secondary border border-pos-border rounded-xl p-5">
                            <h2 className="text-lg font-semibold text-pos-text-primary mb-4">Sales Trend</h2>
                            {analytics.salesTrend.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={analytics.salesTrend}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                            axisLine={{ stroke: '#374151' }}
                                        />
                                        <YAxis
                                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                            axisLine={{ stroke: '#374151' }}
                                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Bar
                                            dataKey="sales"
                                            fill="#6366f1"
                                            radius={[4, 4, 0, 0]}
                                            name="Sales (KES)"
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-[300px] flex items-center justify-center text-pos-text-secondary">
                                    No sales data for this period
                                </div>
                            )}
                        </div>

                        {/* Payment Methods Pie Chart */}
                        <div className="bg-pos-bg-secondary border border-pos-border rounded-xl p-5">
                            <h2 className="text-lg font-semibold text-pos-text-primary mb-4">Payment Methods</h2>
                            {analytics.paymentBreakdown.length > 0 ? (
                                <>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={analytics.paymentBreakdown}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {analytics.paymentBreakdown.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value, name, props) => [
                                                    `${value} transactions (${formatCurrency(props.payload.amount)})`,
                                                    props.payload.name
                                                ]}
                                            />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>

                                    {/* Payment Breakdown Summary */}
                                    <div className="mt-4 space-y-2">
                                        {analytics.paymentBreakdown.map((payment, index) => (
                                            <div key={payment.name} className="flex items-center justify-between p-3 bg-pos-bg-tertiary rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                                    />
                                                    <div>
                                                        <p className="font-medium text-pos-text-primary">{payment.name}</p>
                                                        <p className="text-sm text-pos-text-secondary">{payment.value} transactions</p>
                                                    </div>
                                                </div>
                                                <p className="font-bold text-pos-text-primary">{formatCurrency(payment.amount)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="h-[300px] flex items-center justify-center text-pos-text-secondary">
                                    No payment data for this period
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Top Products and Transaction Trend */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top Products */}
                        <div className="bg-pos-bg-secondary border border-pos-border rounded-xl p-5">
                            <h2 className="text-lg font-semibold text-pos-text-primary mb-4">Top Selling Products</h2>
                            {analytics.topProducts.length > 0 ? (
                                <div className="space-y-3">
                                    {analytics.topProducts.slice(0, 8).map((product, index) => (
                                        <div
                                            key={product.id}
                                            className="flex items-center justify-between py-2 border-b border-pos-border last:border-0"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                                    index === 0 ? 'bg-yellow-500' :
                                                    index === 1 ? 'bg-gray-400' :
                                                    index === 2 ? 'bg-amber-600' : 'bg-pos-bg-tertiary text-pos-text-secondary'
                                                }`}>
                                                    {index + 1}
                                                </span>
                                                <div>
                                                    <p className="text-pos-text-primary font-medium text-sm">
                                                        {product.name}
                                                    </p>
                                                    <p className="text-pos-text-secondary text-xs">
                                                        {product.quantity} units sold
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-pos-text-primary font-semibold">
                                                {formatCurrency(product.revenue)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-[200px] flex items-center justify-center text-pos-text-secondary">
                                    No product data for this period
                                </div>
                            )}
                        </div>

                        {/* Transaction Count Trend */}
                        <div className="bg-pos-bg-secondary border border-pos-border rounded-xl p-5">
                            <h2 className="text-lg font-semibold text-pos-text-primary mb-4">Transaction Activity</h2>
                            {analytics.salesTrend.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={analytics.salesTrend}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                            axisLine={{ stroke: '#374151' }}
                                        />
                                        <YAxis
                                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                            axisLine={{ stroke: '#374151' }}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="transactions"
                                            stroke="#22c55e"
                                            strokeWidth={2}
                                            dot={{ fill: '#22c55e', strokeWidth: 2 }}
                                            name="Transactions"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-[300px] flex items-center justify-center text-pos-text-secondary">
                                    No transaction data for this period
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Stats Footer */}
                    <div className="mt-6 bg-pos-bg-secondary border border-pos-border rounded-xl p-5">
                        <h2 className="text-lg font-semibold text-pos-text-primary mb-4">Quick Insights</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-3 bg-pos-bg-tertiary rounded-lg">
                                <p className="text-pos-text-secondary text-sm">Best Day</p>
                                <p className="text-pos-text-primary font-semibold">
                                    {analytics.salesTrend.length > 0
                                        ? analytics.salesTrend.reduce((max, d) => d.sales > max.sales ? d : max, analytics.salesTrend[0]).date
                                        : '-'
                                    }
                                </p>
                            </div>
                            <div className="text-center p-3 bg-pos-bg-tertiary rounded-lg">
                                <p className="text-pos-text-secondary text-sm">Peak Sales</p>
                                <p className="text-pos-text-primary font-semibold">
                                    {analytics.salesTrend.length > 0
                                        ? formatCurrency(Math.max(...analytics.salesTrend.map(d => d.sales)))
                                        : '-'
                                    }
                                </p>
                            </div>
                            <div className="text-center p-3 bg-pos-bg-tertiary rounded-lg">
                                <p className="text-pos-text-secondary text-sm">Most Used Payment</p>
                                <p className="text-pos-text-primary font-semibold">
                                    {analytics.paymentBreakdown.length > 0
                                        ? analytics.paymentBreakdown.reduce((max, p) => p.value > max.value ? p : max, analytics.paymentBreakdown[0]).name
                                        : '-'
                                    }
                                </p>
                            </div>
                            <div className="text-center p-3 bg-pos-bg-tertiary rounded-lg">
                                <p className="text-pos-text-secondary text-sm">Top Product</p>
                                <p className="text-pos-text-primary font-semibold truncate">
                                    {analytics.topProducts.length > 0
                                        ? analytics.topProducts[0].name
                                        : '-'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                    </>
                    )}

                    {/* Shifts View */}
                    {activeView === 'shifts' && (
                        <div className="bg-white rounded-xl border border-pos-border overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-pos-border">
                                        <tr>
                                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Shift ID</th>
                                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Cashier</th>
                                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Started</th>
                                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Ended</th>
                                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Duration</th>
                                            <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Total Sales</th>
                                            <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Transactions</th>
                                            <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                                            <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-pos-border">
                                        {shifts.length > 0 ? (
                                            shifts.map((shift) => (
                                                <tr key={shift.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-sm font-medium text-pos-text">{shift.shift_id}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">{shift.cashier_name}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">
                                                        {new Date(shift.started_at).toLocaleString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">
                                                        {shift.ended_at
                                                            ? new Date(shift.ended_at).toLocaleString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })
                                                            : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">
                                                        {shift.duration_formatted || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right font-medium text-pos-text">
                                                        {formatCurrency(shift.total_sales)}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                                                        {shift.total_transactions}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                                            shift.status === 'closed'
                                                                ? 'bg-gray-100 text-gray-800'
                                                                : 'bg-green-100 text-green-800'
                                                        }`}>
                                                            {shift.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button
                                                            onClick={() => handleDownloadShiftPDF(shift.id)}
                                                            className="inline-flex items-center gap-1 px-3 py-1 text-sm border border-pos-border rounded-lg hover:bg-gray-50 transition-colors"
                                                            title="Download PDF"
                                                        >
                                                            <FiDownload size={14} />
                                                            PDF
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="9" className="px-4 py-12 text-center text-gray-500">
                                                    No shifts found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Reports
