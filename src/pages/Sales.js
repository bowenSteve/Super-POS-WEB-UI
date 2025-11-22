import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { productsAPI, salesAPI } from "../api/api"
import Sidebar from "../components/Sidebar"
import "../styles/sales.css"

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

    // Fetch categories on mount
    useEffect(() => {
        fetchCategories()
    }, [])

    const fetchCategories = async () => {
        try {
            const response = await productsAPI.getCategories()
            // Handle both paginated and non-paginated responses
            const categoriesData = response.data.results || response.data
            setCategories(Array.isArray(categoriesData) ? categoriesData : [])
        } catch (err) {
            console.error("Failed to fetch categories", err)
            setCategories([])
        }
    }

    // Search products
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

    // Handle category selection
    const handleCategoryClick = (categoryId) => {
        setSelectedCategory(categoryId)
        setSearchTerm("")
        handleSearch("", categoryId)
    }

    // Clear category filter
    const clearCategoryFilter = () => {
        setSelectedCategory(null)
        setSearchResults([])
        setSearchTerm("")
    }

    // Add product to cart
    const addToCart = (product) => {
        const existingItem = cart.find(item => item.product.id === product.id)

        if (existingItem) {
            // Increase quantity if already in cart
            updateQuantity(product.id, existingItem.quantity + 1)
        } else {
            // Add new item to cart
            setCart([...cart, {
                product: product,
                quantity: 1,
                unit_price: parseFloat(product.selling_price)
            }])
        }

        // Clear search
        setSearchTerm("")
        setSearchResults([])
    }

    // Update quantity
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

    // Remove from cart
    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.product.id !== productId))
    }

    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
    const discountAmount = parseFloat(discount) || 0
    const total = Math.max(subtotal - discountAmount, 0)
    const change = paymentMethod === "cash" && amountPaid ? Math.max(parseFloat(amountPaid) - total, 0) : 0

    // Handle checkout
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

            // Reset form
            setCart([])
            setDiscount(0)
            setPaymentMethod("cash")
            setMpesaReference("")
            setAmountPaid("")

            // Clear success message after 5 seconds
            setTimeout(() => setSuccess(""), 5000)

        } catch (err) {
            const errorMsg = err.response?.data?.items || err.response?.data?.detail || "Failed to complete transaction"
            setError(errorMsg)
            console.error(err)
        } finally {
            setProcessing(false)
        }
    }

    return (
        <div className="home-container">
            <Sidebar />
            <div className="main-wrapper">
                <header className="home-header">
                    <div className="header-content">
                        <h1 className="page-title">New Sale</h1>
                        <div className="header-actions">
                            <span className="cashier-badge">Cashier: {user?.username}</span>
                        </div>
                    </div>
                </header>

                <main className="sales-main">
                    {error && (
                        <div className="alert alert-error">
                            <span className="alert-icon">⚠️</span>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="alert alert-success">
                            <span className="alert-icon">✓</span>
                            {success}
                        </div>
                    )}

                    <div className="sales-grid">
                        {/* Categories Section */}
                        <div className="sales-section categories-section">
                            <h2 className="section-title">Categories</h2>

                            <div className="categories-list">
                                <button
                                    className={`category-item ${selectedCategory === null ? 'active' : ''}`}
                                    onClick={clearCategoryFilter}
                                >
                                    <span className="category-icon">📦</span>
                                    <span className="category-name">All Products</span>
                                </button>

                                {categories.map(category => (
                                    <button
                                        key={category.id}
                                        className={`category-item ${selectedCategory === category.id ? 'active' : ''}`}
                                        onClick={() => handleCategoryClick(category.id)}
                                    >
                                        <span className="category-icon">
                                            {category.name === 'Beverages' && '🥤'}
                                            {category.name === 'Snacks' && '🍿'}
                                            {category.name === 'Groceries' && '🛒'}
                                            {category.name === 'Electronics' && '📱'}
                                            {!['Beverages', 'Snacks', 'Groceries', 'Electronics'].includes(category.name) && '📦'}
                                        </span>
                                        <div className="category-info">
                                            <span className="category-name">{category.name}</span>
                                            <span className="category-count">{category.products_count} items</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Product Search Section */}
                        <div className="sales-section search-section">
                            <h2 className="section-title">Search Products</h2>

                            <div className="search-box">
                                <input
                                    type="text"
                                    className="search-input"
                                    placeholder="Search by name or SKU..."
                                    value={searchTerm}
                                    onChange={(e) => handleSearch(e.target.value)}
                                />
                                {searching && <span className="search-loading">Searching...</span>}
                            </div>

                            {searchResults.length > 0 && (
                                <div className="search-results">
                                    {searchResults.map(product => (
                                        <div
                                            key={product.id}
                                            className="search-result-item"
                                            onClick={() => addToCart(product)}
                                        >
                                            <div className="product-info">
                                                <h4 className="product-name">{product.name}</h4>
                                                <p className="product-sku">SKU: {product.sku}</p>
                                            </div>
                                            <div className="product-details">
                                                <span className="product-price">KSh {product.selling_price}</span>
                                                <span className={`product-stock ${product.is_low_stock ? 'low' : ''}`}>
                                                    Stock: {product.stock_quantity}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Cart Section */}
                        <div className="sales-section cart-section">
                            <h2 className="section-title">Cart ({cart.length} items)</h2>

                            {cart.length === 0 ? (
                                <div className="empty-cart">
                                    <span className="empty-icon">🛒</span>
                                    <p>No items in cart</p>
                                </div>
                            ) : (
                                <>
                                    <div className="cart-items">
                                        {cart.map(item => (
                                            <div key={item.product.id} className="cart-item">
                                                <div className="item-info">
                                                    <h4 className="item-name">{item.product.name}</h4>
                                                    <p className="item-price">KSh {item.unit_price.toFixed(2)} each</p>
                                                </div>
                                                <div className="item-controls">
                                                    <div className="quantity-controls">
                                                        <button
                                                            className="qty-btn"
                                                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                        >
                                                            -
                                                        </button>
                                                        <input
                                                            type="number"
                                                            className="qty-input"
                                                            value={item.quantity}
                                                            onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 0)}
                                                            min="1"
                                                            max={item.product.stock_quantity}
                                                        />
                                                        <button
                                                            className="qty-btn"
                                                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                    <span className="item-subtotal">KSh {(item.quantity * item.unit_price).toFixed(2)}</span>
                                                    <button
                                                        className="remove-btn"
                                                        onClick={() => removeFromCart(item.product.id)}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Totals */}
                                    <div className="cart-summary">
                                        <div className="summary-row">
                                            <span>Subtotal:</span>
                                            <span>KSh {subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="summary-row discount-row">
                                            <label>Discount:</label>
                                            <div className="discount-input-wrapper">
                                                <span className="currency">KSh</span>
                                                <input
                                                    type="number"
                                                    className="discount-input"
                                                    value={discount}
                                                    onChange={(e) => setDiscount(e.target.value)}
                                                    placeholder="0.00"
                                                    min="0"
                                                    max={subtotal}
                                                />
                                            </div>
                                        </div>
                                        <div className="summary-row total-row">
                                            <span>Total:</span>
                                            <span className="total-amount">KSh {total.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    {/* Payment Section */}
                                    <div className="payment-section">
                                        <h3 className="payment-title">Payment Method</h3>

                                        <div className="payment-methods">
                                            <button
                                                className={`payment-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
                                                onClick={() => setPaymentMethod('cash')}
                                            >
                                                💵 Cash
                                            </button>
                                            <button
                                                className={`payment-btn ${paymentMethod === 'mpesa' ? 'active' : ''}`}
                                                onClick={() => setPaymentMethod('mpesa')}
                                            >
                                                📱 M-Pesa
                                            </button>
                                        </div>

                                        {paymentMethod === 'cash' && (
                                            <div className="payment-details">
                                                <label className="form-label">Amount Paid</label>
                                                <div className="amount-input-wrapper">
                                                    <span className="currency">KSh</span>
                                                    <input
                                                        type="number"
                                                        className="amount-input"
                                                        value={amountPaid}
                                                        onChange={(e) => setAmountPaid(e.target.value)}
                                                        placeholder="0.00"
                                                        min={total}
                                                    />
                                                </div>
                                                {amountPaid && parseFloat(amountPaid) >= total && (
                                                    <div className="change-amount">
                                                        Change: <span>KSh {change.toFixed(2)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {paymentMethod === 'mpesa' && (
                                            <div className="payment-details">
                                                <label className="form-label">M-Pesa Reference</label>
                                                <input
                                                    type="text"
                                                    className="mpesa-input"
                                                    value={mpesaReference}
                                                    onChange={(e) => setMpesaReference(e.target.value)}
                                                    placeholder="e.g., QH12ABC34D"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        className="checkout-btn"
                                        onClick={handleCheckout}
                                        disabled={processing || cart.length === 0}
                                    >
                                        {processing ? "Processing..." : `Complete Sale - KSh ${total.toFixed(2)}`}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default Sales
