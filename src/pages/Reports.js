import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import Sidebar from "../components/Sidebar"
import { salesAPI, productsAPI } from '../api/api'
import { FiDollarSign, FiShoppingCart, FiTrendingUp, FiUsers, FiCalendar, FiDownload, FiRefreshCw } from 'react-icons/fi'
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import toast from 'react-hot-toast'

function Reports() {
    const { user } = useAuth()
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

    const COLORS = ['#14373b', '#ed8674', '#2f7a5f', '#c8553d', '#7a9e95', '#d98b2b']

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
                <div className="bg-white border border-brand-ink/[0.12] rounded-xl p-3 shadow-lg">
                    <p className="text-brand-ink font-semibold text-sm">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-brand-ink/60 text-sm">
                            {entry.name}: {entry.name === 'sales' ? formatCurrency(entry.value) : entry.value}
                        </p>
                    ))}
                </div>
            )
        }
        return null
    }

    const initials = (user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase() + (user?.last_name?.[0] || '').toUpperCase()

    if (loading) {
        return (
            <div className="flex min-h-screen bg-brand-surface font-sans text-brand-ink">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-brand-ink/20 border-t-brand-ink"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen bg-brand-surface font-sans text-brand-ink">
            <Sidebar />
            <div className="flex-1 min-w-0">
                <header className="sticky top-0 z-20 bg-brand-surface/[0.9] backdrop-blur-md border-b border-brand-ink/[0.09]">
                    <div className="flex items-center gap-3 px-8 py-4 flex-wrap">
                        <h1 className="text-[22px] font-semibold tracking-[-0.03em]">Reports</h1>
                        <div className="flex-1" />

                        {/* Date Range Selector */}
                        <div className="flex items-center gap-1 bg-white border border-brand-ink/[0.12] rounded-xl p-1">
                            {['today', 'week', 'month', 'year'].map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setDateRange(range)}
                                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors font-semibold cursor-pointer ${
                                        dateRange === range
                                            ? 'bg-brand-ink text-brand-surface'
                                            : 'text-brand-ink/55 hover:bg-brand-surface'
                                    }`}
                                >
                                    {range === 'week' ? '7 days' : range === 'month' ? '30 days' : range === 'year' ? '1 year' : 'Today'}
                                </button>
                            ))}
                        </div>

                        {/* Custom Date Range */}
                        <div className="flex items-center gap-2">
                            <FiCalendar className="text-brand-ink/50 w-4 h-4" />
                            <input
                                type="date"
                                value={customDateFrom}
                                onChange={(e) => {
                                    setCustomDateFrom(e.target.value)
                                    setDateRange('custom')
                                }}
                                className="px-3 py-1.5 text-sm border border-brand-ink/[0.16] rounded-xl bg-white outline-none focus:border-brand-ink transition-colors"
                            />
                            <span className="text-brand-ink/40 text-sm">to</span>
                            <input
                                type="date"
                                value={customDateTo}
                                onChange={(e) => {
                                    setCustomDateTo(e.target.value)
                                    setDateRange('custom')
                                }}
                                className="px-3 py-1.5 text-sm border border-brand-ink/[0.16] rounded-xl bg-white outline-none focus:border-brand-ink transition-colors"
                            />
                        </div>

                        <button
                            onClick={() => fetchData(true)}
                            disabled={refreshing}
                            className="p-2.5 rounded-xl border border-brand-ink/[0.16] hover:bg-white transition-colors cursor-pointer"
                            title="Refresh data"
                        >
                            <FiRefreshCw className={`text-brand-ink/60 w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={handleExportPDF}
                            className="flex items-center gap-2 px-4 py-2.5 bg-brand-ink text-brand-surface rounded-xl hover:bg-brand-ink/90 transition-colors font-semibold cursor-pointer"
                        >
                            <FiDownload size={16} />
                            Export PDF
                        </button>
                        <span className="w-[38px] h-[38px] rounded-full bg-brand-ink text-brand-surface grid place-items-center text-[13px] font-semibold">{initials}</span>
                    </div>
                </header>

                <main className="px-8 py-6">
                    {/* Tabs Navigation */}
                    <div className="mb-6 flex items-center gap-1 bg-white border border-brand-ink/[0.09] rounded-xl p-1 w-fit">
                        <button
                            onClick={() => setActiveView('analytics')}
                            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors cursor-pointer ${
                                activeView === 'analytics'
                                    ? 'bg-brand-ink text-brand-surface'
                                    : 'text-brand-ink/55 hover:bg-brand-surface'
                            }`}
                        >
                            Analytics
                        </button>
                        <button
                            onClick={() => setActiveView('shifts')}
                            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors cursor-pointer ${
                                activeView === 'shifts'
                                    ? 'bg-brand-ink text-brand-surface'
                                    : 'text-brand-ink/55 hover:bg-brand-surface'
                            }`}
                        >
                            Shift history
                        </button>
                    </div>

                    {/* Analytics View */}
                    {activeView === 'analytics' && (
                    <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                        <div className="bg-white border border-brand-ink/[0.09] rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-brand-ink/55 text-sm">Total sales</span>
                                <div className="p-2 rounded-lg" style={{ background: 'rgba(47,122,95,0.12)' }}>
                                    <FiDollarSign style={{ color: '#2f7a5f' }} size={18} />
                                </div>
                            </div>
                            <p className="text-2xl font-semibold tracking-[-0.03em]">
                                {formatCurrency(analytics.totalSales)}
                            </p>
                            {analytics.comparisonPercentage !== 0 && (
                                <p className="text-sm mt-1 font-medium" style={{ color: analytics.comparisonPercentage >= 0 ? '#2f7a5f' : '#c8553d' }}>
                                    {analytics.comparisonPercentage >= 0 ? '↑' : '↓'} {Math.abs(analytics.comparisonPercentage).toFixed(1)}% vs previous period
                                </p>
                            )}
                        </div>

                        <div className="bg-white border border-brand-ink/[0.09] rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-brand-ink/55 text-sm">Transactions</span>
                                <div className="p-2 rounded-lg bg-brand-surface">
                                    <FiShoppingCart className="text-brand-ink/70" size={18} />
                                </div>
                            </div>
                            <p className="text-2xl font-semibold tracking-[-0.03em]">
                                {formatNumber(analytics.totalTransactions)}
                            </p>
                            <p className="text-sm text-brand-ink/50 mt-1">
                                Completed orders
                            </p>
                        </div>

                        <div className="bg-white border border-brand-ink/[0.09] rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-brand-ink/55 text-sm">Avg order value</span>
                                <div className="p-2 rounded-lg" style={{ background: 'rgba(237,134,116,0.16)' }}>
                                    <FiTrendingUp style={{ color: '#ed8674' }} size={18} />
                                </div>
                            </div>
                            <p className="text-2xl font-semibold tracking-[-0.03em]">
                                {formatCurrency(analytics.averageOrderValue)}
                            </p>
                            <p className="text-sm text-brand-ink/50 mt-1">
                                Per transaction
                            </p>
                        </div>

                        <div className="bg-white border border-brand-ink/[0.09] rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-brand-ink/55 text-sm">Items sold</span>
                                <div className="p-2 rounded-lg" style={{ background: 'rgba(217,139,43,0.14)' }}>
                                    <FiUsers style={{ color: '#d98b2b' }} size={18} />
                                </div>
                            </div>
                            <p className="text-2xl font-semibold tracking-[-0.03em]">
                                {formatNumber(analytics.totalItemsSold)}
                            </p>
                            <p className="text-sm text-brand-ink/50 mt-1">
                                Total units
                            </p>
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
                        {/* Sales Trend Chart */}
                        <div className="lg:col-span-2 bg-white border border-brand-ink/[0.09] rounded-2xl p-5">
                            <h2 className="text-base font-semibold mb-4">Sales trend</h2>
                            {analytics.salesTrend.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={analytics.salesTrend}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,55,59,0.08)" />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fill: 'rgba(20,55,59,0.5)', fontSize: 12 }}
                                            axisLine={{ stroke: 'rgba(20,55,59,0.12)' }}
                                        />
                                        <YAxis
                                            tick={{ fill: 'rgba(20,55,59,0.5)', fontSize: 12 }}
                                            axisLine={{ stroke: 'rgba(20,55,59,0.12)' }}
                                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Bar
                                            dataKey="sales"
                                            fill="#14373b"
                                            radius={[4, 4, 0, 0]}
                                            name="Sales (KES)"
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-[300px] flex items-center justify-center text-brand-ink/50">
                                    No sales data for this period
                                </div>
                            )}
                        </div>

                        {/* Payment Methods Pie Chart */}
                        <div className="bg-white border border-brand-ink/[0.09] rounded-2xl p-5">
                            <h2 className="text-base font-semibold mb-4">Payment methods</h2>
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
                                    <div className="mt-4 grid gap-2">
                                        {analytics.paymentBreakdown.map((payment, index) => (
                                            <div key={payment.name} className="flex items-center justify-between p-3 bg-brand-surface rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-3 h-3 rounded-full flex-none"
                                                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                                    />
                                                    <div>
                                                        <p className="font-semibold text-sm">{payment.name}</p>
                                                        <p className="text-sm text-brand-ink/50">{payment.value} transactions</p>
                                                    </div>
                                                </div>
                                                <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="h-[300px] flex items-center justify-center text-brand-ink/50">
                                    No payment data for this period
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Top Products and Transaction Trend */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {/* Top Products */}
                        <div className="bg-white border border-brand-ink/[0.09] rounded-2xl p-5">
                            <h2 className="text-base font-semibold mb-4">Top selling products</h2>
                            {analytics.topProducts.length > 0 ? (
                                <div className="grid gap-1">
                                    {analytics.topProducts.slice(0, 8).map((product, index) => (
                                        <div
                                            key={product.id}
                                            className="flex items-center justify-between py-2.5 border-b border-brand-ink/[0.06] last:border-0"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-none"
                                                    style={
                                                        index === 0 ? { background: '#d98b2b', color: '#fff' } :
                                                        index === 1 ? { background: 'rgba(20,55,59,0.25)', color: '#fff' } :
                                                        index === 2 ? { background: '#ed8674', color: '#fff' } :
                                                        { background: 'rgba(20,55,59,0.06)', color: 'rgba(20,55,59,0.55)' }
                                                    }
                                                >
                                                    {index + 1}
                                                </span>
                                                <div>
                                                    <p className="font-medium text-sm">
                                                        {product.name}
                                                    </p>
                                                    <p className="text-brand-ink/50 text-xs">
                                                        {product.quantity} units sold
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="font-semibold">
                                                {formatCurrency(product.revenue)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-[200px] flex items-center justify-center text-brand-ink/50">
                                    No product data for this period
                                </div>
                            )}
                        </div>

                        {/* Transaction Count Trend */}
                        <div className="bg-white border border-brand-ink/[0.09] rounded-2xl p-5">
                            <h2 className="text-base font-semibold mb-4">Transaction activity</h2>
                            {analytics.salesTrend.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={analytics.salesTrend}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,55,59,0.08)" />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fill: 'rgba(20,55,59,0.5)', fontSize: 12 }}
                                            axisLine={{ stroke: 'rgba(20,55,59,0.12)' }}
                                        />
                                        <YAxis
                                            tick={{ fill: 'rgba(20,55,59,0.5)', fontSize: 12 }}
                                            axisLine={{ stroke: 'rgba(20,55,59,0.12)' }}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="transactions"
                                            stroke="#2f7a5f"
                                            strokeWidth={2}
                                            dot={{ fill: '#2f7a5f', strokeWidth: 2 }}
                                            name="Transactions"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-[300px] flex items-center justify-center text-brand-ink/50">
                                    No transaction data for this period
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Stats Footer */}
                    <div className="mt-5 bg-white border border-brand-ink/[0.09] rounded-2xl p-5">
                        <h2 className="text-base font-semibold mb-4">Quick insights</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-3 bg-brand-surface rounded-xl">
                                <p className="text-brand-ink/55 text-sm">Best day</p>
                                <p className="font-semibold">
                                    {analytics.salesTrend.length > 0
                                        ? analytics.salesTrend.reduce((max, d) => d.sales > max.sales ? d : max, analytics.salesTrend[0]).date
                                        : '-'
                                    }
                                </p>
                            </div>
                            <div className="text-center p-3 bg-brand-surface rounded-xl">
                                <p className="text-brand-ink/55 text-sm">Peak sales</p>
                                <p className="font-semibold">
                                    {analytics.salesTrend.length > 0
                                        ? formatCurrency(Math.max(...analytics.salesTrend.map(d => d.sales)))
                                        : '-'
                                    }
                                </p>
                            </div>
                            <div className="text-center p-3 bg-brand-surface rounded-xl">
                                <p className="text-brand-ink/55 text-sm">Most used payment</p>
                                <p className="font-semibold">
                                    {analytics.paymentBreakdown.length > 0
                                        ? analytics.paymentBreakdown.reduce((max, p) => p.value > max.value ? p : max, analytics.paymentBreakdown[0]).name
                                        : '-'
                                    }
                                </p>
                            </div>
                            <div className="text-center p-3 bg-brand-surface rounded-xl">
                                <p className="text-brand-ink/55 text-sm">Top product</p>
                                <p className="font-semibold truncate">
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
                        <div className="bg-white border border-brand-ink/[0.09] rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-[13.5px]">
                                    <thead className="bg-[#fafcfb] border-b border-brand-ink/[0.08]">
                                        <tr>
                                            <th className="text-left px-[18px] py-3 text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50">Shift ID</th>
                                            <th className="text-left px-3 py-3 text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50">Cashier</th>
                                            <th className="text-left px-3 py-3 text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50">Started</th>
                                            <th className="text-left px-3 py-3 text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50">Ended</th>
                                            <th className="text-left px-3 py-3 text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50">Duration</th>
                                            <th className="text-right px-3 py-3 text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50">Total sales</th>
                                            <th className="text-right px-3 py-3 text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50">Transactions</th>
                                            <th className="text-center px-3 py-3 text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50">Status</th>
                                            <th className="text-center px-[18px] py-3 text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-brand-ink/[0.06]">
                                        {shifts.length > 0 ? (
                                            shifts.map((shift) => (
                                                <tr key={shift.id} className="hover:bg-brand-surface/60 transition-colors">
                                                    <td className="px-[18px] py-3 font-semibold">{shift.shift_id}</td>
                                                    <td className="px-3 py-3 text-brand-ink/65">{shift.cashier_name}</td>
                                                    <td className="px-3 py-3 text-brand-ink/65">
                                                        {new Date(shift.started_at).toLocaleString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </td>
                                                    <td className="px-3 py-3 text-brand-ink/65">
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
                                                    <td className="px-3 py-3 text-brand-ink/65">
                                                        {shift.duration_formatted || '-'}
                                                    </td>
                                                    <td className="px-3 py-3 text-right font-mono font-medium">
                                                        {formatCurrency(shift.total_sales)}
                                                    </td>
                                                    <td className="px-3 py-3 text-right text-brand-ink/65">
                                                        {shift.total_transactions}
                                                    </td>
                                                    <td className="px-3 py-3 text-center">
                                                        <span
                                                            className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full"
                                                            style={shift.status === 'closed' ? { background: 'rgba(20,55,59,0.08)', color: 'rgba(20,55,59,0.6)' } : { background: 'rgba(47,122,95,0.12)', color: '#2f7a5f' }}
                                                        >
                                                            {shift.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-[18px] py-3 text-center">
                                                        <button
                                                            onClick={() => handleDownloadShiftPDF(shift.id)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-brand-ink/[0.16] rounded-lg hover:bg-brand-surface transition-colors font-semibold cursor-pointer"
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
                                                <td colSpan="9" className="px-4 py-12 text-center text-brand-ink/55">
                                                    No shifts found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}

export default Reports
