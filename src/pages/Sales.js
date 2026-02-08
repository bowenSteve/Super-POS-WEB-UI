import { useState, useEffect, useRef } from "react"
import { useAuth } from "../context/AuthContext"
import { productsAPI, salesAPI, customersAPI } from "../api/api"
import Sidebar from "../components/Sidebar"
import ToastNotification, { toast } from '../components/ToastNotification'
import SuccessAnimation from '../components/SuccessAnimation'
import KeyboardShortcutsHelp from '../components/KeyboardShortcutsHelp'
import ReceiptPreview from '../components/ReceiptPreview'
import useSoundEffects from '../hooks/useSoundEffects'

// Default tax settings
const defaultTaxSettings = {
    enabled: true,
    rate: 16,
    name: 'VAT',
    includeInPrice: false,
    showOnReceipt: true,
    taxNumber: ''
}

function Sales() {
    const { user, currentShop } = useAuth()
    const [categories, setCategories] = useState([])
    const [selectedCategory, setSelectedCategory] = useState(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [searchResults, setSearchResults] = useState([])
    const [searching, setSearching] = useState(false)
    const [cart, setCart] = useState(() => {
        const saved = localStorage.getItem('pos_cart')
        return saved ? JSON.parse(saved) : []
    })
    const [discount, setDiscount] = useState(() => {
        const saved = localStorage.getItem('pos_discount')
        return saved ? parseFloat(saved) : 0
    })
    const [paymentMethod, setPaymentMethod] = useState("cash")
    const [mpesaReference, setMpesaReference] = useState("")
    const [amountPaid, setAmountPaid] = useState("")
    const [processing, setProcessing] = useState(false)
    const [heldTransactions, setHeldTransactions] = useState([])
    const [showRecallModal, setShowRecallModal] = useState(false)
    const [holdNote, setHoldNote] = useState("")
    const [showHoldModal, setShowHoldModal] = useState(false)
    const [selectedCustomer, setSelectedCustomer] = useState(() => {
        const saved = localStorage.getItem('pos_customer')
        return saved ? JSON.parse(saved) : null
    })
    const [showCustomerModal, setShowCustomerModal] = useState(false)
    const [customerSearch, setCustomerSearch] = useState("")
    const [customerResults, setCustomerResults] = useState([])
    const [searchingCustomers, setSearchingCustomers] = useState(false)
    const [showQuickAddCustomer, setShowQuickAddCustomer] = useState(false)
    const [newCustomerData, setNewCustomerData] = useState({ name: "", phone: "", email: "" })
    const [creatingCustomer, setCreatingCustomer] = useState(false)
    const [showSplitPayment, setShowSplitPayment] = useState(false)
    const [splitPayments, setSplitPayments] = useState([])
    const [currentPayment, setCurrentPayment] = useState({ method: "cash", amount: "", reference: "" })

    // UX Enhancement states
    const [pendingQuantity, setPendingQuantity] = useState(null) // Quantity-first mode
    const [showSuccess, setShowSuccess] = useState(false) // Success animation
    const [successAmount, setSuccessAmount] = useState(0) // Amount for success animation
    const [favorites, setFavorites] = useState(() => {
        const saved = localStorage.getItem('pos_favorites')
        return saved ? JSON.parse(saved) : []
    })
    const [topSellingProducts, setTopSellingProducts] = useState([])
    const [showReceiptPreview, setShowReceiptPreview] = useState(false)
    const searchInputRef = useRef(null)
    const amountInputRef = useRef(null)
    const mpesaInputRef = useRef(null)

    // Sound effects
    const { playAddItem, playSuccess, playError, playRemoveItem, playHold } = useSoundEffects()

    // Tax state - loaded from shop settings
    const [taxSettings, setTaxSettings] = useState(() => {
        // Try to get from localStorage first (for initial load)
        const saved = localStorage.getItem('pos_taxSettings')
        if (saved) {
            return { ...defaultTaxSettings, ...JSON.parse(saved) }
        }
        return defaultTaxSettings
    })
    // Derived values for backward compatibility
    const taxRate = taxSettings.rate
    const taxEnabled = taxSettings.enabled
    const taxName = taxSettings.name || 'VAT'

    // Currency from shop settings
    const currency = currentShop?.currency || 'KSh'

    // Load held transactions from localStorage on mount
    useEffect(() => {
        const savedHolds = localStorage.getItem('heldTransactions')
        if (savedHolds) {
            try {
                setHeldTransactions(JSON.parse(savedHolds))
            } catch (err) {
                console.error('Failed to load held transactions:', err)
                localStorage.removeItem('heldTransactions')
            }
        }
    }, [])

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('pos_cart', JSON.stringify(cart))
    }, [cart])

    // Save discount to localStorage
    useEffect(() => {
        localStorage.setItem('pos_discount', discount.toString())
    }, [discount])

    // Save selected customer to localStorage
    useEffect(() => {
        if (selectedCustomer) {
            localStorage.setItem('pos_customer', JSON.stringify(selectedCustomer))
        } else {
            localStorage.removeItem('pos_customer')
        }
    }, [selectedCustomer])

    // Load tax settings from currentShop when it changes
    useEffect(() => {
        if (currentShop?.tax_settings) {
            const shopTaxSettings = { ...defaultTaxSettings, ...currentShop.tax_settings }
            setTaxSettings(shopTaxSettings)
            // Also sync to localStorage
            localStorage.setItem('pos_taxSettings', JSON.stringify(shopTaxSettings))
            localStorage.setItem('pos_taxRate', shopTaxSettings.rate.toString())
            localStorage.setItem('pos_taxEnabled', JSON.stringify(shopTaxSettings.enabled))
        }
    }, [currentShop])

    // Fetch top-selling products on mount
    useEffect(() => {
        const fetchTopSellingProducts = async () => {
            try {
                const response = await productsAPI.get('/top-selling/')
                setTopSellingProducts(response.data.slice(0, 5)) // Top 5 only
            } catch (err) {
                console.error('Failed to fetch top-selling products:', err)
            }
        }

        if (currentShop) {
            fetchTopSellingProducts()
        }
    }, [currentShop])

    useEffect(() => {
        fetchCategories()
    }, [])

    // Save favorites to localStorage
    useEffect(() => {
        localStorage.setItem('pos_favorites', JSON.stringify(favorites))
    }, [favorites])

    // Keyboard shortcuts handler
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Don't trigger shortcuts when typing in inputs (except for specific keys)
            const isInputFocused = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)
            const isModalOpen = showHoldModal || showRecallModal || showCustomerModal || showSplitPayment

            // Handle number keys for quantity-first mode (only when not in input)
            if (!isInputFocused && !isModalOpen && /^[0-9]$/.test(e.key)) {
                e.preventDefault()
                setPendingQuantity(prev => {
                    const newQty = prev ? parseInt(`${prev}${e.key}`) : parseInt(e.key)
                    return Math.min(newQty, 999) // Cap at 999
                })
                return
            }

            // Clear pending quantity on Escape
            if (e.key === 'Escape') {
                if (pendingQuantity) {
                    setPendingQuantity(null)
                    return
                }
                // Close modals
                if (showHoldModal) setShowHoldModal(false)
                if (showRecallModal) setShowRecallModal(false)
                if (showCustomerModal) setShowCustomerModal(false)
                if (showSplitPayment) setShowSplitPayment(false)
                if (searchTerm) {
                    setSearchTerm("")
                    setSearchResults([])
                }
                return
            }

            // Skip other shortcuts if modal is open
            if (isModalOpen) return

            // F1 - Focus search
            if (e.key === 'F1') {
                e.preventDefault()
                searchInputRef.current?.focus()
                return
            }

            // F2 - Cash payment
            if (e.key === 'F2') {
                e.preventDefault()
                setPaymentMethod('cash')
                setTimeout(() => amountInputRef.current?.focus(), 50)
                return
            }

            // F3 - M-Pesa payment
            if (e.key === 'F3') {
                e.preventDefault()
                setPaymentMethod('mpesa')
                setTimeout(() => mpesaInputRef.current?.focus(), 50)
                return
            }

            // F4 - Hold transaction
            if (e.key === 'F4') {
                e.preventDefault()
                if (cart.length > 0) {
                    setShowHoldModal(true)
                }
                return
            }

            // F5 - Recall transaction
            if (e.key === 'F5') {
                e.preventDefault()
                setShowRecallModal(true)
                return
            }

            // Enter - Complete sale (when not in input or when in amount/mpesa input)
            if (e.key === 'Enter' && cart.length > 0 && !processing) {
                const activeEl = document.activeElement
                const isPaymentInput = activeEl === amountInputRef.current || activeEl === mpesaInputRef.current

                if (!isInputFocused || isPaymentInput) {
                    e.preventDefault()
                    handleCheckout()
                    return
                }
            }

            // + / = - Increase last item quantity
            if ((e.key === '+' || e.key === '=') && !isInputFocused && cart.length > 0) {
                e.preventDefault()
                const lastItem = cart[cart.length - 1]
                updateQuantity(lastItem.product.id, lastItem.quantity + 1)
                return
            }

            // - - Decrease last item quantity
            if (e.key === '-' && !isInputFocused && cart.length > 0) {
                e.preventDefault()
                const lastItem = cart[cart.length - 1]
                updateQuantity(lastItem.product.id, lastItem.quantity - 1)
                return
            }

            // Delete - Remove last item
            if (e.key === 'Delete' && !isInputFocused && cart.length > 0) {
                e.preventDefault()
                const lastItem = cart[cart.length - 1]
                removeFromCart(lastItem.product.id)
                return
            }

            // ? - Toggle shortcuts help
            if (e.key === '?' && !isInputFocused) {
                e.preventDefault()
                return
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cart, processing, showHoldModal, showRecallModal, showCustomerModal, showSplitPayment, pendingQuantity, searchTerm])

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
            toast.error("Failed to search products")
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
        const quantityToAdd = pendingQuantity || 1
        const existingItem = cart.find(item => item.product.id === product.id)

        // Check stock
        const currentQty = existingItem ? existingItem.quantity : 0
        if (currentQty + quantityToAdd > product.stock_quantity) {
            toast.error(`Only ${product.stock_quantity} units available for ${product.name}`)
            playError()
            setPendingQuantity(null)
            return
        }

        // Check if adding this item will result in low stock
        const remainingStock = product.stock_quantity - (currentQty + quantityToAdd)
        const reorderLevel = product.reorder_level || 10
        if (remainingStock <= reorderLevel && remainingStock > 0) {
            toast.warning(`⚠️ Low Stock Alert: Only ${remainingStock} units left for ${product.name}`)
        } else if (remainingStock === 0) {
            toast.warning(`⚠️ Last Unit! ${product.name} is now out of stock`)
        }

        if (existingItem) {
            updateQuantity(product.id, existingItem.quantity + quantityToAdd)
        } else {
            setCart([...cart, {
                product: product,
                quantity: quantityToAdd,
                unit_price: parseFloat(product.selling_price),
                discount: 0
            }])
        }

        // Play sound and clear pending quantity
        playAddItem()
        setPendingQuantity(null)
        setSearchTerm("")
        setSearchResults([])
    }

    // Toggle product as favorite
    const toggleFavorite = (product) => {
        setFavorites(prev => {
            const exists = prev.find(f => f.id === product.id)
            if (exists) {
                return prev.filter(f => f.id !== product.id)
            } else {
                // Limit to 8 favorites
                if (prev.length >= 8) {
                    toast.error("Maximum 8 favorites allowed. Remove one first.")
                    return prev
                }
                return [...prev, {
                    id: product.id,
                    name: product.name,
                    selling_price: product.selling_price,
                    stock_quantity: product.stock_quantity,
                    reorder_level: product.reorder_level || 10,
                    sku: product.sku
                }]
            }
        })
    }

    const isFavorite = (productId) => {
        return favorites.some(f => f.id === productId)
    }

    const updateQuantity = (productId, newQuantity) => {
        const product = cart.find(item => item.product.id === productId)?.product

        if (newQuantity > product.stock_quantity) {
            toast.error(`Only ${product.stock_quantity} units available for ${product.name}`)
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
    }

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.product.id !== productId))
        playRemoveItem()
    }

    const clearCart = () => {
        if (cart.length === 0) return
        if (window.confirm('Are you sure you want to clear all items from the cart?')) {
            setCart([])
            setDiscount(0)
            toast.success('Cart cleared')
        }
    }

    const updateItemDiscount = (productId, discountValue) => {
        const discountAmount = parseFloat(discountValue) || 0
        const item = cart.find(item => item.product.id === productId)

        if (!item) return

        const itemTotal = item.quantity * item.unit_price

        if (discountAmount > itemTotal) {
            toast.error("Discount cannot exceed item total")
            return
        }

        setCart(cart.map(item =>
            item.product.id === productId
                ? { ...item, discount: discountAmount }
                : item
        ))
    }

    const subtotal = cart.reduce((sum, item) => sum + ((item.quantity * item.unit_price) - (item.discount || 0)), 0)
    const discountAmount = parseFloat(discount) || 0
    const taxableAmount = Math.max(subtotal - discountAmount, 0)
    const taxAmount = taxEnabled ? (taxableAmount * taxRate) / 100 : 0
    const total = taxableAmount + taxAmount
    const change = paymentMethod === "cash" && amountPaid ? Math.max(parseFloat(amountPaid) - total, 0) : 0

    const handleCheckout = () => {
        if (cart.length === 0) {
            toast.error("Cart is empty")
            return
        }

        if (paymentMethod === "cash" && (!amountPaid || parseFloat(amountPaid) < total)) {
            toast.error("Amount paid is less than total")
            return
        }

        if (paymentMethod === "mpesa" && !mpesaReference.trim()) {
            toast.error("M-Pesa reference number is required")
            return
        }

        // Show receipt preview instead of completing immediately
        setShowReceiptPreview(true)
    }

    const handleConfirmSale = async () => {
        setShowReceiptPreview(false)
        setProcessing(true)

        try {
            const transactionData = {
                cashier: user.id,
                customer: selectedCustomer?.id || null,
                items: cart.map(item => ({
                    product: item.product.id,
                    quantity: item.quantity,
                    unit_price: item.unit_price.toString(),
                    discount: (item.discount || 0).toFixed(2)
                })),
                subtotal: subtotal.toFixed(2),
                tax: taxAmount.toFixed(2),
                discount: discountAmount.toFixed(2),
                total: total.toFixed(2),
                payment_method: paymentMethod,
                mpesa_reference: paymentMethod === "mpesa" ? mpesaReference : null,
                amount_paid: paymentMethod === "cash" ? parseFloat(amountPaid).toFixed(2) : total.toFixed(2),
                change_amount: paymentMethod === "cash" ? change.toFixed(2) : "0.00",
                status: "completed"
            }

            await salesAPI.createTransaction(transactionData)

            // Show success animation and play sound
            setSuccessAmount(total)
            setShowSuccess(true)
            playSuccess()

            // Reset cart after animation starts
            setCart([])
            setDiscount(0)
            setPaymentMethod("cash")
            setMpesaReference("")
            setAmountPaid("")
            setSelectedCustomer(null)

        } catch (err) {
            const errorMsg = err.response?.data?.items || err.response?.data?.detail || "Failed to complete transaction"
            toast.error(errorMsg)
            playError()
            console.error(err)
        } finally {
            setProcessing(false)
        }
    }

    // Handle success animation complete
    const handleSuccessComplete = () => {
        setShowSuccess(false)
        setSuccessAmount(0)
    }

    // Split payment functions
    const handleAddPayment = () => {
        const paymentAmount = parseFloat(currentPayment.amount)

        if (!paymentAmount || paymentAmount <= 0) {
            toast.error("Please enter a valid amount")
            return
        }

        if (currentPayment.method === "mpesa" && !currentPayment.reference.trim()) {
            toast.error("M-Pesa reference is required")
            return
        }

        const totalPaid = splitPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0)
        const remaining = parseFloat((total - totalPaid).toFixed(2))

        // Use a small tolerance for floating-point comparison (0.01 = 1 cent)
        if (paymentAmount > remaining + 0.01) {
            toast.error(`Amount exceeds remaining balance of ${currency} ${remaining.toFixed(2)}`)
            return
        }

        setSplitPayments([...splitPayments, {
            method: currentPayment.method,
            amount: paymentAmount,
            reference: currentPayment.reference
        }])

        setCurrentPayment({ method: "cash", amount: "", reference: "" })
    }

    const handleRemovePayment = (index) => {
        setSplitPayments(splitPayments.filter((_, i) => i !== index))
    }

    const handleCompleteSplitPayment = async () => {
        if (splitPayments.length === 0) {
            toast.error("Please add at least one payment method")
            return
        }

        const totalPaid = parseFloat(splitPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0).toFixed(2))

        // Use small tolerance for floating-point comparison
        if (totalPaid < total - 0.01) {
            toast.error(`Incomplete payment. Remaining: ${currency} ${(total - totalPaid).toFixed(2)}`)
            return
        }

        setProcessing(true)

        try {
            const transactionData = {
                cashier: user.id,
                customer: selectedCustomer?.id || null,
                items: cart.map(item => ({
                    product: item.product.id,
                    quantity: item.quantity,
                    unit_price: item.unit_price.toString(),
                    discount: (item.discount || 0).toFixed(2)
                })),
                subtotal: subtotal.toFixed(2),
                tax: taxAmount.toFixed(2),
                discount: discountAmount.toFixed(2),
                total: total.toFixed(2),
                payment_method: "split",
                amount_paid: totalPaid.toFixed(2),
                change_amount: (totalPaid - total).toFixed(2),
                payment_details: splitPayments,
                status: "completed"
            }

            const response = await salesAPI.createTransaction(transactionData)

            toast.success(`Transaction completed! ID: ${response.data.transaction_id}`)

            // Reset everything
            setCart([])
            setDiscount(0)
            setPaymentMethod("cash")
            setMpesaReference("")
            setAmountPaid("")
            setSelectedCustomer(null)
            setSplitPayments([])
            setCurrentPayment({ method: "cash", amount: "", reference: "" })
            setShowSplitPayment(false)

        } catch (err) {
            const errorMsg = err.response?.data?.items || err.response?.data?.detail || "Failed to complete transaction"
            toast.error(errorMsg)
            console.error(err)
        } finally {
            setProcessing(false)
        }
    }

    // Hold current transaction
    const handleHoldTransaction = () => {
        if (cart.length === 0) {
            toast.error("Cannot hold an empty cart")
            return
        }

        if (heldTransactions.length >= 10) {
            toast.error("Maximum 10 held transactions. Please recall or clear some first.")
            return
        }

        const heldTransaction = {
            id: Date.now().toString(),
            items: cart,
            discount: discount,
            taxSettings: taxSettings,
            taxEnabled: taxSettings.enabled,
            taxRate: taxSettings.rate,
            holdTime: new Date().toISOString(),
            holdNote: holdNote.trim(),
            cashierId: user.id,
            cashierName: user.username
        }

        const updatedHolds = [...heldTransactions, heldTransaction]
        setHeldTransactions(updatedHolds)
        localStorage.setItem('heldTransactions', JSON.stringify(updatedHolds))

        // Clear current cart
        setCart([])
        setDiscount(0)
        setHoldNote("")
        setShowHoldModal(false)
        playHold()
        toast.success(`Transaction held successfully ${holdNote ? `- ${holdNote}` : ''}`)
    }

    // Recall a held transaction
    const handleRecallTransaction = (heldId) => {
        const heldTransaction = heldTransactions.find(h => h.id === heldId)
        if (!heldTransaction) return

        // If cart has items, ask user what to do
        if (cart.length > 0) {
            const confirmReplace = window.confirm(
                "You have items in the current cart. Click OK to replace with held transaction, or Cancel to merge."
            )

            if (confirmReplace) {
                // Replace current cart
                setCart(heldTransaction.items)
                setDiscount(heldTransaction.discount)
                // Restore tax settings if available
                if (heldTransaction.taxSettings) {
                    setTaxSettings(heldTransaction.taxSettings)
                } else if (heldTransaction.taxEnabled !== undefined || heldTransaction.taxRate !== undefined) {
                    // Backward compatibility with old held transactions
                    setTaxSettings(prev => ({
                        ...prev,
                        enabled: heldTransaction.taxEnabled ?? prev.enabled,
                        rate: heldTransaction.taxRate ?? prev.rate
                    }))
                }
            } else {
                // Merge carts - properly create new objects to ensure React detects changes
                const mergedCart = []
                const processedIds = new Set()

                // First, add all current cart items, updating quantities if they match held items
                cart.forEach(cartItem => {
                    const matchingHeldItem = heldTransaction.items.find(heldItem => heldItem.product.id === cartItem.product.id)
                    if (matchingHeldItem) {
                        mergedCart.push({
                            ...cartItem,
                            quantity: cartItem.quantity + matchingHeldItem.quantity
                        })
                        processedIds.add(cartItem.product.id)
                    } else {
                        mergedCart.push(cartItem)
                    }
                })

                // Then, add held items that weren't in the current cart
                heldTransaction.items.forEach(heldItem => {
                    if (!processedIds.has(heldItem.product.id)) {
                        mergedCart.push(heldItem)
                    }
                })

                setCart(mergedCart)
                setDiscount(parseFloat(discount || 0) + parseFloat(heldTransaction.discount || 0))
            }
        } else {
            // Cart is empty, just load held transaction
            setCart(heldTransaction.items)
            setDiscount(heldTransaction.discount)
            // Restore tax settings if available
            if (heldTransaction.taxSettings) {
                setTaxSettings(heldTransaction.taxSettings)
            } else if (heldTransaction.taxEnabled !== undefined || heldTransaction.taxRate !== undefined) {
                // Backward compatibility with old held transactions
                setTaxSettings(prev => ({
                    ...prev,
                    enabled: heldTransaction.taxEnabled ?? prev.enabled,
                    rate: heldTransaction.taxRate ?? prev.rate
                }))
            }
        }

        // Remove from held transactions
        const updatedHolds = heldTransactions.filter(h => h.id !== heldId)
        setHeldTransactions(updatedHolds)
        localStorage.setItem('heldTransactions', JSON.stringify(updatedHolds))

        setShowRecallModal(false)
        toast.success("Transaction recalled successfully")
    }

    // Delete a held transaction
    const handleDeleteHeldTransaction = (heldId) => {
        if (!window.confirm("Are you sure you want to delete this held transaction?")) {
            return
        }

        const updatedHolds = heldTransactions.filter(h => h.id !== heldId)
        setHeldTransactions(updatedHolds)
        localStorage.setItem('heldTransactions', JSON.stringify(updatedHolds))
        toast.success("Held transaction deleted")
    }

    // Format time ago
    const getTimeAgo = (isoString) => {
        const now = new Date()
        const then = new Date(isoString)
        const diffMs = now - then
        const diffMins = Math.floor(diffMs / 60000)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
        const diffHours = Math.floor(diffMins / 60)
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
        const diffDays = Math.floor(diffHours / 24)
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    }

    // Search customers
    const handleCustomerSearch = async (term) => {
        setCustomerSearch(term)
        if (term.length < 2) {
            setCustomerResults([])
            return
        }

        setSearchingCustomers(true)

        try {
            const response = await customersAPI.getAll({ search: term, is_active: true })
            setCustomerResults(response.data.results || response.data)
        } catch (err) {
            toast.error("Failed to search customers")
            console.error(err)
        } finally {
            setSearchingCustomers(false)
        }
    }

    // Select customer
    const handleSelectCustomer = (customer) => {
        setSelectedCustomer(customer)
        setShowCustomerModal(false)
        setCustomerSearch("")
        setCustomerResults([])
        toast.success(`Customer ${customer.name} selected`)
    }

    // Clear customer selection
    const handleClearCustomer = () => {
        setSelectedCustomer(null)
        toast.success("Customer cleared")
    }

    // Quick add new customer
    const handleQuickAddCustomer = async (e) => {
        e.preventDefault()

        // Validate required field
        if (!newCustomerData.name.trim()) {
            toast.error("Customer name is required")
            return
        }

        setCreatingCustomer(true)
        try {
            const response = await customersAPI.post('/', newCustomerData)
            const newCustomer = response.data

            // Select the newly created customer
            setSelectedCustomer(newCustomer)

            // Reset form and close
            setNewCustomerData({ name: "", phone: "", email: "" })
            setShowQuickAddCustomer(false)
            setShowCustomerModal(false)
            setCustomerSearch("")
            setCustomerResults([])

            playSuccess()
            toast.success(`Customer ${newCustomer.name} created and selected!`)
        } catch (err) {
            console.error('Failed to create customer:', err)
            playError()
            toast.error(err.response?.data?.detail || "Failed to create customer")
        } finally {
            setCreatingCustomer(false)
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

    const PauseIcon = () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="6" y="4" width="4" height="16"></rect>
            <rect x="14" y="4" width="4" height="16"></rect>
        </svg>
    )

    const ClockIcon = () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
    )

    const LayersIcon = () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
            <polyline points="2 17 12 22 22 17"></polyline>
            <polyline points="2 12 12 17 22 12"></polyline>
        </svg>
    )

    const XIcon = () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    )

    return (
        <div className="flex min-h-screen bg-pos-bg">
            <ToastNotification />
            <Sidebar />

            {/* Success Animation */}
            <SuccessAnimation
                show={showSuccess}
                onComplete={handleSuccessComplete}
                amount={successAmount}
                currency={currency}
            />

            {/* Receipt Preview */}
            <ReceiptPreview
                show={showReceiptPreview}
                onClose={() => setShowReceiptPreview(false)}
                onConfirm={handleConfirmSale}
                cart={cart}
                subtotal={subtotal}
                taxAmount={taxAmount}
                discountAmount={discountAmount}
                total={total}
                paymentMethod={paymentMethod}
                amountPaid={amountPaid}
                change={change}
                customer={selectedCustomer}
                cashier={user}
                shop={currentShop}
                currency={currency}
                taxSettings={taxSettings}
            />

            <div className="flex-1 flex flex-col">
                {/* Header */}
                <header className="bg-white px-6 py-4 border-b border-pos-border">
                    <div className="flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-xl">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                <SearchIcon />
                            </div>
                            <input
                                ref={searchInputRef}
                                type="text"
                                className="w-full pl-10 pr-4 py-2.5 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                placeholder="Search products by name or SKU... (F1)"
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                            {searching && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="w-5 h-5 border-2 border-pos-primary border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>

                        {/* Pending Quantity Badge */}
                        {pendingQuantity && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-pos-primary text-white rounded-lg animate-quantity-pulse">
                                <span className="text-lg font-bold">{pendingQuantity}x</span>
                                <span className="text-sm">Click product to add</span>
                                <button
                                    onClick={() => setPendingQuantity(null)}
                                    className="ml-2 p-1 hover:bg-white/20 rounded"
                                    title="Cancel (Esc)"
                                >
                                    <XIcon />
                                </button>
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            {/* Keyboard Shortcuts Help */}
                            <KeyboardShortcutsHelp />

                            <div className="flex items-center gap-2 text-gray-600">
                                <UserIcon />
                                <span className="text-sm">{user?.username}</span>
                            </div>
                        </div>
                    </div>
                </header>

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

                        {/* Top Selling Products Bar */}
                        {topSellingProducts.length > 0 && (
                            <div className="mb-4 bg-gradient-to-r from-green-50 to-blue-50 p-3 rounded-xl border border-green-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                                    </svg>
                                    <h3 className="text-sm font-semibold text-green-700">
                                        Best Sellers
                                    </h3>
                                    <span className="ml-auto px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                        Top {topSellingProducts.length}
                                    </span>
                                </div>
                                <div className="grid grid-cols-5 gap-2">
                                    {topSellingProducts.map((product, index) => (
                                        <button
                                            key={product.id}
                                            onClick={() => addToCart(product)}
                                            className="relative bg-white border-2 border-green-200 rounded-lg p-3 hover:border-green-400 hover:shadow-md transition-all group"
                                            title={`${product.name} - Sold ${product.sales_metrics?.total_quantity || 0} units`}
                                        >
                                            {/* Rank Badge */}
                                            <div className="absolute -top-2 -left-2 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md">
                                                {index + 1}
                                            </div>

                                            {/* Product Info */}
                                            <div className="text-center">
                                                <p className="text-xs font-semibold text-pos-text truncate mb-1">
                                                    {product.name}
                                                </p>
                                                <p className="text-sm font-bold text-green-600">
                                                    {currency} {product.selling_price}
                                                </p>
                                                {product.sales_metrics && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {product.sales_metrics.total_quantity} sold
                                                    </p>
                                                )}
                                            </div>

                                            {/* Low stock indicator */}
                                            {product.stock_quantity <= (product.reorder_level || 10) && (
                                                <div
                                                    className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-500 rounded-full border-2 border-white flex items-center justify-center animate-pulse"
                                                    title={`Low stock - Only ${product.stock_quantity} left (reorder at ${product.reorder_level || 10})`}
                                                >
                                                    <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                                                    </svg>
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quick Favorites Section */}
                        {favorites.length > 0 && (
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                        </svg>
                                        Quick Favorites
                                    </h3>
                                    <span className="text-xs text-gray-400">{favorites.length}/8</span>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    {favorites.map(fav => (
                                        <button
                                            key={fav.id}
                                            onClick={() => addToCart(fav)}
                                            className="relative flex items-center gap-2 px-3 py-2 bg-white border border-pos-border rounded-lg hover:bg-pos-hover hover:border-pos-primary transition-colors group"
                                        >
                                            <span className="text-sm font-medium text-pos-text truncate max-w-[120px]">
                                                {fav.name}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {currency} {fav.selling_price}
                                            </span>
                                            {fav.stock_quantity <= (fav.reorder_level || 10) && (
                                                <span className="text-xs text-amber-600 font-semibold" title="Low stock">⚠️</span>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    toggleFavorite(fav)
                                                }}
                                                className="p-0.5 text-yellow-500 hover:text-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Remove from favorites"
                                            >
                                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                                </svg>
                                            </button>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Products Grid */}
                        <div className="flex-1 overflow-y-auto">
                            {searchResults.length === 0 && !searching && (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <PackageIcon />
                                    <p className="mt-4 text-sm">Select a category or search for products</p>
                                    {favorites.length === 0 && (
                                        <p className="text-xs text-gray-400 mt-2">Tip: Star products to add them to Quick Favorites</p>
                                    )}
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
                                        className={`relative bg-white rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow group ${
                                            product.is_low_stock ? 'ring-1 ring-yellow-300' : ''
                                        }`}
                                        onClick={() => addToCart(product)}
                                    >
                                        {/* Favorite Star Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                toggleFavorite(product)
                                            }}
                                            className={`absolute top-2 right-2 p-1.5 rounded-full transition-all z-10 ${
                                                isFavorite(product.id)
                                                    ? 'text-yellow-500 bg-yellow-50'
                                                    : 'text-gray-300 bg-white/80 opacity-0 group-hover:opacity-100 hover:text-yellow-500 hover:bg-yellow-50'
                                            }`}
                                            title={isFavorite(product.id) ? "Remove from favorites" : "Add to favorites"}
                                        >
                                            <svg
                                                className={`w-4 h-4 ${isFavorite(product.id) ? 'animate-star-pop' : ''}`}
                                                viewBox="0 0 24 24"
                                                fill={isFavorite(product.id) ? "currentColor" : "none"}
                                                stroke="currentColor"
                                                strokeWidth="2"
                                            >
                                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                            </svg>
                                        </button>

                                        {/* Pending Quantity Indicator */}
                                        {pendingQuantity && (
                                            <div className="absolute top-2 left-2 px-2 py-0.5 bg-pos-primary text-white text-xs font-bold rounded-full">
                                                +{pendingQuantity}
                                            </div>
                                        )}

                                        <div className="aspect-[4/3] bg-gray-50 rounded-lg flex items-center justify-center mb-3">
                                            <ImageIcon />
                                        </div>
                                        <h4 className="font-medium text-pos-text text-sm truncate">{product.name}</h4>
                                        <p className="text-xs text-gray-500 mb-2">{product.sku}</p>
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-pos-text">{currency} {product.selling_price}</span>
                                            <span className={`text-xs ${product.stock_quantity <= (product.reorder_level || 10) ? 'text-amber-600 font-semibold' : 'text-gray-500'}`}>
                                                {product.stock_quantity} in stock
                                            </span>
                                        </div>

                                        {/* Low stock indicator badge */}
                                        {product.stock_quantity <= (product.reorder_level || 10) && (
                                            <div
                                                className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-500 rounded-full border-2 border-white flex items-center justify-center"
                                                title={`Low stock - Reorder at ${product.reorder_level || 10} units`}
                                            >
                                                <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                                                </svg>
                                            </div>
                                        )}
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
                                <span className="text-sm text-gray-500">{cart.length} items</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    className="relative p-2 text-gray-600 hover:text-pos-primary hover:bg-pos-hover rounded-lg transition-colors"
                                    onClick={() => setShowRecallModal(true)}
                                    title="Recall held transaction (F5)"
                                >
                                    <LayersIcon />
                                    {heldTransactions.length > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                                            {heldTransactions.length}
                                        </span>
                                    )}
                                </button>
                                <button
                                    className="p-2 text-gray-600 hover:text-pos-primary hover:bg-pos-hover rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={() => setShowHoldModal(true)}
                                    disabled={cart.length === 0}
                                    title="Hold transaction (F4)"
                                >
                                    <PauseIcon />
                                </button>
                                <button
                                    className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={clearCart}
                                    disabled={cart.length === 0}
                                    title="Clear cart"
                                >
                                    <TrashIcon />
                                </button>
                            </div>
                        </div>

                        {/* Customer Selection */}
                        <div className="px-5 py-3 border-b border-pos-border">
                            {selectedCustomer ? (
                                <div className="flex items-center justify-between p-3 bg-pos-hover rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <UserIcon />
                                        <div>
                                            <p className="text-sm font-medium text-pos-text">{selectedCustomer.name}</p>
                                            {selectedCustomer.phone && (
                                                <p className="text-xs text-gray-500">{selectedCustomer.phone}</p>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        className="text-xs text-red-600 hover:text-red-700 font-medium"
                                        onClick={handleClearCustomer}
                                    >
                                        Remove
                                    </button>
                                </div>
                            ) : (
                                <button
                                    className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-pos-primary hover:text-pos-primary transition-colors"
                                    onClick={() => setShowCustomerModal(true)}
                                >
                                    <UserIcon />
                                    <span className="text-sm font-medium">Add Customer (Optional)</span>
                                </button>
                            )}
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
                                    {cart.map(item => {
                                        const itemTotal = (item.quantity * item.unit_price) - (item.discount || 0)
                                        return (
                                            <div key={item.product.id} className="p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-medium text-pos-text text-sm truncate">{item.product.name}</h4>
                                                        <p className="text-sm text-gray-500">{currency} {item.unit_price.toFixed(2)} x {item.quantity}</p>
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
                                                            {currency} {itemTotal.toFixed(2)}
                                                        </span>
                                                        <button
                                                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                                            onClick={() => removeFromCart(item.product.id)}
                                                        >
                                                            <TrashIcon />
                                                        </button>
                                                    </div>
                                                </div>
                                                {/* Item Discount */}
                                                <div className="mt-2 flex items-center justify-between text-xs">
                                                    <span className="text-gray-500">Item Discount:</span>
                                                    <div className="flex items-center bg-white rounded border border-gray-300 overflow-hidden">
                                                        <span className="px-2 text-gray-500">KSh</span>
                                                        <input
                                                            type="number"
                                                            value={item.discount || ''}
                                                            onChange={(e) => updateItemDiscount(item.product.id, e.target.value)}
                                                            placeholder="0.00"
                                                            min="0"
                                                            max={item.quantity * item.unit_price}
                                                            step="0.01"
                                                            className="w-16 py-1 pr-1 text-xs text-right bg-transparent focus:outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Cart Summary */}
                                <div className="border-t border-pos-border p-4 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="text-pos-text">{currency} {subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">Discount</span>
                                        <div className="flex items-center bg-gray-50 rounded-lg border border-pos-border overflow-hidden">
                                            <span className="px-2 text-gray-500 text-sm">{currency}</span>
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
                                    {/* Tax */}
                                    <div className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-2">
                                            <label className="flex items-center gap-1.5 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={taxEnabled}
                                                    onChange={(e) => setTaxSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                                                    className="w-3.5 h-3.5 rounded border-gray-300 accent-[#211A20] focus:ring-pos-primary/20"
                                                />
                                                <span className="text-gray-600">Tax ({taxName} {taxRate}%)</span>
                                            </label>
                                        </div>
                                        <span className="text-pos-text">{currency} {taxAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-base font-semibold pt-2 border-t border-pos-border">
                                        <span className="text-pos-text">Total</span>
                                        <span className="text-pos-text">{currency} {total.toFixed(2)}</span>
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
                                            title="Cash payment (F2)"
                                        >
                                            <CashIcon />
                                            Cash
                                            <kbd className={`ml-1 px-1 py-0.5 text-xs rounded ${
                                                paymentMethod === 'cash' ? 'bg-white/20' : 'bg-gray-200'
                                            }`}>F2</kbd>
                                        </button>
                                        <button
                                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                                paymentMethod === 'mpesa'
                                                    ? 'bg-pos-primary text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                            onClick={() => setPaymentMethod('mpesa')}
                                            title="M-Pesa payment (F3)"
                                        >
                                            <PhoneIcon />
                                            M-Pesa
                                            <kbd className={`ml-1 px-1 py-0.5 text-xs rounded ${
                                                paymentMethod === 'mpesa' ? 'bg-white/20' : 'bg-gray-200'
                                            }`}>F3</kbd>
                                        </button>
                                    </div>

                                    {paymentMethod === 'cash' && (
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-sm text-gray-600 mb-1">Amount Received (F2)</label>
                                                <div className="flex items-center bg-gray-50 rounded-lg border border-pos-border overflow-hidden">
                                                    <span className="px-3 text-gray-500">{currency}</span>
                                                    <input
                                                        ref={amountInputRef}
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
                                                <div className={`flex justify-between items-center p-3 rounded-lg ${
                                                    change > 0
                                                        ? 'bg-amber-50 border border-amber-200'
                                                        : 'bg-green-50'
                                                }`}>
                                                    <span className={`text-sm ${change > 0 ? 'text-amber-700' : 'text-green-700'}`}>
                                                        {change > 0 ? 'Change Due' : 'Exact Amount'}
                                                    </span>
                                                    <span className={`font-semibold ${change > 0 ? 'text-amber-700' : 'text-green-700'}`}>
                                                        {currency} {change.toFixed(2)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {paymentMethod === 'mpesa' && (
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">M-Pesa Reference Code (F3)</label>
                                            <input
                                                ref={mpesaInputRef}
                                                type="text"
                                                className="w-full px-3 py-2.5 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                                value={mpesaReference}
                                                onChange={(e) => setMpesaReference(e.target.value.toUpperCase())}
                                                placeholder="e.g., QH12ABC34D"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Checkout Buttons */}
                                <div className="p-4 pt-0 space-y-2">
                                    <button
                                        className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-pos-primary text-pos-primary rounded-lg font-medium hover:bg-pos-primary hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={() => setShowSplitPayment(true)}
                                        disabled={processing || cart.length === 0}
                                    >
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                                            <line x1="2" y1="10" x2="22" y2="10"></line>
                                        </svg>
                                        Split Payment
                                    </button>
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
                                                Complete Sale - {currency} {total.toFixed(2)}
                                                <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-white/20 rounded">Enter</kbd>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </main>

                {/* Hold Modal */}
                {showHoldModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowHoldModal(false)}>
                        <div className="bg-white rounded-xl p-6 w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-pos-text">Hold Transaction</h3>
                                <button
                                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                                    onClick={() => setShowHoldModal(false)}
                                >
                                    <XIcon />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-2">
                                        Note (optional) - e.g., customer name or reason
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                        placeholder="John - went to ATM"
                                        value={holdNote}
                                        onChange={(e) => setHoldNote(e.target.value)}
                                        maxLength={50}
                                    />
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                                    <div className="text-sm text-gray-600">Items: {cart.length}</div>
                                    <div className="text-sm text-gray-600">Subtotal: {currency} {subtotal.toFixed(2)}</div>
                                    {discountAmount > 0 && (
                                        <div className="text-sm text-gray-600">Discount: -{currency} {discountAmount.toFixed(2)}</div>
                                    )}
                                    {taxEnabled && taxAmount > 0 && (
                                        <div className="text-sm text-gray-600">{taxName} ({taxRate}%): {currency} {taxAmount.toFixed(2)}</div>
                                    )}
                                    <div className="text-sm font-medium text-pos-text pt-1 border-t border-gray-200">Total: {currency} {total.toFixed(2)}</div>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        className="flex-1 px-4 py-2 border border-pos-border text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                                        onClick={() => {
                                            setShowHoldModal(false)
                                            setHoldNote("")
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="flex-1 px-4 py-2 bg-pos-primary text-white rounded-lg hover:bg-pos-text transition-colors"
                                        onClick={handleHoldTransaction}
                                    >
                                        Hold
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Recall Modal */}
                {showRecallModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowRecallModal(false)}>
                        <div className="bg-white rounded-xl w-full max-w-2xl m-4 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between p-6 border-b border-pos-border">
                                <h3 className="text-lg font-semibold text-pos-text">Held Transactions</h3>
                                <button
                                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                                    onClick={() => setShowRecallModal(false)}
                                >
                                    <XIcon />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6">
                                {heldTransactions.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
                                        <LayersIcon />
                                        <p className="mt-4 text-sm">No held transactions</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {heldTransactions.map(held => {
                                            const heldSubtotal = held.items.reduce((sum, item) => sum + ((item.quantity * item.unit_price) - (item.discount || 0)), 0)
                                            const heldDiscount = parseFloat(held.discount) || 0
                                            const heldTaxable = Math.max(heldSubtotal - heldDiscount, 0)
                                            const heldTaxAmount = held.taxEnabled ? (heldTaxable * (held.taxRate || 16)) / 100 : 0
                                            const heldTotal = heldTaxable + heldTaxAmount

                                            return (
                                                <div key={held.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <ClockIcon />
                                                                <span className="text-sm text-gray-500">{getTimeAgo(held.holdTime)}</span>
                                                            </div>
                                                            {held.holdNote && (
                                                                <p className="text-sm font-medium text-pos-text mb-1">{held.holdNote}</p>
                                                            )}
                                                            <p className="text-xs text-gray-500">by {held.cashierName}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm text-gray-600">{held.items.length} items</p>
                                                            {held.taxEnabled && heldTaxAmount > 0 && (
                                                                <p className="text-xs text-gray-500">incl. {held.taxSettings?.name || taxName} {held.taxRate || taxRate}%</p>
                                                            )}
                                                            <p className="text-base font-semibold text-pos-text">{currency} {heldTotal.toFixed(2)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            className="flex-1 px-4 py-2 bg-pos-primary text-white rounded-lg hover:bg-pos-text transition-colors text-sm font-medium"
                                                            onClick={() => handleRecallTransaction(held.id)}
                                                        >
                                                            Recall
                                                        </button>
                                                        <button
                                                            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                                                            onClick={() => handleDeleteHeldTransaction(held.id)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Customer Selection Modal */}
                {showCustomerModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => {
                        setShowCustomerModal(false)
                        setShowQuickAddCustomer(false)
                        setNewCustomerData({ name: "", phone: "", email: "" })
                    }}>
                        <div className="bg-white rounded-xl w-full max-w-lg m-4 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between p-6 border-b border-pos-border">
                                <h3 className="text-lg font-semibold text-pos-text">
                                    {showQuickAddCustomer ? 'Add New Customer' : 'Select Customer'}
                                </h3>
                                <button
                                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                                    onClick={() => {
                                        setShowCustomerModal(false)
                                        setShowQuickAddCustomer(false)
                                        setNewCustomerData({ name: "", phone: "", email: "" })
                                    }}
                                >
                                    <XIcon />
                                </button>
                            </div>

                            {!showQuickAddCustomer ? (
                                <>
                                    {/* Search Input */}
                                    <div className="p-6 border-b border-pos-border">
                                        <div className="relative">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                                <SearchIcon />
                                            </div>
                                            <input
                                                type="text"
                                                className="w-full pl-10 pr-4 py-2.5 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                                placeholder="Search by name, email, or phone..."
                                                value={customerSearch}
                                                onChange={(e) => handleCustomerSearch(e.target.value)}
                                                autoFocus
                                            />
                                            {searchingCustomers && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <div className="w-5 h-5 border-2 border-pos-primary border-t-transparent rounded-full animate-spin"></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Add New Customer Button */}
                                    <div className="px-6 pt-4">
                                        <button
                                            onClick={() => setShowQuickAddCustomer(true)}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-pos-primary to-pos-text text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                                        >
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                                                <circle cx="9" cy="7" r="4"></circle>
                                                <line x1="20" y1="8" x2="20" y2="14"></line>
                                                <line x1="23" y1="11" x2="17" y2="11"></line>
                                            </svg>
                                            Add New Customer
                                        </button>
                                    </div>

                                    {/* Customer Results */}
                                    <div className="flex-1 overflow-y-auto p-6">
                                        {customerSearch.length < 2 ? (
                                            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
                                                <UserIcon />
                                                <p className="mt-4 text-sm">Type to search for customers</p>
                                            </div>
                                        ) : searchingCustomers ? (
                                            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
                                                <div className="w-8 h-8 border-2 border-pos-primary border-t-transparent rounded-full animate-spin"></div>
                                                <p className="mt-4 text-sm">Searching...</p>
                                            </div>
                                        ) : customerResults.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
                                                <UserIcon />
                                                <p className="mt-4 text-sm">No customers found</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {customerResults.map(customer => (
                                                    <div
                                                        key={customer.id}
                                                        className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                                                        onClick={() => handleSelectCustomer(customer)}
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <p className="font-medium text-pos-text">{customer.name}</p>
                                                                {customer.email && (
                                                                    <p className="text-sm text-gray-600 mt-1">{customer.email}</p>
                                                                )}
                                                                {customer.phone && (
                                                                    <p className="text-sm text-gray-600 mt-1">{customer.phone}</p>
                                                                )}
                                                            </div>
                                                            <div className="text-right text-xs text-gray-500">
                                                                <p>{customer.total_transactions} sales</p>
                                                                <p className="mt-1">{currency} {parseFloat(customer.total_purchases || 0).toFixed(2)}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                /* Quick Add Customer Form */
                                <div className="p-6">
                                    <form onSubmit={handleQuickAddCustomer} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={newCustomerData.name}
                                                onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                                placeholder="Enter customer name"
                                                autoFocus
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Phone
                                            </label>
                                            <input
                                                type="tel"
                                                value={newCustomerData.phone}
                                                onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                                placeholder="Enter phone number"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                value={newCustomerData.email}
                                                onChange={(e) => setNewCustomerData({ ...newCustomerData, email: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                                placeholder="Enter email address"
                                            />
                                        </div>

                                        <div className="flex gap-3 pt-4">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowQuickAddCustomer(false)
                                                    setNewCustomerData({ name: "", phone: "", email: "" })
                                                }}
                                                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                                disabled={creatingCustomer}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={creatingCustomer || !newCustomerData.name.trim()}
                                                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-pos-primary to-pos-text text-white rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {creatingCustomer ? (
                                                    <>
                                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                        Creating...
                                                    </>
                                                ) : (
                                                    'Save & Select'
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Split Payment Modal */}
                {showSplitPayment && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSplitPayment(false)}>
                        <div className="bg-white rounded-xl p-6 w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-pos-text">Split Payment</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Total Amount: {currency} {total.toFixed(2)}
                                        {taxEnabled && taxAmount > 0 && (
                                            <span className="text-gray-500"> (incl. {taxName} {taxRate}%: {currency} {taxAmount.toFixed(2)})</span>
                                        )}
                                    </p>
                                </div>
                                <button
                                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                                    onClick={() => setShowSplitPayment(false)}
                                >
                                    <XIcon />
                                </button>
                            </div>

                            {/* Payment Summary */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-600 font-medium mb-1">Total {taxEnabled && taxAmount > 0 && `(incl. ${taxName})`}</p>
                                    <p className="text-xl font-bold text-gray-900">{currency} {total.toFixed(2)}</p>
                                </div>
                                <div className="bg-green-50 rounded-lg p-4">
                                    <p className="text-sm text-green-600 font-medium mb-1">Paid</p>
                                    <p className="text-xl font-bold text-green-900">
                                        {currency} {splitPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0).toFixed(2)}
                                    </p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-600 font-medium mb-1">Remaining</p>
                                    <p className="text-xl font-bold text-gray-900">
                                        {currency} {(total - splitPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0)).toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            {/* Payment List */}
                            {splitPayments.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Payments Added</h4>
                                    <div className="space-y-2">
                                        {splitPayments.map((payment, index) => (
                                            <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900">
                                                        {payment.method === 'cash' ? 'Cash' : 'M-Pesa'}
                                                    </p>
                                                    {payment.reference && (
                                                        <p className="text-sm text-gray-600">Ref: {payment.reference}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <p className="font-semibold text-gray-900">{currency} {parseFloat(payment.amount).toFixed(2)}</p>
                                                    <button
                                                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                                                        onClick={() => handleRemovePayment(index)}
                                                    >
                                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M18 6L6 18M6 6l12 12"></path>
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Add Payment Form */}
                            {parseFloat(splitPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0).toFixed(2)) < total - 0.01 && (
                                <div className="border border-gray-200 rounded-lg p-4 mb-6">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-4">Add Payment</h4>

                                    {/* Payment Method */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                className={`py-2.5 px-4 rounded-lg border-2 font-medium transition-colors ${
                                                    currentPayment.method === 'cash'
                                                        ? 'border-pos-primary bg-pos-primary text-white'
                                                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                                                }`}
                                                onClick={() => setCurrentPayment({ ...currentPayment, method: 'cash', reference: '' })}
                                            >
                                                Cash
                                            </button>
                                            <button
                                                className={`py-2.5 px-4 rounded-lg border-2 font-medium transition-colors ${
                                                    currentPayment.method === 'mpesa'
                                                        ? 'border-pos-primary bg-pos-primary text-white'
                                                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                                                }`}
                                                onClick={() => setCurrentPayment({ ...currentPayment, method: 'mpesa' })}
                                            >
                                                M-Pesa
                                            </button>
                                        </div>
                                    </div>

                                    {/* Amount */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                                        <input
                                            type="number"
                                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                            value={currentPayment.amount}
                                            onChange={(e) => setCurrentPayment({ ...currentPayment, amount: e.target.value })}
                                            placeholder="0.00"
                                            step="0.01"
                                            min="0"
                                        />
                                    </div>

                                    {/* M-Pesa Reference */}
                                    {currentPayment.method === 'mpesa' && (
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">M-Pesa Reference</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                                value={currentPayment.reference}
                                                onChange={(e) => setCurrentPayment({ ...currentPayment, reference: e.target.value.toUpperCase() })}
                                                placeholder="e.g., QH12ABC34D"
                                            />
                                        </div>
                                    )}

                                    <button
                                        className="w-full py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                                        onClick={handleAddPayment}
                                    >
                                        Add Payment
                                    </button>
                                </div>
                            )}

                            {/* Complete Button */}
                            <div className="flex gap-3">
                                <button
                                    className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                    onClick={() => {
                                        setShowSplitPayment(false)
                                        setSplitPayments([])
                                        setCurrentPayment({ method: 'cash', amount: '', reference: '' })
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="flex-1 py-3 bg-pos-primary text-white rounded-lg font-medium hover:bg-pos-text/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={handleCompleteSplitPayment}
                                    disabled={processing || splitPayments.length === 0 || parseFloat(splitPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0).toFixed(2)) < total - 0.01}
                                >
                                    {processing ? 'Processing...' : 'Complete Transaction'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Sales
