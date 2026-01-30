import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { productsAPI, salesAPI } from "../api/api"
import Sidebar from "../components/Sidebar"

function Sales() {
    const { user } = useAuth()
    const [categories, setCategories] = useState([])
    const [selectedCategory, setSelectedCategory] = useState(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [searchResults, setSearchResults] = useState([])
    const [searching, setSearching] = useState(false)
    const [cart, setCart] = useState([])
    const [discount, setDiscount] = useState(0)
    const [paymentMethod, setPaymentMethod] = useState("cash")
    const [mpesaReference, setMpesaReference] = useState("")
    const [amountPaid, setAmountPaid] = useState("")
    const [processing, setProcessing] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    useEffect(() => {
        fetchCategories()
    }, [])

    const fetchCategories = async () => {
        try {
            const response = await productsAPI.getCategories()
            const categoriesData = response.data.results || response.data
            setCategories(Array.isArray(categoriesData) ? categoriesData : [])
        } catch (err) {
            console.error("Failed to fetch categories", err)
            setCategories([])
        }
    }

    const handleSearch = async (term, categoryId = null) => {
        setSearchTerm(term)
        if (term.length < 2 && !categoryId) {
            setSearchResults([])
            return
        }

        setSearching(true)
        setError("")

        try {
            const params = {}
            if (term.length >= 2) {
                params.search = term
            }
            if (categoryId) {
                params.category = categoryId
            }

            const response = await productsAPI.getAll(params)
            setSearchResults(response.data.results || response.data)
        } catch (err) {
            setError("Failed to search products")
            console.error(err)
        } finally {
            setSearching(false)
        }
    }

    const handleCategoryClick = (categoryId) => {
        setSelectedCategory(categoryId)
        setSearchTerm("")
        handleSearch("", categoryId)
    }

    const clearCategoryFilter = () => {
        setSelectedCategory(null)
        setSearchResults([])
        setSearchTerm("")
    }

    const addToCart = (product) => {
        const existingItem = cart.find(item => item.product.id === product.id)

        if (existingItem) {
            updateQuantity(product.id, existingItem.quantity + 1)
        } else {
            setCart([...cart, {
                product: product,
                quantity: 1,
                unit_price: parseFloat(product.selling_price)
            }])
        }

        setSearchTerm("")
        setSearchResults([])
    }

    const updateQuantity = (productId, newQuantity) => {
        const product = cart.find(item => item.product.id === productId)?.product

        if (newQuantity > product.stock_quantity) {
            setError(`Only ${product.stock_quantity} units available for ${product.name}`)
            return
        }

        if (newQuantity < 1) {
            removeFromCart(productId)
            return
        }

        setCart(cart.map(item =>
            item.product.id === productId
                ? { ...item, quantity: newQuantity }
                : item
        ))
        setError("")
    }

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.product.id !== productId))
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
    const discountAmount = parseFloat(discount) || 0
    const total = Math.max(subtotal - discountAmount, 0)
    const change = paymentMethod === "cash" && amountPaid ? Math.max(parseFloat(amountPaid) - total, 0) : 0

    const handleCheckout = async () => {
        if (cart.length === 0) {
            setError("Cart is empty")
            return
        }

        if (paymentMethod === "cash" && (!amountPaid || parseFloat(amountPaid) < total)) {
            setError("Amount paid is less than total")
            return
        }

        if (paymentMethod === "mpesa" && !mpesaReference.trim()) {
            setError("M-Pesa reference number is required")
            return
        }

        setProcessing(true)
        setError("")

        try {
            const transactionData = {
                cashier: user.id,
                items: cart.map(item => ({
                    product: item.product.id,
                    quantity: item.quantity,
                    unit_price: item.unit_price.toString()
                })),
                subtotal: subtotal.toFixed(2),
                tax: "0.00",
                discount: discountAmount.toFixed(2),
                total: total.toFixed(2),
                payment_method: paymentMethod,
                mpesa_reference: paymentMethod === "mpesa" ? mpesaReference : null,
                amount_paid: paymentMethod === "cash" ? parseFloat(amountPaid).toFixed(2) : total.toFixed(2),
                change_amount: paymentMethod === "cash" ? change.toFixed(2) : "0.00",
                status: "completed"
            }

            const response = await salesAPI.createTransaction(transactionData)

            setSuccess(`Transaction completed! ID: ${response.data.transaction_id}`)

            setCart([])
            setDiscount(0)
            setPaymentMethod("cash")
            setMpesaReference("")
            setAmountPaid("")

            setTimeout(() => setSuccess(""), 5000)

        } catch (err) {
            const errorMsg = err.response?.data?.items || err.response?.data?.detail || "Failed to complete transaction"
            setError(errorMsg)
            console.error(err)
        } finally {
            setProcessing(false)
        }
    }

    // SVG Icons
    const SearchIcon = () => (
        <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="M21 21l-4.35-4.35"></path>
        </svg>
    )

    const UserIcon = () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
        </svg>
    )

    const CartIcon = () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
    )

    const PackageIcon = () => (
        <svg className="w-12 h-12 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
    )

    const ImageIcon = () => (
        <svg className="w-8 h-8 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
    )

    const MinusIcon = () => (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
    )

    const PlusIcon = () => (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
    )

    const TrashIcon = () => (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
    )

    const CheckIcon = () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
    )

    const CashIcon = () => (
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

    return (
        <div className="flex min-h-screen bg-pos-bg">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <header className="bg-white px-6 py-4 border-b border-pos-border">
                    <div className="flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-xl">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                <SearchIcon />
                            </div>
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-2.5 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                placeholder="Search products by name or SKU..."
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                            {searching && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="w-5 h-5 border-2 border-pos-primary border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                            <UserIcon />
                            <span className="text-sm">{user?.username}</span>
                        </div>
                    </div>
                </header>

                {/* Alerts */}
                {error && (
                    <div className="mx-6 mt-4 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <span className="flex-1">{error}</span>
                        <button className="text-red-500 hover:text-red-700" onClick={() => setError("")}>
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                )}

                {success && (
                    <div className="mx-6 mt-4 flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        <span className="flex-1">{success}</span>
                        <button className="text-green-500 hover:text-green-700" onClick={() => setSuccess("")}>
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                )}

                {/* Main Content - Two Panel Layout */}
                <main className="flex-1 flex gap-6 p-6 overflow-hidden">
                    {/* Left Panel - Products */}
                    <div className="flex-1 flex flex-col min-w-0">
                        {/* Category Tabs */}
                        <div className="flex gap-2 mb-4 flex-wrap">
                            <button
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    selectedCategory === null
                                        ? 'bg-pos-primary text-white'
                                        : 'bg-white text-gray-600 hover:bg-pos-hover'
                                }`}
                                onClick={clearCategoryFilter}
                            >
                                All
                            </button>
                            {categories.map(category => (
                                <button
                                    key={category.id}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        selectedCategory === category.id
                                            ? 'bg-pos-primary text-white'
                                            : 'bg-white text-gray-600 hover:bg-pos-hover'
                                    }`}
                                    onClick={() => handleCategoryClick(category.id)}
                                >
                                    {category.name}
                                </button>
                            ))}
                        </div>

                        {/* Products Grid */}
                        <div className="flex-1 overflow-y-auto">
                            {searchResults.length === 0 && !searching && (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <PackageIcon />
                                    <p className="mt-4 text-sm">Select a category or search for products</p>
                                </div>
                            )}

                            {searching && (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <div className="w-8 h-8 border-2 border-pos-primary border-t-transparent rounded-full animate-spin"></div>
                                    <p className="mt-4 text-sm">Searching products...</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
                                {searchResults.map(product => (
                                    <div
                                        key={product.id}
                                        className={`bg-white rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow ${
                                            product.is_low_stock ? 'ring-1 ring-yellow-300' : ''
                                        }`}
                                        onClick={() => addToCart(product)}
                                    >
                                        <div className="aspect-[4/3] bg-gray-50 rounded-lg flex items-center justify-center mb-3">
                                            <ImageIcon />
                                        </div>
                                        <h4 className="font-medium text-pos-text text-sm truncate">{product.name}</h4>
                                        <p className="text-xs text-gray-500 mb-2">{product.sku}</p>
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-pos-text">KSh {product.selling_price}</span>
                                            <span className={`text-xs ${product.is_low_stock ? 'text-yellow-600' : 'text-gray-500'}`}>
                                                {product.stock_quantity} in stock
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Cart */}
                    <div className="w-[380px] bg-white rounded-xl flex flex-col max-h-[calc(100vh-140px)] sticky top-6">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-pos-border">
                            <div className="flex items-center gap-2">
                                <CartIcon />
                                <h2 className="font-semibold text-pos-text">Cart</h2>
                            </div>
                            <span className="text-sm text-gray-500">{cart.length} items</span>
                        </div>

                        {cart.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
                                <svg className="w-16 h-16 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <circle cx="9" cy="21" r="1"></circle>
                                    <circle cx="20" cy="21" r="1"></circle>
                                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                                </svg>
                                <p className="mt-4 font-medium text-gray-600">Your cart is empty</p>
                                <span className="text-sm">Add products to get started</span>
                            </div>
                        ) : (
                            <>
                                {/* Cart Items */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {cart.map(item => (
                                        <div key={item.product.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-pos-text text-sm truncate">{item.product.name}</h4>
                                                <p className="text-sm text-gray-500">KSh {item.unit_price.toFixed(2)}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center bg-white rounded-lg border border-pos-border">
                                                    <button
                                                        className="p-2 text-gray-500 hover:text-pos-text transition-colors"
                                                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                    >
                                                        <MinusIcon />
                                                    </button>
                                                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                                    <button
                                                        className="p-2 text-gray-500 hover:text-pos-text transition-colors"
                                                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                    >
                                                        <PlusIcon />
                                                    </button>
                                                </div>
                                                <span className="w-20 text-right text-sm font-medium text-pos-text">
                                                    KSh {(item.quantity * item.unit_price).toFixed(2)}
                                                </span>
                                                <button
                                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                                    onClick={() => removeFromCart(item.product.id)}
                                                >
                                                    <TrashIcon />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Cart Summary */}
                                <div className="border-t border-pos-border p-4 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="text-pos-text">KSh {subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">Discount</span>
                                        <div className="flex items-center bg-gray-50 rounded-lg border border-pos-border overflow-hidden">
                                            <span className="px-2 text-gray-500 text-sm">KSh</span>
                                            <input
                                                type="number"
                                                value={discount}
                                                onChange={(e) => setDiscount(e.target.value)}
                                                placeholder="0"
                                                min="0"
                                                max={subtotal}
                                                className="w-20 py-1.5 pr-2 text-sm text-right bg-transparent focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-base font-semibold pt-2 border-t border-pos-border">
                                        <span className="text-pos-text">Total</span>
                                        <span className="text-pos-text">KSh {total.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Payment Method */}
                                <div className="border-t border-pos-border p-4">
                                    <div className="flex gap-2 mb-4">
                                        <button
                                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                                paymentMethod === 'cash'
                                                    ? 'bg-pos-primary text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                            onClick={() => setPaymentMethod('cash')}
                                        >
                                            <CashIcon />
                                            Cash
                                        </button>
                                        <button
                                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                                paymentMethod === 'mpesa'
                                                    ? 'bg-pos-primary text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                            onClick={() => setPaymentMethod('mpesa')}
                                        >
                                            <PhoneIcon />
                                            M-Pesa
                                        </button>
                                    </div>

                                    {paymentMethod === 'cash' && (
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-sm text-gray-600 mb-1">Amount Received</label>
                                                <div className="flex items-center bg-gray-50 rounded-lg border border-pos-border overflow-hidden">
                                                    <span className="px-3 text-gray-500">KSh</span>
                                                    <input
                                                        type="number"
                                                        value={amountPaid}
                                                        onChange={(e) => setAmountPaid(e.target.value)}
                                                        placeholder="0.00"
                                                        min={total}
                                                        className="flex-1 py-2.5 pr-3 bg-transparent focus:outline-none"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {[100, 200, 500, 1000].map(amount => (
                                                    <button
                                                        key={amount}
                                                        className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                                                        onClick={() => setAmountPaid(amount.toString())}
                                                    >
                                                        {amount}
                                                    </button>
                                                ))}
                                                <button
                                                    className="px-3 py-1.5 text-sm bg-pos-hover text-pos-text rounded-lg hover:bg-pos-primary hover:text-white transition-colors"
                                                    onClick={() => setAmountPaid(total.toFixed(2))}
                                                >
                                                    Exact
                                                </button>
                                            </div>
                                            {amountPaid && parseFloat(amountPaid) >= total && (
                                                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                                    <span className="text-sm text-green-700">Change</span>
                                                    <span className="font-semibold text-green-700">KSh {change.toFixed(2)}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {paymentMethod === 'mpesa' && (
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">M-Pesa Reference Code</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2.5 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                                value={mpesaReference}
                                                onChange={(e) => setMpesaReference(e.target.value.toUpperCase())}
                                                placeholder="e.g., QH12ABC34D"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Checkout Button */}
                                <div className="p-4 pt-0">
                                    <button
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-pos-primary text-white rounded-lg font-medium hover:bg-pos-text/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={handleCheckout}
                                        disabled={processing || cart.length === 0}
                                    >
                                        {processing ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <CheckIcon />
                                                Complete Sale - KSh {total.toFixed(2)}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}

export default Sales
