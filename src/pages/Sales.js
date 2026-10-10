import { useState, useEffect, useRef } from "react"
import { useAuth } from "../context/AuthContext"
import { productsAPI, salesAPI, customersAPI } from "../api/api"
import Sidebar from "../components/Sidebar"
import ToastNotification, { toast } from '../components/ToastNotification'
import SuccessAnimation from '../components/SuccessAnimation'
import ReceiptPreview from '../components/ReceiptPreview'
import useSoundEffects from '../hooks/useSoundEffects'

const defaultTaxSettings = { enabled: true, rate: 16, name: 'VAT', includeInPrice: false, showOnReceipt: true, taxNumber: '' }

const TILE_COLORS = ['#14373b', '#ed8674', '#2f7a5f', '#8a5a44', '#4a5568', '#b45309']
const tileColor = (id) => TILE_COLORS[Math.abs(String(id).split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % TILE_COLORS.length]
const abbr = (name) => (name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase().slice(0, 2)

function Sales() {
    const { user, currentShop } = useAuth()
    const [categories, setCategories] = useState([])
    const [selectedCategory, setSelectedCategory] = useState('all')
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
    const [paymentMethod, setPaymentMethod] = useState("mpesa")
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
    const [showDiscountRow, setShowDiscountRow] = useState(false)
    const [editingItemDiscount, setEditingItemDiscount] = useState(null)

    const [pendingQuantity, setPendingQuantity] = useState(null)
    const [showSuccess, setShowSuccess] = useState(false)
    const [successAmount, setSuccessAmount] = useState(0)
    const [favorites, setFavorites] = useState(() => {
        const saved = localStorage.getItem('pos_favorites')
        return saved ? JSON.parse(saved) : []
    })
    const [topSellingProducts, setTopSellingProducts] = useState([])
    const [showReceiptPreview, setShowReceiptPreview] = useState(false)
    const searchInputRef = useRef(null)
    const amountInputRef = useRef(null)
    const mpesaInputRef = useRef(null)
    const amountClickTimerRef = useRef(null)
    const [amountButtonClicks, setAmountButtonClicks] = useState({})

    const { playAddItem, playSuccess, playError, playRemoveItem, playHold } = useSoundEffects()

    const [taxSettings, setTaxSettings] = useState(() => {
        const saved = localStorage.getItem('pos_taxSettings')
        return saved ? { ...defaultTaxSettings, ...JSON.parse(saved) } : defaultTaxSettings
    })
    const taxRate = taxSettings.rate
    const taxEnabled = taxSettings.enabled
    const taxName = taxSettings.name || 'VAT'
    const currency = currentShop?.currency || 'KSh'

    useEffect(() => {
        const savedHolds = localStorage.getItem('heldTransactions')
        if (savedHolds) {
            try { setHeldTransactions(JSON.parse(savedHolds)) }
            catch (err) { localStorage.removeItem('heldTransactions') }
        }
    }, [])

    useEffect(() => { localStorage.setItem('pos_cart', JSON.stringify(cart)) }, [cart])
    useEffect(() => { localStorage.setItem('pos_discount', discount.toString()) }, [discount])
    useEffect(() => {
        if (selectedCustomer) localStorage.setItem('pos_customer', JSON.stringify(selectedCustomer))
        else localStorage.removeItem('pos_customer')
    }, [selectedCustomer])

    useEffect(() => {
        if (currentShop?.tax_settings) {
            const shopTaxSettings = { ...defaultTaxSettings, ...currentShop.tax_settings }
            setTaxSettings(shopTaxSettings)
            localStorage.setItem('pos_taxSettings', JSON.stringify(shopTaxSettings))
            localStorage.setItem('pos_taxRate', shopTaxSettings.rate.toString())
            localStorage.setItem('pos_taxEnabled', JSON.stringify(shopTaxSettings.enabled))
        }
    }, [currentShop])

    useEffect(() => {
        const fetchTopSelling = async () => {
            try {
                const response = await productsAPI.getAll({ ordering: '-created_at', page_size: 5 })
                const data = response.data.results || response.data
                setTopSellingProducts((Array.isArray(data) ? data : []).slice(0, 5))
            } catch (err) { /* non-critical */ }
        }
        if (currentShop) fetchTopSelling()
    }, [currentShop])

    useEffect(() => { fetchCategories() }, [])
    useEffect(() => { localStorage.setItem('pos_favorites', JSON.stringify(favorites)) }, [favorites])

    useEffect(() => {
        const handleKeyDown = (e) => {
            const isInputFocused = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)
            const isModalOpen = showHoldModal || showRecallModal || showCustomerModal || showSplitPayment

            if (!isInputFocused && !isModalOpen && /^[0-9]$/.test(e.key)) {
                e.preventDefault()
                setPendingQuantity((prev) => Math.min(prev ? parseInt(`${prev}${e.key}`) : parseInt(e.key), 999))
                return
            }
            if (e.key === 'Escape') {
                if (pendingQuantity) { setPendingQuantity(null); return }
                if (showHoldModal) setShowHoldModal(false)
                if (showRecallModal) setShowRecallModal(false)
                if (showCustomerModal) setShowCustomerModal(false)
                if (showSplitPayment) setShowSplitPayment(false)
                if (searchTerm) { setSearchTerm(""); setSearchResults([]) }
                return
            }
            if (isModalOpen) return
            if (e.key === 'F1') { e.preventDefault(); searchInputRef.current?.focus(); return }
            if (e.key === 'F2') { e.preventDefault(); setPaymentMethod('cash'); setTimeout(() => amountInputRef.current?.focus(), 50); return }
            if (e.key === 'F3') { e.preventDefault(); setPaymentMethod('mpesa'); setTimeout(() => mpesaInputRef.current?.focus(), 50); return }
            if (e.key === 'F4') { e.preventDefault(); if (cart.length > 0) setShowHoldModal(true); return }
            if (e.key === 'F5') { e.preventDefault(); setShowRecallModal(true); return }
            if ((e.key === 'Enter' || e.key === 'F9') && cart.length > 0 && !processing) {
                const activeEl = document.activeElement
                const isPaymentInput = activeEl === amountInputRef.current || activeEl === mpesaInputRef.current
                if (e.key === 'F9' || !isInputFocused || isPaymentInput) { e.preventDefault(); handleCheckout(); return }
            }
            if ((e.key === '+' || e.key === '=') && !isInputFocused && cart.length > 0) {
                e.preventDefault(); const last = cart[cart.length - 1]; updateQuantity(last.product.id, last.quantity + 1); return
            }
            if (e.key === '-' && !isInputFocused && cart.length > 0) {
                e.preventDefault(); const last = cart[cart.length - 1]; updateQuantity(last.product.id, last.quantity - 1); return
            }
            if (e.key === 'Delete' && !isInputFocused && cart.length > 0) {
                e.preventDefault(); removeFromCart(cart[cart.length - 1].product.id); return
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cart, processing, showHoldModal, showRecallModal, showCustomerModal, showSplitPayment, pendingQuantity, searchTerm])

    const fetchCategories = async () => {
        try {
            const response = await productsAPI.getCategories()
            const data = response.data.results || response.data
            setCategories(Array.isArray(data) ? data : [])
        } catch (err) { setCategories([]) }
    }

    const handleSearch = async (term, categoryId) => {
        setSearchTerm(term)
        if (term.length < 2 && !categoryId) { setSearchResults([]); return }
        setSearching(true)
        try {
            const params = {}
            if (term.length >= 2) params.search = term
            if (categoryId) params.category = categoryId
            const response = await productsAPI.getAll(params)
            setSearchResults(response.data.results || response.data)
        } catch (err) {
            toast.error("Failed to search products")
        } finally {
            setSearching(false)
        }
    }

    const handleCategoryClick = (categoryId) => {
        setSelectedCategory(categoryId)
        setSearchTerm("")
        if (categoryId === 'all') { setSearchResults([]); return }
        if (categoryId === 'fav' || categoryId === 'top') return
        handleSearch("", categoryId)
    }

    const displayedProducts = selectedCategory === 'fav' ? favorites
        : selectedCategory === 'top' ? topSellingProducts
        : searchResults

    const addToCart = (product) => {
        const quantityToAdd = pendingQuantity || 1
        const existingItem = cart.find((item) => item.product.id === product.id)
        const currentQty = existingItem ? existingItem.quantity : 0
        if (currentQty + quantityToAdd > product.stock_quantity) {
            toast.error(`Only ${product.stock_quantity} units available for ${product.name}`)
            playError(); setPendingQuantity(null); return
        }
        const remainingStock = product.stock_quantity - (currentQty + quantityToAdd)
        const reorderLevel = product.reorder_level || 10
        if (remainingStock <= reorderLevel && remainingStock > 0) {
            toast(`Low stock: only ${remainingStock} units left for ${product.name}`, { icon: '⚠️' })
        } else if (remainingStock === 0) {
            toast(`Last unit! ${product.name} is now out of stock`, { icon: '⚠️' })
        }
        if (existingItem) updateQuantity(product.id, existingItem.quantity + quantityToAdd)
        else setCart([...cart, { product, quantity: quantityToAdd, unit_price: parseFloat(product.selling_price), discount: 0 }])
        playAddItem(); setPendingQuantity(null); setSearchTerm(""); setSearchResults([])
    }

    const toggleFavorite = (product) => {
        setFavorites((prev) => {
            const exists = prev.find((f) => f.id === product.id)
            if (exists) return prev.filter((f) => f.id !== product.id)
            if (prev.length >= 8) { toast.error("Maximum 8 favorites allowed. Remove one first."); return prev }
            return [...prev, {
                id: product.id, name: product.name, selling_price: product.selling_price,
                stock_quantity: product.stock_quantity, reorder_level: product.reorder_level || 10, sku: product.sku
            }]
        })
    }
    const isFavorite = (productId) => favorites.some((f) => f.id === productId)

    const updateQuantity = (productId, newQuantity) => {
        const product = cart.find((item) => item.product.id === productId)?.product
        if (!product) return
        if (newQuantity > product.stock_quantity) { toast.error(`Only ${product.stock_quantity} units available`); return }
        if (newQuantity < 1) { removeFromCart(productId); return }
        setCart(cart.map((item) => item.product.id === productId ? { ...item, quantity: newQuantity } : item))
    }

    const removeFromCart = (productId) => { setCart(cart.filter((item) => item.product.id !== productId)); playRemoveItem() }

    const clearCart = () => {
        if (cart.length === 0) return
        if (window.confirm('Are you sure you want to clear all items from the cart?')) {
            setCart([]); setDiscount(0); toast.success('Cart cleared')
        }
    }

    const updateItemDiscount = (productId, discountValue) => {
        const discountAmount = parseFloat(discountValue) || 0
        const item = cart.find((item) => item.product.id === productId)
        if (!item) return
        const itemTotal = item.quantity * item.unit_price
        if (discountAmount > itemTotal) { toast.error("Discount cannot exceed item total"); return }
        setCart(cart.map((item) => item.product.id === productId ? { ...item, discount: discountAmount } : item))
    }

    const subtotal = cart.reduce((sum, item) => sum + ((item.quantity * item.unit_price) - (item.discount || 0)), 0)
    const discountAmount = parseFloat(discount) || 0
    const taxableAmount = Math.max(subtotal - discountAmount, 0)
    const taxAmount = taxEnabled ? (taxableAmount * taxRate) / 100 : 0
    const total = taxableAmount + taxAmount
    const change = paymentMethod === "cash" && amountPaid ? Math.max(parseFloat(amountPaid) - total, 0) : 0
    const itemCount = cart.reduce((s, i) => s + i.quantity, 0)

    const handleCheckout = () => {
        if (cart.length === 0) { toast.error("Cart is empty"); return }
        if (paymentMethod === "cash" && (!amountPaid || parseFloat(amountPaid) < total)) { toast.error("Amount paid is less than total"); return }
        setShowReceiptPreview(true)
    }

    const handleConfirmSale = async () => {
        setShowReceiptPreview(false)
        setProcessing(true)
        try {
            const transactionData = {
                cashier: user.id,
                customer: selectedCustomer?.id || null,
                items: cart.map((item) => ({
                    product: item.product.id, quantity: item.quantity,
                    unit_price: item.unit_price.toString(), discount: (item.discount || 0).toFixed(2)
                })),
                subtotal: subtotal.toFixed(2), tax: taxAmount.toFixed(2), discount: discountAmount.toFixed(2), total: total.toFixed(2),
                payment_method: paymentMethod,
                mpesa_reference: paymentMethod === "mpesa" ? mpesaReference : null,
                amount_paid: paymentMethod === "cash" ? parseFloat(amountPaid).toFixed(2) : total.toFixed(2),
                change_amount: paymentMethod === "cash" ? change.toFixed(2) : "0.00",
                status: "completed"
            }
            await salesAPI.createTransaction(transactionData)
            setSuccessAmount(total); setShowSuccess(true); playSuccess()
            setCart([]); setDiscount(0); setPaymentMethod("mpesa"); setMpesaReference(""); setAmountPaid(""); setSelectedCustomer(null)
        } catch (err) {
            toast.error(err.response?.data?.items || err.response?.data?.detail || "Failed to complete transaction")
            playError()
        } finally {
            setProcessing(false)
        }
    }

    const handleSuccessComplete = () => { setShowSuccess(false); setSuccessAmount(0) }

    const handleQuickAmount = (baseAmount) => {
        if (amountClickTimerRef.current) clearTimeout(amountClickTimerRef.current)
        const newClicks = (amountButtonClicks[baseAmount] || 0) + 1
        setAmountButtonClicks({ ...amountButtonClicks, [baseAmount]: newClicks })
        setAmountPaid((baseAmount * newClicks).toString())
        amountClickTimerRef.current = setTimeout(() => setAmountButtonClicks({}), 1000)
    }

    const handleAddPayment = () => {
        let paymentAmount = parseFloat(currentPayment.amount)
        if (!paymentAmount || paymentAmount <= 0) { toast.error("Please enter a valid amount"); return }
        if (currentPayment.method === "mpesa") {
            paymentAmount = Math.ceil(paymentAmount)
        }
        setSplitPayments([...splitPayments, { method: currentPayment.method, amount: paymentAmount, reference: currentPayment.reference }])
        setCurrentPayment({ method: "cash", amount: "", reference: "" })
    }
    const handleRemovePayment = (index) => setSplitPayments(splitPayments.filter((_, i) => i !== index))

    const handleCompleteSplitPayment = async () => {
        if (splitPayments.length === 0) { toast.error("Please add at least one payment method"); return }
        const totalPaid = parseFloat(splitPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0).toFixed(2))
        if (totalPaid < total - 0.01) { toast.error(`Incomplete payment. Remaining: ${currency} ${(total - totalPaid).toFixed(2)}`); return }
        setProcessing(true)
        try {
            const transactionData = {
                cashier: user.id, customer: selectedCustomer?.id || null,
                items: cart.map((item) => ({
                    product: item.product.id, quantity: item.quantity,
                    unit_price: item.unit_price.toString(), discount: (item.discount || 0).toFixed(2)
                })),
                subtotal: subtotal.toFixed(2), tax: taxAmount.toFixed(2), discount: discountAmount.toFixed(2), total: total.toFixed(2),
                payment_method: "split", amount_paid: totalPaid.toFixed(2), change_amount: (totalPaid - total).toFixed(2),
                payment_details: splitPayments, status: "completed"
            }
            const response = await salesAPI.createTransaction(transactionData)
            toast.success(`Transaction completed! ID: ${response.data.transaction_id}`)
            setCart([]); setDiscount(0); setPaymentMethod("mpesa"); setMpesaReference(""); setAmountPaid(""); setSelectedCustomer(null)
            setSplitPayments([]); setCurrentPayment({ method: "cash", amount: "", reference: "" }); setShowSplitPayment(false)
        } catch (err) {
            toast.error(err.response?.data?.items || err.response?.data?.detail || "Failed to complete transaction")
        } finally {
            setProcessing(false)
        }
    }

    const handleHoldTransaction = () => {
        if (cart.length === 0) { toast.error("Cannot hold an empty cart"); return }
        if (heldTransactions.length >= 10) { toast.error("Maximum 10 held transactions. Please recall or clear some first."); return }
        const heldTransaction = {
            id: Date.now().toString(), items: cart, discount, taxSettings,
            taxEnabled: taxSettings.enabled, taxRate: taxSettings.rate,
            holdTime: new Date().toISOString(), holdNote: holdNote.trim(), cashierId: user.id, cashierName: user.username
        }
        const updatedHolds = [...heldTransactions, heldTransaction]
        setHeldTransactions(updatedHolds)
        localStorage.setItem('heldTransactions', JSON.stringify(updatedHolds))
        setCart([]); setDiscount(0); setHoldNote(""); setShowHoldModal(false); playHold()
        toast.success(`Transaction held ${holdNote ? `- ${holdNote}` : ''}`)
    }

    const handleRecallTransaction = (heldId) => {
        const heldTransaction = heldTransactions.find((h) => h.id === heldId)
        if (!heldTransaction) return
        const applyTax = () => {
            if (heldTransaction.taxSettings) setTaxSettings(heldTransaction.taxSettings)
            else if (heldTransaction.taxEnabled !== undefined || heldTransaction.taxRate !== undefined) {
                setTaxSettings((prev) => ({ ...prev, enabled: heldTransaction.taxEnabled ?? prev.enabled, rate: heldTransaction.taxRate ?? prev.rate }))
            }
        }
        if (cart.length > 0) {
            const confirmReplace = window.confirm("You have items in the current cart. Click OK to replace with held transaction, or Cancel to merge.")
            if (confirmReplace) {
                setCart(heldTransaction.items); setDiscount(heldTransaction.discount); applyTax()
            } else {
                const mergedCart = []
                const processedIds = new Set()
                cart.forEach((cartItem) => {
                    const match = heldTransaction.items.find((h) => h.product.id === cartItem.product.id)
                    if (match) { mergedCart.push({ ...cartItem, quantity: cartItem.quantity + match.quantity }); processedIds.add(cartItem.product.id) }
                    else mergedCart.push(cartItem)
                })
                heldTransaction.items.forEach((h) => { if (!processedIds.has(h.product.id)) mergedCart.push(h) })
                setCart(mergedCart)
                setDiscount(parseFloat(discount || 0) + parseFloat(heldTransaction.discount || 0))
            }
        } else {
            setCart(heldTransaction.items); setDiscount(heldTransaction.discount); applyTax()
        }
        const updatedHolds = heldTransactions.filter((h) => h.id !== heldId)
        setHeldTransactions(updatedHolds)
        localStorage.setItem('heldTransactions', JSON.stringify(updatedHolds))
        setShowRecallModal(false)
        toast.success("Transaction recalled")
    }

    const handleDeleteHeldTransaction = (heldId) => {
        if (!window.confirm("Delete this held transaction?")) return
        const updatedHolds = heldTransactions.filter((h) => h.id !== heldId)
        setHeldTransactions(updatedHolds)
        localStorage.setItem('heldTransactions', JSON.stringify(updatedHolds))
        toast.success("Held transaction deleted")
    }

    const getTimeAgo = (isoString) => {
        const diffMins = Math.floor((new Date() - new Date(isoString)) / 60000)
        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
        const diffHours = Math.floor(diffMins / 60)
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
        return `${Math.floor(diffHours / 24)} day(s) ago`
    }

    const handleCustomerSearch = async (term) => {
        setCustomerSearch(term)
        if (term.length < 2) { setCustomerResults([]); return }
        setSearchingCustomers(true)
        try {
            const response = await customersAPI.getAll({ search: term, is_active: true })
            setCustomerResults(response.data.results || response.data)
        } catch (err) {
            toast.error("Failed to search customers")
        } finally {
            setSearchingCustomers(false)
        }
    }

    const handleSelectCustomer = (customer) => {
        setSelectedCustomer(customer); setShowCustomerModal(false); setCustomerSearch(""); setCustomerResults([])
        toast.success(`Customer ${customer.name} selected`)
    }
    const handleClearCustomer = () => { setSelectedCustomer(null); toast.success("Customer cleared") }

    const handleQuickAddCustomer = async (e) => {
        e.preventDefault()
        if (!newCustomerData.name.trim()) { toast.error("Customer name is required"); return }
        setCreatingCustomer(true)
        try {
            const customerData = {
                name: newCustomerData.name.trim(),
                phone: newCustomerData.phone.trim() || undefined,
                email: newCustomerData.email.trim() || undefined
            }
            Object.keys(customerData).forEach((key) => customerData[key] === undefined && delete customerData[key])
            const response = await customersAPI.create(customerData)
            setSelectedCustomer(response.data)
            setNewCustomerData({ name: "", phone: "", email: "" })
            setShowQuickAddCustomer(false); setShowCustomerModal(false); setCustomerSearch(""); setCustomerResults([])
            playSuccess()
            toast.success(`Customer ${response.data.name} created and selected!`)
        } catch (err) {
            playError()
            toast.error(err.response?.data?.detail || "Failed to create customer")
        } finally {
            setCreatingCustomer(false)
        }
    }

    return (
        <div className="font-sans text-brand-ink bg-brand-surface h-screen flex overflow-hidden">
            <ToastNotification />
            <SuccessAnimation show={showSuccess} onComplete={handleSuccessComplete} amount={successAmount} currency={currency} />
            <ReceiptPreview
                show={showReceiptPreview} onClose={() => setShowReceiptPreview(false)} onConfirm={handleConfirmSale}
                cart={cart} subtotal={subtotal} taxAmount={taxAmount} discountAmount={discountAmount} total={total}
                paymentMethod={paymentMethod} amountPaid={amountPaid} change={change} customer={selectedCustomer}
                cashier={user} shop={currentShop} currency={currency} taxSettings={taxSettings}
            />

            <Sidebar />

            {/* Product catalogue */}
            <main className="min-w-0 flex-1 flex flex-col h-screen">
                <header className="px-7 pt-[18px] grid gap-4">
                    <div className="flex items-center gap-3">
                        <label className="flex-1 min-w-0 flex items-center gap-2.5 bg-white border border-brand-ink/[0.14] rounded-xl px-3.5 h-12 focus-within:border-brand-ink transition-colors">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="opacity-50 flex-none"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg>
                            <input ref={searchInputRef} type="text" value={searchTerm} onChange={(e) => { setSelectedCategory(null); handleSearch(e.target.value) }} placeholder="Search products by name or SKU, or scan a barcode" autoComplete="off" className="flex-1 min-w-0 border-0 outline-none bg-transparent text-[15px]" />
                            {searching && <div className="w-4 h-4 border-2 border-brand-ink border-t-transparent rounded-full animate-spin flex-none" />}
                            <span className="font-mono text-[11px] text-brand-ink/50 border border-brand-ink/[0.14] px-[7px] py-0.5 rounded-md flex-none">F1</span>
                        </label>
                        {pendingQuantity && (
                            <div className="flex items-center gap-2 px-3.5 h-12 bg-brand-ink text-brand-surface rounded-xl flex-none">
                                <span className="text-base font-bold">{pendingQuantity}×</span>
                                <button onClick={() => setPendingQuantity(null)} title="Cancel (Esc)" className="p-0.5 hover:bg-white/20 rounded cursor-pointer">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18"></path></svg>
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
                        {[['all', 'All', null], ['fav', 'Favourites', favorites.length], ['top', 'Best sellers', topSellingProducts.length], ...categories.map((c) => [c.id, c.name, null])].map(([key, label, count]) => (
                            <button key={key} onClick={() => handleCategoryClick(key)} className={`flex-none flex items-center gap-2 border text-[13.5px] font-semibold px-3.5 py-2.5 rounded-full cursor-pointer whitespace-nowrap ${selectedCategory === key ? 'bg-brand-ink text-brand-surface border-brand-ink' : 'bg-white text-brand-ink border-brand-ink/[0.12]'}`}>
                                {label}
                                {count !== null && <span className="text-[11.5px] font-semibold opacity-60">{count}</span>}
                            </button>
                        ))}
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-7 pb-7 pt-[18px]">
                    {selectedCategory === 'all' && searchTerm.length < 2 && searchResults.length === 0 && (
                        <div className="h-full min-h-[320px] grid place-content-center text-center gap-2">
                            <div className="text-base font-semibold">Select a category or search for products</div>
                            <p className="text-sm text-brand-ink/58 m-0">Tip: star products to add them to Favourites.</p>
                        </div>
                    )}
                    {searching && (
                        <div className="h-full min-h-[320px] grid place-content-center text-center gap-2">
                            <div className="w-8 h-8 border-2 border-brand-ink border-t-transparent rounded-full animate-spin mx-auto" />
                            <p className="text-sm text-brand-ink/58">Searching products…</p>
                        </div>
                    )}
                    {!searching && displayedProducts.length > 0 && (
                        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))' }}>
                            {displayedProducts.map((product) => {
                                const out = product.stock_quantity === 0
                                const low = product.stock_quantity > 0 && product.stock_quantity <= (product.reorder_level || 10)
                                const inCartQty = cart.find((i) => i.product.id === product.id)?.quantity || 0
                                return (
                                    <div
                                        key={product.id}
                                        role="button"
                                        tabIndex={out ? -1 : 0}
                                        aria-disabled={out}
                                        onClick={() => !out && addToCart(product)}
                                        onKeyDown={(e) => { if (!out && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); addToCart(product) } }}
                                        className={`relative text-left bg-white rounded-2xl p-3 grid gap-2.5 transition-shadow hover:shadow-md ${out ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                                        style={{ border: `1px solid ${inCartQty ? '#14373b' : 'rgba(20,55,59,0.1)'}` }}
                                    >
                                        <div className="h-[82px] rounded-[11px] grid place-items-center relative overflow-hidden" style={{ background: out ? '#f0f8f5' : inCartQty ? '#14373b' : tileColor(product.id) }}>
                                            {product.image ? (
                                                <img src={product.image} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-[22px] font-bold tracking-[-0.03em]" style={{ color: out ? 'rgba(20,55,59,0.3)' : '#f0f8f5' }}>{abbr(product.name)}</span>
                                            )}
                                            {inCartQty > 0 && <span className="absolute top-2 right-2 min-w-[24px] h-6 px-1.5 rounded-full bg-brand-accent text-brand-ink text-xs font-bold grid place-items-center">{inCartQty}</span>}
                                            <button onClick={(e) => { e.stopPropagation(); toggleFavorite(product) }} title="Favourite" className="absolute top-2 left-2 p-0.5 cursor-pointer">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill={isFavorite(product.id) ? '#ed8674' : 'none'} stroke={isFavorite(product.id) ? '#ed8674' : (out ? 'rgba(20,55,59,0.3)' : '#f0f8f5')} strokeWidth="1.5" strokeLinejoin="round"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"></path></svg>
                                            </button>
                                        </div>
                                        <div>
                                            <div className="text-[13.5px] font-semibold leading-tight min-h-[35px]">{product.name}</div>
                                            <div className="flex justify-between items-baseline mt-1.5 gap-1.5">
                                                <span className="font-mono text-[13.5px] font-medium">{currency} {product.selling_price}</span>
                                                <span className="text-[11.5px] font-semibold" style={{ color: out ? 'rgba(20,55,59,0.4)' : low ? '#14373b' : 'rgba(20,55,59,0.5)' }}>
                                                    {out ? 'Out of stock' : low ? `${product.stock_quantity} left` : `${product.stock_quantity} in stock`}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                    {!searching && selectedCategory !== 'all' && selectedCategory !== null && displayedProducts.length === 0 && (
                        <div className="h-full min-h-[320px] grid place-content-center text-center gap-2">
                            <div className="text-base font-semibold">Nothing here yet</div>
                            <p className="text-sm text-brand-ink/58 m-0">{selectedCategory === 'fav' ? 'Star products to add them here.' : selectedCategory === 'top' ? 'Best sellers will show up as sales come in.' : 'No products in this category.'}</p>
                        </div>
                    )}
                    {!searching && searchTerm.length >= 2 && searchResults.length === 0 && selectedCategory === null && (
                        <div className="h-full min-h-[320px] grid place-content-center text-center gap-2">
                            <div className="text-base font-semibold">No products match "{searchTerm}"</div>
                            <p className="text-sm text-brand-ink/58 m-0">Check the spelling or scan the barcode.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Cart / checkout */}
            <section className="bg-white border-l border-brand-ink/10 flex flex-col h-screen min-w-0 flex-none" style={{ width: 'clamp(320px, 30vw, 400px)' }}>
                <div className="px-5 pt-[18px] pb-3.5 flex items-center gap-2.5 border-b border-brand-ink/[0.08]">
                    <div className="flex-1 min-w-0">
                        <div className="text-[17px] font-semibold tracking-[-0.02em]">Current sale</div>
                        <div className="font-mono text-[11.5px] text-brand-ink/50 mt-0.5">{itemCount} item{itemCount === 1 ? '' : 's'}</div>
                    </div>
                    <button onClick={() => setShowHoldModal(true)} title="Hold this sale (F4)" className="relative h-[38px] flex items-center gap-[7px] px-3 bg-brand-surface border-0 rounded-[10px] text-[13px] font-semibold cursor-pointer">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 9 5-9 5-9-5z"></path><path d="m3 13 9 5 9-5"></path></svg>
                        Hold
                        {heldTransactions.length > 0 && <span className="min-w-[18px] h-[18px] px-1.5 rounded-full bg-brand-accent text-brand-ink text-[11px] font-bold grid place-items-center">{heldTransactions.length}</span>}
                    </button>
                    <button onClick={() => setShowRecallModal(true)} title="Recall held transaction (F5)" className="h-[38px] w-[38px] grid place-items-center bg-transparent border border-brand-ink/[0.12] rounded-[10px] cursor-pointer">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    </button>
                    <button onClick={clearCart} title="Clear sale" aria-label="Clear sale" className="h-[38px] w-[38px] grid place-items-center bg-transparent border border-brand-ink/[0.12] rounded-[10px] cursor-pointer">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3"></path></svg>
                    </button>
                </div>

                <div className="px-5 py-3">
                    <button onClick={() => setShowCustomerModal(true)} className="w-full flex items-center gap-3 text-left rounded-xl px-3 py-2.5 cursor-pointer" style={{ background: selectedCustomer ? '#f0f8f5' : '#fff', border: `1px ${selectedCustomer ? 'solid transparent' : 'dashed rgba(20,55,59,0.2)'}` }}>
                        <span className="w-[34px] h-[34px] rounded-full grid place-items-center text-xs font-bold flex-none" style={{ background: selectedCustomer ? '#ed8674' : '#f0f8f5', color: '#14373b' }}>
                            {selectedCustomer ? abbr(selectedCustomer.name) : '+'}
                        </span>
                        <span className="flex-1 min-w-0">
                            <span className="block text-[13.5px] font-semibold truncate">{selectedCustomer?.name || 'Walk-in customer'}</span>
                            <span className="block text-xs text-brand-ink/55 truncate">{selectedCustomer ? (selectedCustomer.phone || selectedCustomer.email || 'No contact on file') : 'Attach a customer for credit or loyalty'}</span>
                        </span>
                        <span className="text-[12.5px] font-semibold text-brand-ink/60 flex-none">{selectedCustomer ? 'Change' : 'Add'}</span>
                    </button>
                    {selectedCustomer && (
                        <button onClick={handleClearCustomer} className="text-xs text-brand-ink/50 underline mt-1.5 cursor-pointer">Remove customer</button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto px-5">
                    {cart.length > 0 ? (
                        <div className="grid">
                            {cart.map((item) => (
                                <div key={item.product.id} className="grid gap-2 py-3.5 border-b border-brand-ink/[0.07]">
                                    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-start">
                                        <div className="min-w-0">
                                            <div className="text-sm font-semibold truncate">{item.product.name}</div>
                                            <div className="font-mono text-[11.5px] text-brand-ink/50 mt-0.5">{currency} {item.unit_price} each</div>
                                        </div>
                                        <div className="font-mono text-sm font-medium text-right">{currency} {((item.quantity * item.unit_price) - (item.discount || 0)).toFixed(2)}</div>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-0.5 bg-brand-surface rounded-[10px] p-[3px] w-max">
                                            <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} aria-label="Decrease" className="w-[30px] h-[30px] border-0 bg-transparent rounded-lg cursor-pointer grid place-items-center hover:bg-white">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14"></path></svg>
                                            </button>
                                            <span className="min-w-[28px] text-center text-sm font-semibold">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} aria-label="Increase" className="w-[30px] h-[30px] border-0 bg-transparent rounded-lg cursor-pointer grid place-items-center hover:bg-white">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14"></path></svg>
                                            </button>
                                        </div>
                                        {editingItemDiscount === item.product.id ? (
                                            <input
                                                type="number" autoFocus min="0" placeholder="0.00" defaultValue={item.discount || ''}
                                                onBlur={(e) => { updateItemDiscount(item.product.id, e.target.value); setEditingItemDiscount(null) }}
                                                onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                                                className="w-20 text-xs border border-brand-ink/20 rounded-lg px-2 py-1"
                                            />
                                        ) : (
                                            <button onClick={() => setEditingItemDiscount(item.product.id)} className="text-xs text-brand-ink/50 underline cursor-pointer">
                                                {item.discount > 0 ? `-${currency} ${item.discount.toFixed(2)} disc.` : 'Add discount'}
                                            </button>
                                        )}
                                        <button onClick={() => removeFromCart(item.product.id)} className="text-xs text-brand-ink/50 cursor-pointer">Remove</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full min-h-[240px] grid place-content-center text-center gap-1.5 px-5">
                            <span className="justify-self-center w-[52px] h-[52px] rounded-2xl bg-brand-surface grid place-items-center mb-2">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="opacity-60"><circle cx="9" cy="20" r="1.4"></circle><circle cx="18" cy="20" r="1.4"></circle><path d="M2.5 3h2.6l2.4 12.2a1 1 0 0 0 1 .8h9.4a1 1 0 0 0 1-.8L21 7H6"></path></svg>
                            </span>
                            <div className="text-[15px] font-semibold">No items yet</div>
                            <p className="text-[13px] text-brand-ink/55 m-0 max-w-[240px] justify-self-center">Tap a product, search, or scan a barcode to start the sale.</p>
                            {heldTransactions.length > 0 && (
                                <button onClick={() => setShowRecallModal(true)} className="justify-self-center mt-3 bg-brand-surface border-0 text-[13px] font-semibold px-3.5 py-2.5 rounded-[10px] cursor-pointer">Resume held sale ({heldTransactions.length})</button>
                            )}
                        </div>
                    )}
                </div>

                <div className="border-t border-brand-ink/[0.08] px-5 pt-4 pb-5 grid gap-3.5">
                    <div className="grid gap-[7px] text-[13.5px]">
                        <div className="flex justify-between text-brand-ink/65"><span>Subtotal</span><span className="font-mono">{currency} {subtotal.toFixed(2)}</span></div>
                        {showDiscountRow || discountAmount > 0 ? (
                            <div className="flex justify-between items-center text-brand-ink/65">
                                <span>Sale discount</span>
                                <input type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0.00" className="w-24 text-right font-mono border border-brand-ink/20 rounded-lg px-2 py-1 text-sm" />
                            </div>
                        ) : (
                            <button onClick={() => setShowDiscountRow(true)} className="text-left text-xs text-brand-ink/50 underline w-max cursor-pointer">Add sale discount</button>
                        )}
                        <label className="flex justify-between items-center text-brand-ink/65 cursor-pointer">
                            <span className="flex items-center gap-1.5">
                                <input type="checkbox" checked={taxEnabled} onChange={(e) => setTaxSettings((prev) => ({ ...prev, enabled: e.target.checked }))} className="w-3.5 h-3.5 accent-brand-ink" />
                                {taxName} {taxRate}%
                            </span>
                            <span className="font-mono">{currency} {taxAmount.toFixed(2)}</span>
                        </label>
                        <div className="flex justify-between items-baseline mt-1">
                            <span className="text-[15px] font-semibold">Total</span>
                            <span className="text-[26px] font-semibold tracking-[-0.035em]">{currency} {total.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 p-1 bg-brand-surface rounded-xl">
                        <button onClick={() => setPaymentMethod('cash')} title="Cash payment (F2)" className={`border-0 text-[13.5px] font-semibold py-2.5 rounded-[9px] cursor-pointer ${paymentMethod === 'cash' ? 'bg-white shadow-sm' : 'bg-transparent text-brand-ink/60'}`}>Cash</button>
                        <button onClick={() => setPaymentMethod('mpesa')} title="M-Pesa payment (F3)" className={`border-0 text-[13.5px] font-semibold py-2.5 rounded-[9px] cursor-pointer ${paymentMethod === 'mpesa' ? 'bg-white shadow-sm' : 'bg-transparent text-brand-ink/60'}`}>M-Pesa</button>
                    </div>

                    {paymentMethod === 'cash' && (
                        <div className="grid gap-2">
                            <input ref={amountInputRef} type="number" min="0" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} placeholder="Amount received" className="h-11 border border-brand-ink/[0.16] rounded-xl px-3.5 font-mono text-[15px] outline-none focus:border-brand-ink" />
                            <div className="grid grid-cols-4 gap-1.5">
                                {[100, 200, 500, 1000].map((amount) => (
                                    <button key={amount} onClick={() => handleQuickAmount(amount)} className="h-9 bg-brand-surface border-0 rounded-lg font-mono text-[12.5px] font-medium cursor-pointer">
                                        {amount}{amountButtonClicks[amount] > 1 && <span className="ml-1">×{amountButtonClicks[amount]}</span>}
                                    </button>
                                ))}
                            </div>
                            {amountPaid && (
                                <div className="flex justify-between items-baseline px-3.5 py-3 rounded-xl" style={{ background: parseFloat(amountPaid) < total ? 'rgba(237,134,116,0.18)' : '#f0f8f5' }}>
                                    <span className="text-sm font-semibold">{parseFloat(amountPaid) < total ? 'Still due' : 'Change'}</span>
                                    <span className="text-xl font-semibold tracking-[-0.03em]">{currency} {Math.abs(total - parseFloat(amountPaid || 0)).toFixed(2)}</span>
                                </div>
                            )}
                        </div>
                    )}
                    {paymentMethod === 'mpesa' && (
                        <div className="grid gap-2">
                            <input ref={mpesaInputRef} type="text" value={mpesaReference} onChange={(e) => setMpesaReference(e.target.value.toUpperCase())} placeholder="M-Pesa reference (optional), e.g. QH12ABC34D" className="h-11 border border-brand-ink/[0.16] rounded-xl px-3.5 font-mono text-[15px] outline-none focus:border-brand-ink uppercase" />
                            <p className="text-xs text-brand-ink/55 m-0">Confirm the payment on your phone first, then tap Payment received. Reference code is optional.</p>
                        </div>
                    )}

                    <button onClick={() => setShowSplitPayment(true)} className="text-xs text-brand-ink/55 underline w-max cursor-pointer">Split between cash and M-Pesa instead</button>

                    <button
                        onClick={handleCheckout}
                        disabled={cart.length === 0 || processing}
                        className="h-14 flex items-center justify-between px-5 rounded-2xl text-base font-bold cursor-pointer disabled:cursor-not-allowed"
                        style={{ background: cart.length === 0 ? 'rgba(20,55,59,0.08)' : '#ed8674', color: cart.length === 0 ? 'rgba(20,55,59,0.4)' : '#14373b' }}
                    >
                        <span>{cart.length === 0 ? 'Add items to charge' : processing ? 'Processing…' : paymentMethod === 'mpesa' ? 'Payment received' : 'Charge cash'}</span>
                        <span className="flex items-center gap-2.5">
                            {currency} {total.toFixed(2)}
                            <span className="font-mono text-[11px] font-medium bg-brand-ink/10 px-[7px] py-0.5 rounded-md">F9</span>
                        </span>
                    </button>
                </div>
            </section>

            {/* Hold modal */}
            {showHoldModal && (
                <div className="fixed inset-0 bg-[rgba(12,34,37,0.5)] backdrop-blur-sm grid place-items-center z-[100] p-6" onClick={() => setShowHoldModal(false)}>
                    <div className="w-full max-w-[420px] bg-white rounded-[22px] p-6 grid gap-4" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold">Hold this sale</h3>
                        <p className="text-sm text-brand-ink/60 -mt-2">{itemCount} items · {currency} {total.toFixed(2)}</p>
                        <input type="text" value={holdNote} onChange={(e) => setHoldNote(e.target.value)} placeholder="Note (e.g. John - went to ATM)" maxLength={50} className="h-11 border border-brand-ink/[0.16] rounded-xl px-3.5" />
                        <div className="flex gap-2.5">
                            <button onClick={() => { setShowHoldModal(false); setHoldNote("") }} className="flex-1 py-2.5 border border-brand-ink/20 rounded-xl font-semibold cursor-pointer">Cancel</button>
                            <button onClick={handleHoldTransaction} className="flex-1 py-2.5 bg-brand-ink text-brand-surface rounded-xl font-semibold cursor-pointer">Hold sale</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Recall modal */}
            {showRecallModal && (
                <div className="fixed inset-0 bg-[rgba(12,34,37,0.5)] backdrop-blur-sm grid place-items-center z-[100] p-6" onClick={() => setShowRecallModal(false)}>
                    <div className="w-full max-w-[460px] max-h-[80vh] overflow-y-auto bg-white rounded-[22px] p-6 grid gap-4" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold">Held transactions</h3>
                        {heldTransactions.length === 0 ? (
                            <p className="text-sm text-brand-ink/58">No held transactions.</p>
                        ) : (
                            <div className="grid gap-2.5">
                                {heldTransactions.map((held) => {
                                    const heldSubtotal = held.items.reduce((s, i) => s + (i.quantity * i.unit_price) - (i.discount || 0), 0)
                                    const heldCount = held.items.reduce((s, i) => s + i.quantity, 0)
                                    const heldDiscount = parseFloat(held.discount) || 0
                                    const heldTaxable = Math.max(heldSubtotal - heldDiscount, 0)
                                    const heldTaxAmount = held.taxEnabled ? (heldTaxable * (held.taxRate || 16)) / 100 : 0
                                    const heldTotal = heldTaxable + heldTaxAmount
                                    return (
                                        <div key={held.id} className="border border-brand-ink/[0.12] rounded-xl p-3.5 grid gap-1.5">
                                            <div className="flex justify-between items-baseline">
                                                <span className="text-sm font-semibold">{heldCount} items · {currency} {heldTotal.toFixed(2)}</span>
                                                <span className="text-xs text-brand-ink/50">{getTimeAgo(held.holdTime)}</span>
                                            </div>
                                            {held.holdNote && <p className="text-xs text-brand-ink/60 m-0">{held.holdNote}</p>}
                                            <div className="flex gap-2 mt-1">
                                                <button onClick={() => handleRecallTransaction(held.id)} className="flex-1 py-2 bg-brand-ink text-brand-surface rounded-lg text-xs font-semibold cursor-pointer">Recall</button>
                                                <button onClick={() => handleDeleteHeldTransaction(held.id)} className="py-2 px-3 border border-brand-ink/20 rounded-lg text-xs font-semibold cursor-pointer">Delete</button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                        <button onClick={() => setShowRecallModal(false)} className="py-2.5 border border-brand-ink/20 rounded-xl font-semibold cursor-pointer">Close</button>
                    </div>
                </div>
            )}

            {/* Customer modal */}
            {showCustomerModal && (
                <div className="fixed inset-0 bg-[rgba(12,34,37,0.5)] backdrop-blur-sm grid place-items-center z-[100] p-6" onClick={() => { setShowCustomerModal(false); setShowQuickAddCustomer(false); setNewCustomerData({ name: "", phone: "", email: "" }) }}>
                    <div className="w-full max-w-[440px] max-h-[80vh] overflow-y-auto bg-white rounded-[22px] p-6 grid gap-4" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold">{showQuickAddCustomer ? 'Add new customer' : 'Select customer'}</h3>
                        {!showQuickAddCustomer ? (
                            <>
                                <input type="text" value={customerSearch} onChange={(e) => handleCustomerSearch(e.target.value)} placeholder="Search by name, email, or phone…" className="h-11 border border-brand-ink/[0.16] rounded-xl px-3.5" autoFocus />
                                {searchingCustomers && <p className="text-sm text-brand-ink/55">Searching…</p>}
                                <div className="grid gap-1.5">
                                    {customerResults.map((c) => (
                                        <button key={c.id} onClick={() => handleSelectCustomer(c)} className="text-left flex items-center gap-3 p-2.5 rounded-xl hover:bg-brand-surface cursor-pointer">
                                            <span className="w-9 h-9 rounded-full bg-brand-surface grid place-items-center text-xs font-bold flex-none">{abbr(c.name)}</span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block text-sm font-semibold truncate">{c.name}</span>
                                                <span className="block text-xs text-brand-ink/55 truncate">{c.phone || c.email}</span>
                                            </span>
                                            <span className="text-xs text-brand-ink/50 flex-none">{c.total_transactions || 0} sales</span>
                                        </button>
                                    ))}
                                </div>
                                <button onClick={() => setShowQuickAddCustomer(true)} className="text-sm font-semibold text-brand-ink underline w-max cursor-pointer">+ Add new customer</button>
                            </>
                        ) : (
                            <form onSubmit={handleQuickAddCustomer} className="grid gap-3">
                                <input type="text" value={newCustomerData.name} onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })} placeholder="Enter customer name" className="h-11 border border-brand-ink/[0.16] rounded-xl px-3.5" required autoFocus />
                                <input type="tel" value={newCustomerData.phone} onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })} placeholder="Enter phone number" className="h-11 border border-brand-ink/[0.16] rounded-xl px-3.5" />
                                <input type="email" value={newCustomerData.email} onChange={(e) => setNewCustomerData({ ...newCustomerData, email: e.target.value })} placeholder="Enter email address" className="h-11 border border-brand-ink/[0.16] rounded-xl px-3.5" />
                                <div className="flex gap-2.5">
                                    <button type="button" onClick={() => setShowQuickAddCustomer(false)} className="flex-1 py-2.5 border border-brand-ink/20 rounded-xl font-semibold cursor-pointer">Back</button>
                                    <button type="submit" disabled={creatingCustomer || !newCustomerData.name.trim()} className="flex-1 py-2.5 bg-brand-ink text-brand-surface rounded-xl font-semibold cursor-pointer disabled:opacity-60">{creatingCustomer ? 'Creating…' : 'Create & select'}</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Split payment modal */}
            {showSplitPayment && (
                <div className="fixed inset-0 bg-[rgba(12,34,37,0.5)] backdrop-blur-sm grid place-items-center z-[100] p-6" onClick={() => setShowSplitPayment(false)}>
                    <div className="w-full max-w-[460px] max-h-[85vh] overflow-y-auto bg-white rounded-[22px] p-6 grid gap-4" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold">Split payment</h3>
                        <div className="grid grid-cols-3 gap-2.5">
                            <div className="bg-brand-surface rounded-xl p-3">
                                <p className="text-xs text-brand-ink/60 mb-1">Total</p>
                                <p className="text-lg font-semibold">{currency} {total.toFixed(2)}</p>
                            </div>
                            <div className="bg-brand-surface rounded-xl p-3">
                                <p className="text-xs text-brand-ink/60 mb-1">Paid</p>
                                <p className="text-lg font-semibold">{currency} {splitPayments.reduce((s, p) => s + parseFloat(p.amount), 0).toFixed(2)}</p>
                            </div>
                            <div className="bg-brand-surface rounded-xl p-3">
                                <p className="text-xs text-brand-ink/60 mb-1">Remaining</p>
                                <p className="text-lg font-semibold">{currency} {Math.max(0, total - splitPayments.reduce((s, p) => s + parseFloat(p.amount), 0)).toFixed(2)}</p>
                            </div>
                        </div>
                        {splitPayments.length > 0 && (
                            <div className="grid gap-1.5">
                                {splitPayments.map((p, i) => (
                                    <div key={i} className="flex justify-between items-center bg-white border border-brand-ink/[0.12] rounded-lg px-3 py-2 text-sm">
                                        <span className="capitalize font-semibold">{p.method}{p.reference ? ` · ${p.reference}` : ''}</span>
                                        <span className="flex items-center gap-2"><span className="font-mono">{currency} {p.amount}</span><button onClick={() => handleRemovePayment(i)} className="text-brand-ink/50 cursor-pointer">✕</button></span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {parseFloat(splitPayments.reduce((s, p) => s + parseFloat(p.amount), 0).toFixed(2)) < total - 0.01 && (
                            <div className="grid gap-2.5 border-t border-brand-ink/[0.08] pt-3.5">
                                <div className="grid grid-cols-2 gap-1.5 p-1 bg-brand-surface rounded-xl">
                                    <button onClick={() => setCurrentPayment({ ...currentPayment, method: 'cash', reference: '' })} className={`border-0 text-[13.5px] font-semibold py-2.5 rounded-[9px] cursor-pointer ${currentPayment.method === 'cash' ? 'bg-white shadow-sm' : 'bg-transparent text-brand-ink/60'}`}>Cash</button>
                                    <button onClick={() => setCurrentPayment({ ...currentPayment, method: 'mpesa' })} className={`border-0 text-[13.5px] font-semibold py-2.5 rounded-[9px] cursor-pointer ${currentPayment.method === 'mpesa' ? 'bg-white shadow-sm' : 'bg-transparent text-brand-ink/60'}`}>M-Pesa</button>
                                </div>
                                <input type="number" min="0" value={currentPayment.amount} onChange={(e) => setCurrentPayment({ ...currentPayment, amount: e.target.value })} placeholder="0.00" className="h-11 border border-brand-ink/[0.16] rounded-xl px-3.5 font-mono" />
                                {currentPayment.method === 'mpesa' && (
                                    <input type="text" value={currentPayment.reference} onChange={(e) => setCurrentPayment({ ...currentPayment, reference: e.target.value.toUpperCase() })} placeholder="Reference (optional), e.g. QH12ABC34D" className="h-11 border border-brand-ink/[0.16] rounded-xl px-3.5 font-mono uppercase" />
                                )}
                                <button onClick={handleAddPayment} className="py-2.5 bg-brand-surface border-0 rounded-xl font-semibold cursor-pointer">Add payment</button>
                            </div>
                        )}
                        <div className="flex gap-2.5 pt-2 border-t border-brand-ink/[0.08]">
                            <button onClick={() => { setShowSplitPayment(false); setSplitPayments([]); setCurrentPayment({ method: 'cash', amount: '', reference: '' }) }} className="flex-1 py-2.5 border border-brand-ink/20 rounded-xl font-semibold cursor-pointer">Cancel</button>
                            <button
                                onClick={handleCompleteSplitPayment}
                                disabled={processing || splitPayments.length === 0 || parseFloat(splitPayments.reduce((s, p) => s + parseFloat(p.amount), 0).toFixed(2)) < total - 0.01}
                                className="flex-1 py-2.5 bg-brand-accent text-brand-ink rounded-xl font-bold cursor-pointer disabled:opacity-60"
                            >
                                {processing ? 'Processing…' : 'Complete sale'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Sales
