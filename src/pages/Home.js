import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import Sidebar from "../components/Sidebar"
import ProfileDropdown from "../components/ProfileDropdown"
import { useAuth } from "../context/AuthContext"
import { salesAPI, productsAPI } from "../api/api"
import DashboardShimmer from "../features/shimmers/DashboardShimmer"

function Home() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [transactions, setTransactions] = useState([])
    const [products, setProducts] = useState([])
    const [lowStockCount, setLowStockCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [selectedDate, setSelectedDate] = useState(new Date())
    const dateInputRef = useRef(null)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        setLoading(true)
        setError("")

        try {
            const transactionsResponse = await salesAPI.getTransactions()
            const transactionsData = transactionsResponse.data.results || transactionsResponse.data
            setTransactions(Array.isArray(transactionsData) ? transactionsData : [])

            const productsResponse = await productsAPI.getAll()
            const productsData = productsResponse.data.results || productsResponse.data
            const productsList = Array.isArray(productsData) ? productsData : []
            setProducts(productsList)
            const lowStock = productsList.filter(p => p.is_low_stock).length
            setLowStockCount(lowStock)
        } catch (err) {
            setError("Failed to fetch dashboard data")
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const getMaxDate = () => {
        const d = new Date()
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }

    const getDisplayDate = (dateObj) => {
        return dateObj.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    }

    const targetDateString = selectedDate.toISOString().split('T')[0]

    const todayTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.created_at).toISOString().split('T')[0]
        return transactionDate === targetDateString
    })

    const todaySales = todayTransactions.reduce((sum, t) => sum + parseFloat(t.total || 0), 0)
    const totalRevenue = transactions.reduce((sum, t) => sum + parseFloat(t.total || 0), 0)

    // Payment methods breakdown
    const cashTransactions = todayTransactions.filter(t => t.payment_method === 'cash')
    const mpesaTransactions = todayTransactions.filter(t => t.payment_method === 'mpesa')
    const cashTotal = cashTransactions.reduce((sum, t) => sum + parseFloat(t.total || 0), 0)
    const mpesaTotal = mpesaTransactions.reduce((sum, t) => sum + parseFloat(t.total || 0), 0)

    // Low stock items
    const lowStockItems = products.filter(p => p.is_low_stock).slice(0, 5)

    // Top selling items (from today's transactions)
    const getTopSellingItems = () => {
        const itemCounts = {}
        todayTransactions.forEach(t => {
            t.items?.forEach(item => {
                if (itemCounts[item.product_name]) {
                    itemCounts[item.product_name] += item.quantity
                } else {
                    itemCounts[item.product_name] = item.quantity
                }
            })
        })
        return Object.entries(itemCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
    }

    const topSellingItems = getTopSellingItems()

    const handleDateChange = (e) => {
        if(e.target.value) {
            setSelectedDate(new Date(e.target.value))
        }
    }

    // Icons
    const CalendarIcon = () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
    )

    const SearchIcon = () => (
        <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="M21 21l-4.35-4.35"></path>
        </svg>
    )

    const BellIcon = () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
    )

    const DollarIcon = () => (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
    )

    const TrendingUpIcon = () => (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
            <polyline points="17 6 23 6 23 12"></polyline>
        </svg>
    )

    const PackageIcon = () => (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        </svg>
    )

    const CartIcon = () => (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
    )

    const AlertIcon = () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
    )

    const UsersIcon = () => (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
    )

    const CreditCardIcon = () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
            <line x1="1" y1="10" x2="23" y2="10"></line>
        </svg>
    )

    const PhoneIcon = () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
            <line x1="12" y1="18" x2="12.01" y2="18"></line>
        </svg>
    )

    const StarIcon = () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
    )

    const PlusIcon = () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
    )

    const ClipboardIcon = () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
        </svg>
    )

    const BarChartIcon = () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
    )

    return (
        <div className="flex min-h-screen bg-pos-bg">
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0">
                {/* Header Section */}
                <header className="bg-white px-6 py-4 border-b border-pos-border relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="relative flex-1 max-w-md">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                <SearchIcon />
                            </div>
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full pl-10 pr-4 py-2 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <button className="p-2 text-gray-500 hover:text-pos-text hover:bg-pos-hover rounded-lg transition-colors relative">
                                <BellIcon />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>
                            <div className="relative flex items-center gap-2 cursor-pointer" onClick={() => dateInputRef.current.showPicker()}>
                                <span className="text-sm font-medium text-pos-text">{getDisplayDate(selectedDate)}</span>
                                <CalendarIcon />
                                <input
                                    type="date"
                                    ref={dateInputRef}
                                    max={getMaxDate()}
                                    onChange={handleDateChange}
                                    value={selectedDate.toISOString().split('T')[0]}
                                    className="absolute top-0 right-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                            <ProfileDropdown />
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-6">
                    {error && (
                        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                            <AlertIcon />
                            <span>{error}</span>
                        </div>
                    )}

                    {loading ? (
                        <DashboardShimmer />
                    ) : (
                        <div className="space-y-6">
                            {/* Sales Overview - Top Row Stats */}
                            <div className="grid grid-cols-4 gap-4">
                                <div className="bg-white rounded-xl p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-pos-bg rounded-lg flex items-center justify-center text-pos-text">
                                            <DollarIcon />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Today's Sales</p>
                                            <p className="text-2xl font-bold text-pos-text">KSh {todaySales.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-pos-bg rounded-lg flex items-center justify-center text-pos-text">
                                            <CartIcon />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Transactions</p>
                                            <p className="text-2xl font-bold text-pos-text">{todayTransactions.length}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-pos-bg rounded-lg flex items-center justify-center text-pos-text">
                                            <PackageIcon />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Low Stock Items</p>
                                            <p className="text-2xl font-bold text-pos-text">{lowStockCount}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-pos-bg rounded-lg flex items-center justify-center text-pos-text">
                                            <TrendingUpIcon />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Total Revenue</p>
                                            <p className="text-2xl font-bold text-pos-text">KSh {totalRevenue.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Middle Row - Quick Actions & Payment Breakdown */}
                            <div className="grid grid-cols-3 gap-6">
                                {/* Quick Actions */}
                                <div className="bg-white rounded-xl p-5">
                                    <h3 className="text-lg font-semibold text-pos-text mb-4">Quick Actions</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => navigate('/sales')}
                                            className="flex flex-col items-center gap-2 p-4 bg-pos-bg rounded-lg hover:bg-pos-hover transition-colors"
                                        >
                                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-pos-text border border-pos-border">
                                                <PlusIcon />
                                            </div>
                                            <span className="text-sm text-pos-text">New Sale</span>
                                        </button>
                                        <button
                                            onClick={() => navigate('/inventory')}
                                            className="flex flex-col items-center gap-2 p-4 bg-pos-bg rounded-lg hover:bg-pos-hover transition-colors"
                                        >
                                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-pos-text border border-pos-border">
                                                <PackageIcon />
                                            </div>
                                            <span className="text-sm text-pos-text">Inventory</span>
                                        </button>
                                        <button
                                            onClick={() => navigate('/transactions')}
                                            className="flex flex-col items-center gap-2 p-4 bg-pos-bg rounded-lg hover:bg-pos-hover transition-colors"
                                        >
                                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-pos-text border border-pos-border">
                                                <ClipboardIcon />
                                            </div>
                                            <span className="text-sm text-pos-text">Transactions</span>
                                        </button>
                                        <button
                                            onClick={() => navigate('/reports')}
                                            className="flex flex-col items-center gap-2 p-4 bg-pos-bg rounded-lg hover:bg-pos-hover transition-colors"
                                        >
                                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-pos-text border border-pos-border">
                                                <BarChartIcon />
                                            </div>
                                            <span className="text-sm text-pos-text">Reports</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Payment Methods Breakdown */}
                                <div className="bg-white rounded-xl p-5">
                                    <h3 className="text-lg font-semibold text-pos-text mb-4">Payment Methods</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-pos-bg rounded-lg flex items-center justify-center text-pos-text">
                                                    <CreditCardIcon />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-pos-text">Cash</p>
                                                    <p className="text-sm text-gray-500">{cashTransactions.length} transactions</p>
                                                </div>
                                            </div>
                                            <span className="font-semibold text-pos-text">KSh {cashTotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-pos-bg rounded-lg flex items-center justify-center text-pos-text">
                                                    <PhoneIcon />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-pos-text">M-Pesa</p>
                                                    <p className="text-sm text-gray-500">{mpesaTransactions.length} transactions</p>
                                                </div>
                                            </div>
                                            <span className="font-semibold text-pos-text">KSh {mpesaTotal.toFixed(2)}</span>
                                        </div>
                                        {todaySales > 0 && (
                                            <div className="pt-3 border-t border-pos-border">
                                                <div className="flex gap-2">
                                                    <div
                                                        className="h-2 bg-pos-text rounded-full"
                                                        style={{ width: `${(cashTotal / todaySales) * 100}%` }}
                                                    ></div>
                                                    <div
                                                        className="h-2 bg-gray-400 rounded-full"
                                                        style={{ width: `${(mpesaTotal / todaySales) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Staff Performance */}
                                <div className="bg-white rounded-xl p-5">
                                    <h3 className="text-lg font-semibold text-pos-text mb-4">Staff Performance</h3>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 bg-pos-bg rounded-full flex items-center justify-center text-pos-text">
                                            <UsersIcon />
                                        </div>
                                        <div>
                                            <p className="font-medium text-pos-text">{user?.username || 'Cashier'}</p>
                                            <p className="text-sm text-gray-500">On Duty</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Sales Today</span>
                                            <span className="font-medium text-pos-text">KSh {todaySales.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Transactions</span>
                                            <span className="font-medium text-pos-text">{todayTransactions.length}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Avg. Transaction</span>
                                            <span className="font-medium text-pos-text">
                                                KSh {todayTransactions.length > 0 ? (todaySales / todayTransactions.length).toFixed(2) : '0.00'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Row - Inventory Alerts, Top Performers, Notifications */}
                            <div className="grid grid-cols-3 gap-6">
                                {/* Inventory Alerts */}
                                <div className="bg-white rounded-xl p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-pos-text">Inventory Alerts</h3>
                                        <span className="px-2 py-1 bg-pos-bg text-pos-text text-xs font-medium rounded-full">
                                            {lowStockCount} items
                                        </span>
                                    </div>
                                    {lowStockItems.length === 0 ? (
                                        <div className="text-center py-6 text-gray-500">
                                            <PackageIcon />
                                            <p className="mt-2 text-sm">All items are well stocked</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {lowStockItems.map(item => (
                                                <div key={item.id} className="flex items-center justify-between p-2 bg-pos-bg rounded-lg">
                                                    <div>
                                                        <p className="text-sm font-medium text-pos-text">{item.name}</p>
                                                        <p className="text-xs text-gray-500">{item.sku}</p>
                                                    </div>
                                                    <span className="px-2 py-1 bg-white text-pos-text text-xs font-medium rounded border border-pos-border">
                                                        {item.stock_quantity} left
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Top Performers */}
                                <div className="bg-white rounded-xl p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-pos-text">Top Selling Today</h3>
                                        <span className="text-pos-text"><StarIcon /></span>
                                    </div>
                                    {topSellingItems.length === 0 ? (
                                        <div className="text-center py-6 text-gray-500">
                                            <CartIcon />
                                            <p className="mt-2 text-sm">No sales yet today</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {topSellingItems.map(([name, qty], index) => (
                                                <div key={name} className="flex items-center gap-3">
                                                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-pos-bg text-pos-text">
                                                        {index + 1}
                                                    </span>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-pos-text truncate">{name}</p>
                                                    </div>
                                                    <span className="text-sm text-gray-500">{qty} sold</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Real-time Notifications */}
                                <div className="bg-white rounded-xl p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-pos-text">Notifications</h3>
                                        <span className="text-pos-text"><BellIcon /></span>
                                    </div>
                                    <div className="space-y-3">
                                        {lowStockCount > 0 && (
                                            <div className="flex items-start gap-3 p-3 bg-pos-bg rounded-lg">
                                                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-pos-text flex-shrink-0 border border-pos-border">
                                                    <AlertIcon />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-pos-text">Low Stock Alert</p>
                                                    <p className="text-xs text-gray-500">{lowStockCount} items need restocking</p>
                                                </div>
                                            </div>
                                        )}
                                        {todayTransactions.length > 0 && (
                                            <div className="flex items-start gap-3 p-3 bg-pos-bg rounded-lg">
                                                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-pos-text flex-shrink-0 border border-pos-border">
                                                    <DollarIcon />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-pos-text">Sales Update</p>
                                                    <p className="text-xs text-gray-500">{todayTransactions.length} transactions completed today</p>
                                                </div>
                                            </div>
                                        )}
                                        {todayTransactions.length === 0 && lowStockCount === 0 && (
                                            <div className="text-center py-6 text-gray-500">
                                                <BellIcon />
                                                <p className="mt-2 text-sm">No new notifications</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}

export default Home
