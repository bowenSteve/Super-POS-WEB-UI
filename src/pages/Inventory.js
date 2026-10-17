import { useState, useEffect, useRef } from "react"
import { useAuth } from "../context/AuthContext"
import { productsAPI } from "../api/api"
import Sidebar from "../components/Sidebar"
import ToastNotification, { toast } from '../components/ToastNotification'

function Inventory() {
    const { user, currentShop } = useAuth()
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [appliedSearch, setAppliedSearch] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("")
    const [showLowStock, setShowLowStock] = useState(false)
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)
    const [totalCount, setTotalCount] = useState(0)
    const [totalPages, setTotalPages] = useState(1)
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showRestockModal, setShowRestockModal] = useState(false)
    const [showCategoryModal, setShowCategoryModal] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [categoryFormData, setCategoryFormData] = useState({ name: "", description: "" })
    const [importing, setImporting] = useState(false)
    const [importResults, setImportResults] = useState(null)
    const [showImportModal, setShowImportModal] = useState(false)
    const fileInputRef = useRef(null)
    const [formData, setFormData] = useState({
        name: "",
        sku: "",
        category: "",
        cost_price: "",
        selling_price: "",
        stock_quantity: "",
        reorder_level: "2",
        description: ""
    })

    const [restockAmount, setRestockAmount] = useState("")

    useEffect(() => {
        fetchCategories()
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => {
            setAppliedSearch(searchTerm)
            setPage(1)
        }, 350)
        return () => clearTimeout(timer)
    }, [searchTerm])

    useEffect(() => {
        fetchProducts()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize, appliedSearch, selectedCategory, showLowStock])

    const fetchProducts = async () => {
        setLoading(true)
        try {
            const params = { page, page_size: pageSize, ordering: 'name' }
            if (appliedSearch) params.search = appliedSearch
            if (selectedCategory) params.category = selectedCategory
            if (showLowStock) params.low_stock = true
            const response = await productsAPI.getAll(params)
            const data = response.data
            const productsData = data.results || data
            setProducts(Array.isArray(productsData) ? productsData : [])
            setTotalCount(typeof data.count === 'number' ? data.count : (Array.isArray(productsData) ? productsData.length : 0))
            setTotalPages(typeof data.total_pages === 'number' ? data.total_pages : 1)
        } catch (err) {
            const errorMsg = err.response?.data?.detail || err.response?.data?.error || "Failed to fetch products"
            toast.error(errorMsg)
            console.error('Fetch products error:', err.response || err)
            setProducts([])
            setTotalCount(0)
            setTotalPages(1)
        } finally {
            setLoading(false)
        }
    }

    const fetchCategories = async () => {
        try {
            const response = await productsAPI.getCategories()
            const categoriesData = response.data.results || response.data
            setCategories(Array.isArray(categoriesData) ? categoriesData : [])
        } catch (err) {
            console.error("Failed to fetch categories", err)
            toast.error("Failed to fetch categories")
        }
    }

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleAddProduct = async (e) => {
        e.preventDefault()

        try {
            await productsAPI.create(formData)
            toast.success("Product added successfully!")
            setShowAddModal(false)
            setFormData({
                name: "",
                sku: "",
                category: "",
                cost_price: "",
                selling_price: "",
                stock_quantity: "",
                reorder_level: "2",
                description: ""
            })
            fetchProducts()
        } catch (err) {
            const errorMsg = err.response?.data?.sku?.[0] || err.response?.data?.detail || "Failed to add product"
            toast.error(errorMsg)
        }
    }

    const handleEditProduct = async (e) => {
        e.preventDefault()

        try {
            await productsAPI.update(selectedProduct.id, formData)
            toast.success("Product updated successfully!")
            setShowEditModal(false)
            setSelectedProduct(null)
            fetchProducts()
        } catch (err) {
            const errorMsg = err.response?.data?.detail || "Failed to update product"
            toast.error(errorMsg)
        }
    }

    const handleRestock = async (e) => {
        e.preventDefault()

        if (!selectedProduct || !restockAmount) {
            toast.error("Invalid restock data")
            return
        }

        const currentStock = parseInt(selectedProduct.stock_quantity) || 0
        const additionalStock = parseInt(restockAmount) || 0

        if (isNaN(currentStock) || isNaN(additionalStock) || additionalStock <= 0) {
            toast.error("Invalid stock quantity")
            return
        }

        const newStock = currentStock + additionalStock

        try {
            await productsAPI.update(selectedProduct.id, {
                stock_quantity: newStock
            })
            toast.success(`Restocked ${selectedProduct.name} successfully!`)
            setShowRestockModal(false)
            setSelectedProduct(null)
            setRestockAmount("")
            fetchProducts()
        } catch (err) {
            toast.error("Failed to restock product")
        }
    }
    // Handle download sample Excel
    const handleDownloadSample = async () => {
        try {
            toast.loading('Preparing sample file...', { id: 'download-toast' })
            const response = await productsAPI.downloadSample()

            // Create a blob from the response
            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            })

            // Create a download link and trigger it
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = 'product_import_sample.xlsx'
            document.body.appendChild(link)
            link.click()

            // Cleanup
            window.URL.revokeObjectURL(url)
            document.body.removeChild(link)

            toast.success('Sample file downloaded successfully!', { id: 'download-toast' })
        } catch (error) {
            toast.error('Failed to download sample file', { id: 'download-toast' })
            console.error('Download error:', error)
        }
    }

    // Handle import click
    const handleImportClick = () => {
        if (!currentShop) {
            toast.error("Please select a shop to import products")
            return
        }
        // Trigger the hidden file input
        fileInputRef.current.click()
    }

    // Handle file selection
    const handleFileSelect = async (event) => {
        const file = event.target.files[0]
        if (!file) return

        // Validate file type
        if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            toast.error('Please select a valid Excel file (.xlsx or .xls)')
            event.target.value = '' // Reset input
            return
        }

        setImporting(true)
        toast.loading('Importing products...', { id: 'import-toast' })

        try {
            const response = await productsAPI.importProducts(file)
            const results = response.data.results

            setImportResults(results)
            setShowImportModal(true)

            toast.success(
                `Import completed! ${results.success.length} products imported, ${results.errors.length} errors`,
                { id: 'import-toast' }
            )

            // Refresh products list
            fetchProducts()

        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Failed to import products'
            toast.error(errorMsg, { id: 'import-toast' })
            console.error('Import error:', error)
        } finally {
            setImporting(false)
            event.target.value = '' // Reset input
        }
    }
    const openEditModal = (product) => {
        setSelectedProduct(product)
        setFormData({
            name: product.name,
            sku: product.sku,
            category: product.category,
            cost_price: product.cost_price,
            selling_price: product.selling_price,
            stock_quantity: product.stock_quantity,
            reorder_level: product.reorder_level,
            description: product.description || ""
        })
        setShowEditModal(true)
    }

    const openRestockModal = (product) => {
        setSelectedProduct(product)
        setRestockAmount("")
        setShowRestockModal(true)
    }

    const handleCategoryInputChange = (e) => {
        setCategoryFormData({
            ...categoryFormData,
            [e.target.name]: e.target.value
        })
    }

    const handleCreateCategory = async (e) => {
        e.preventDefault()

        try {
            await productsAPI.createCategory(categoryFormData)
            toast.success("Category created successfully!")
            setCategoryFormData({ name: "", description: "" })
            fetchCategories()
        } catch (err) {
            const errorMsg = err.response?.data?.name?.[0] || err.response?.data?.detail || "Failed to create category"
            toast.error(errorMsg)
        }
    }

    const handleDeleteCategory = async (category) => {
        if (!window.confirm(`Delete "${category.name}"? Products in this category will become uncategorized, not deleted.`)) return

        try {
            await productsAPI.deleteCategory(category.id)
            toast.success("Category deleted successfully!")
            if (selectedCategory === String(category.id)) {
                setSelectedCategory("")
                setPage(1)
            }
            fetchCategories()
        } catch (err) {
            const errorMsg = err.response?.data?.detail || "Failed to delete category"
            toast.error(errorMsg)
        }
    }

    // SVG Icons
    const AlertIcon = () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
    )

    const CheckIcon = () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
    )

    const SearchIcon = () => (
        <svg className="w-4 h-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="11" cy="11" r="7"></circle>
            <path d="m20 20-3.5-3.5"></path>
        </svg>
    )

    const PlusIcon = () => (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
    )

    const EditIcon = () => (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
    )

    const TrashIcon = () => (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
    )

    const PackageIcon = () => (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line>
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
    )

    const CloseIcon = () => (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    )

    const initials = (user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase() + (user?.last_name?.[0] || '').toUpperCase()
    const inputClass = 'w-full px-3.5 py-2.5 border border-brand-ink/[0.16] rounded-xl outline-none focus:border-brand-ink transition-colors'
    const labelClass = 'block text-sm font-semibold mb-1.5'

    return (
        <div className="flex min-h-screen bg-brand-surface font-sans text-brand-ink">
            <ToastNotification />
            <Sidebar />
            <div className="flex-1 min-w-0">
                <header className="sticky top-0 z-20 bg-brand-surface/[0.9] backdrop-blur-md border-b border-brand-ink/[0.09]">
                    <div className="flex items-center gap-3 px-8 py-4">
                        <h1 className="text-[22px] font-semibold tracking-[-0.03em] flex-1">Inventory</h1>
                        <button
                            className="inline-flex items-center gap-2 px-3.5 py-2.5 border border-brand-ink/[0.16] rounded-xl hover:bg-white transition-colors font-semibold text-sm cursor-pointer disabled:opacity-50"
                            onClick={handleDownloadSample}
                            disabled={importing}
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            Sample
                        </button>
                        <button
                            className="inline-flex items-center gap-2 px-3.5 py-2.5 border border-brand-ink/[0.16] rounded-xl hover:bg-white transition-colors font-semibold text-sm cursor-pointer disabled:opacity-50"
                            onClick={handleImportClick}
                            disabled={importing}
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="17 14 12 9 7 14"></polyline>
                                <line x1="12" y1="9" x2="12" y2="21"></line>
                            </svg>
                            {importing ? 'Importing…' : 'Import Excel'}
                        </button>
                        <button
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-ink text-brand-surface rounded-xl hover:bg-brand-ink/90 transition-colors font-semibold cursor-pointer"
                            onClick={() => {
                                if (!currentShop) {
                                    toast.error("Please select a shop from your profile to add products")
                                    return
                                }
                                setShowAddModal(true)
                            }}
                        >
                            <PlusIcon />
                            Add product
                        </button>
                        <span className="w-[38px] h-[38px] rounded-full bg-brand-ink text-brand-surface grid place-items-center text-[13px] font-semibold">{initials}</span>
                    </div>
                </header>

                <main className="px-8 py-6">
                    {/* Filters */}
                    <div className="bg-white border border-brand-ink/[0.09] rounded-2xl p-3.5 flex flex-wrap items-center gap-3 mb-5">
                        <label className="flex-1 min-w-[200px] flex items-center gap-2.5 bg-brand-surface rounded-xl px-3 h-[42px] focus-within:ring-1 focus-within:ring-brand-ink transition-shadow">
                            <SearchIcon />
                            <input
                                type="text"
                                className="flex-1 min-w-0 border-0 outline-none bg-transparent text-sm"
                                placeholder="Search by name or SKU…"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </label>

                        <select
                            className="h-[42px] px-3.5 border border-brand-ink/[0.16] rounded-xl outline-none focus:border-brand-ink bg-white text-sm transition-colors"
                            value={selectedCategory}
                            onChange={(e) => { setSelectedCategory(e.target.value); setPage(1) }}
                        >
                            <option value="">All categories</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                        <button
                            onClick={() => {
                                if (!currentShop) {
                                    toast.error("Please select a shop from your profile to add categories")
                                    return
                                }
                                setShowCategoryModal(true)
                            }}
                            className="w-[42px] h-[42px] grid place-items-center text-brand-ink hover:bg-brand-surface rounded-xl transition-colors cursor-pointer"
                            title="Add new category"
                        >
                            <PlusIcon />
                        </button>

                        <label className="flex items-center gap-2 cursor-pointer text-sm">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded accent-brand-ink"
                                checked={showLowStock}
                                onChange={(e) => { setShowLowStock(e.target.checked); setPage(1) }}
                            />
                            Low stock only
                        </label>

                        <div className="text-sm text-brand-ink/60">
                            Total: <span className="font-semibold text-brand-ink">{totalCount}</span> products
                        </div>
                    </div>

                    {/* Products Table */}
                    {loading ? (
                        <div className="bg-white border border-brand-ink/[0.09] rounded-2xl p-12 text-center text-brand-ink/55">
                            Loading products…
                        </div>
                    ) : (
                        <div className="bg-white border border-brand-ink/[0.09] rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-[13.5px]">
                                    <thead className="bg-[#fafcfb] border-b border-brand-ink/[0.08]">
                                        <tr>
                                            <th className="text-left px-[18px] py-3 text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50">SKU</th>
                                            <th className="text-left px-3 py-3 text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50">Product name</th>
                                            <th className="text-left px-3 py-3 text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50">Category</th>
                                            <th className="text-left px-3 py-3 text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50">Cost price</th>
                                            <th className="text-left px-3 py-3 text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50">Selling price</th>
                                            <th className="text-left px-3 py-3 text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50">Stock</th>
                                            <th className="text-left px-3 py-3 text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50">Status</th>
                                            <th className="text-left px-[18px] py-3 text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-brand-ink/[0.06]">
                                        {products.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" className="px-4 py-12 text-center text-brand-ink/55">
                                                    No products found
                                                </td>
                                            </tr>
                                        ) : (
                                            products.map(product => (
                                                <tr key={product.id} className="hover:bg-brand-surface/60 transition-colors">
                                                    <td className="px-[18px] py-3 font-mono text-brand-ink/75">{product.sku}</td>
                                                    <td className="px-3 py-3 font-semibold">{product.name}</td>
                                                    <td className="px-3 py-3 text-brand-ink/65">{product.category_name}</td>
                                                    <td className="px-3 py-3 font-mono text-brand-ink/65">KSh {product.cost_price}</td>
                                                    <td className="px-3 py-3 font-mono font-medium">KSh {product.selling_price}</td>
                                                    <td className="px-3 py-3">
                                                        <span
                                                            className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold"
                                                            style={product.is_low_stock ? { background: 'rgba(200,85,61,0.12)', color: '#c8553d' } : { background: 'rgba(47,122,95,0.12)', color: '#2f7a5f' }}
                                                        >
                                                            {product.stock_quantity}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        {product.is_low_stock ? (
                                                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(20,55,59,0.08)', color: 'rgba(20,55,59,0.6)' }}>
                                                                Low stock
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(47,122,95,0.12)', color: '#2f7a5f' }}>
                                                                In stock
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-[18px] py-3">
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                className="p-2 text-brand-ink/55 hover:text-brand-ink hover:bg-brand-surface rounded-lg transition-colors cursor-pointer"
                                                                onClick={() => openEditModal(product)}
                                                                title="Edit product"
                                                            >
                                                                <EditIcon />
                                                            </button>
                                                            <button
                                                                className="p-2 text-brand-ink/55 hover:text-brand-ink hover:bg-brand-surface rounded-lg transition-colors cursor-pointer"
                                                                onClick={() => openRestockModal(product)}
                                                                title="Restock"
                                                            >
                                                                <PackageIcon />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && totalCount > 0 && (
                        <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                            <div className="text-sm text-brand-ink/55">
                                Showing <span className="font-semibold text-brand-ink">{(page - 1) * pageSize + 1}</span>
                                {'–'}
                                <span className="font-semibold text-brand-ink">{Math.min(page * pageSize, totalCount)}</span> of{' '}
                                <span className="font-semibold text-brand-ink">{totalCount}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2 text-sm text-brand-ink/60">
                                    Show
                                    <select
                                        className="h-9 px-2.5 border border-brand-ink/[0.16] rounded-lg outline-none focus:border-brand-ink bg-white text-sm transition-colors"
                                        value={pageSize}
                                        onChange={(e) => { setPageSize(parseInt(e.target.value)); setPage(1) }}
                                    >
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                    </select>
                                </label>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page <= 1}
                                        className="h-9 px-3 border border-brand-ink/[0.16] rounded-lg text-sm font-semibold hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        Prev
                                    </button>
                                    <span className="text-sm text-brand-ink/60 px-1">
                                        Page <span className="font-semibold text-brand-ink">{page}</span> of {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={page >= totalPages}
                                        className="h-9 px-3 border border-brand-ink/[0.16] rounded-lg text-sm font-semibold hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />

                {/* Import Results Modal */}
                {showImportModal && importResults && (
                    <div className="fixed inset-0 bg-[rgba(12,34,37,0.5)] backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowImportModal(false)}>
                        <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-ink/10">
                                <h2 className="text-lg font-semibold">Import results</h2>
                                <button className="text-brand-ink/40 hover:text-brand-ink cursor-pointer" onClick={() => setShowImportModal(false)}>
                                    <CloseIcon />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                {/* Summary */}
                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    <div className="bg-brand-surface rounded-xl p-4">
                                        <p className="text-sm text-brand-ink/60 font-medium mb-1">Total rows</p>
                                        <p className="text-2xl font-semibold">{importResults.total_rows}</p>
                                    </div>
                                    <div className="rounded-xl p-4" style={{ background: 'rgba(47,122,95,0.1)' }}>
                                        <p className="text-sm font-medium mb-1" style={{ color: '#2f7a5f' }}>Successful</p>
                                        <p className="text-2xl font-semibold" style={{ color: '#2f7a5f' }}>{importResults.success.length}</p>
                                    </div>
                                    <div className="bg-brand-surface rounded-xl p-4">
                                        <p className="text-sm text-brand-ink/60 font-medium mb-1">Failed</p>
                                        <p className="text-2xl font-semibold">{importResults.errors.length}</p>
                                    </div>
                                </div>

                                {/* Success List */}
                                {importResults.success.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#2f7a5f' }}>
                                            <CheckIcon />
                                            Successfully imported ({importResults.success.length})
                                        </h3>
                                        <div className="rounded-xl p-4 max-h-48 overflow-y-auto" style={{ background: 'rgba(47,122,95,0.08)' }}>
                                            <div className="space-y-2">
                                                {importResults.success.map((item) => (
                                                    <div key={`success-${item.row}-${item.sku}`} className="text-sm" style={{ color: '#2f7a5f' }}>
                                                        Row {item.row}: {item.name} (SKU: {item.sku})
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Errors List */}
                                {importResults.errors.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-brand-ink/75 mb-3 flex items-center gap-2">
                                            <AlertIcon />
                                            Errors ({importResults.errors.length})
                                        </h3>
                                        <div className="bg-brand-surface rounded-xl p-4 max-h-64 overflow-y-auto">
                                            <div className="space-y-3">
                                                {importResults.errors.map((item) => (
                                                    <div key={`error-${item.row}`} className="bg-white rounded-xl p-3 border border-brand-ink/[0.08]">
                                                        <p className="text-sm font-semibold mb-1">
                                                            Row {item.row}
                                                        </p>
                                                        <p className="text-sm text-brand-ink/70">{item.error}</p>
                                                        {item.data && (
                                                            <p className="text-xs text-brand-ink/50 mt-1">
                                                                {item.data.sku && `SKU: ${item.data.sku}, `}
                                                                {item.data.name && `Name: ${item.data.name}`}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 px-6 py-4 border-t border-brand-ink/10">
                                <button
                                    className="px-4 py-2.5 bg-brand-ink text-brand-surface rounded-xl hover:bg-brand-ink/90 transition-colors font-semibold cursor-pointer"
                                    onClick={() => setShowImportModal(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Product Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-[rgba(12,34,37,0.5)] backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
                        <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-ink/10">
                                <h2 className="text-lg font-semibold">Add new product</h2>
                                <button className="text-brand-ink/40 hover:text-brand-ink cursor-pointer" onClick={() => setShowAddModal(false)}>
                                    <CloseIcon />
                                </button>
                            </div>

                            <form onSubmit={handleAddProduct} className="p-6 grid gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Product name *</label>
                                        <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>SKU</label>
                                        <input type="text" name="sku" value={formData.sku} onChange={handleInputChange} placeholder="Optional" className={inputClass} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Category *</label>
                                        <select name="category" value={formData.category} onChange={handleInputChange} required className={`${inputClass} bg-white`}>
                                            <option value="">Select category</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Initial stock *</label>
                                        <input type="number" name="stock_quantity" value={formData.stock_quantity} onChange={handleInputChange} min="0" required className={inputClass} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Cost price (KSh) *</label>
                                        <input type="number" name="cost_price" value={formData.cost_price} onChange={handleInputChange} step="0.01" min="0" required className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Selling price (KSh) *</label>
                                        <input type="number" name="selling_price" value={formData.selling_price} onChange={handleInputChange} step="0.01" min="0" required className={inputClass} />
                                    </div>
                                </div>

                                <div>
                                    <label className={labelClass}>Reorder level</label>
                                    <input type="number" name="reorder_level" value={formData.reorder_level} onChange={handleInputChange} min="0" className={inputClass} />
                                    <p className="text-xs text-brand-ink/50 mt-1">Alert when stock falls below this level</p>
                                </div>

                                <div>
                                    <label className={labelClass}>Description</label>
                                    <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" className={`${inputClass} resize-none`} />
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <button type="button" className="px-4 py-2.5 border border-brand-ink/[0.16] rounded-xl hover:bg-brand-surface transition-colors font-semibold cursor-pointer" onClick={() => setShowAddModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="px-4 py-2.5 bg-brand-ink text-brand-surface rounded-xl hover:bg-brand-ink/90 transition-colors font-semibold cursor-pointer">
                                        Add product
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Product Modal */}
                {showEditModal && selectedProduct && (
                    <div className="fixed inset-0 bg-[rgba(12,34,37,0.5)] backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowEditModal(false)}>
                        <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-ink/10">
                                <h2 className="text-lg font-semibold">Edit product</h2>
                                <button className="text-brand-ink/40 hover:text-brand-ink cursor-pointer" onClick={() => setShowEditModal(false)}>
                                    <CloseIcon />
                                </button>
                            </div>

                            <form onSubmit={handleEditProduct} className="p-6 grid gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Product name *</label>
                                        <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>SKU</label>
                                        <input type="text" name="sku" value={formData.sku} onChange={handleInputChange} placeholder="Optional" className={inputClass} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Category *</label>
                                        <select name="category" value={formData.category} onChange={handleInputChange} required className={`${inputClass} bg-white`}>
                                            <option value="">Select category</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Stock quantity *</label>
                                        <input type="number" name="stock_quantity" value={formData.stock_quantity} onChange={handleInputChange} min="0" required className={inputClass} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Cost price (KSh) *</label>
                                        <input type="number" name="cost_price" value={formData.cost_price} onChange={handleInputChange} step="0.01" min="0" required className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Selling price (KSh) *</label>
                                        <input type="number" name="selling_price" value={formData.selling_price} onChange={handleInputChange} step="0.01" min="0" required className={inputClass} />
                                    </div>
                                </div>

                                <div>
                                    <label className={labelClass}>Reorder level</label>
                                    <input type="number" name="reorder_level" value={formData.reorder_level} onChange={handleInputChange} min="0" className={inputClass} />
                                </div>

                                <div>
                                    <label className={labelClass}>Description</label>
                                    <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" className={`${inputClass} resize-none`} />
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <button type="button" className="px-4 py-2.5 border border-brand-ink/[0.16] rounded-xl hover:bg-brand-surface transition-colors font-semibold cursor-pointer" onClick={() => setShowEditModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="px-4 py-2.5 bg-brand-ink text-brand-surface rounded-xl hover:bg-brand-ink/90 transition-colors font-semibold cursor-pointer">
                                        Update product
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Restock Modal */}
                {showRestockModal && selectedProduct && (
                    <div className="fixed inset-0 bg-[rgba(12,34,37,0.5)] backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowRestockModal(false)}>
                        <div className="bg-white rounded-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-ink/10">
                                <h2 className="text-lg font-semibold">Restock product</h2>
                                <button className="text-brand-ink/40 hover:text-brand-ink cursor-pointer" onClick={() => setShowRestockModal(false)}>
                                    <CloseIcon />
                                </button>
                            </div>

                            <form onSubmit={handleRestock} className="p-6 grid gap-4">
                                <div className="bg-brand-surface rounded-xl p-4">
                                    <p className="text-sm text-brand-ink/65">Product: <span className="font-semibold text-brand-ink">{selectedProduct.name}</span></p>
                                    <p className="text-sm text-brand-ink/65">Current stock: <span className="font-semibold text-brand-ink">{selectedProduct.stock_quantity} units</span></p>
                                </div>

                                <div>
                                    <label className={labelClass}>Add quantity *</label>
                                    <input
                                        type="number"
                                        value={restockAmount}
                                        onChange={(e) => setRestockAmount(e.target.value)}
                                        min="1"
                                        required
                                        autoFocus
                                        className={inputClass}
                                    />
                                </div>

                                {restockAmount && (
                                    <div className="rounded-xl p-3 text-sm" style={{ background: 'rgba(47,122,95,0.1)', color: '#2f7a5f' }}>
                                        New stock: <span className="font-semibold">{parseInt(selectedProduct.stock_quantity) + parseInt(restockAmount)} units</span>
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 pt-2">
                                    <button type="button" className="px-4 py-2.5 border border-brand-ink/[0.16] rounded-xl hover:bg-brand-surface transition-colors font-semibold cursor-pointer" onClick={() => setShowRestockModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="px-4 py-2.5 bg-brand-ink text-brand-surface rounded-xl hover:bg-brand-ink/90 transition-colors font-semibold cursor-pointer">
                                        Restock
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Manage Categories Modal */}
                {showCategoryModal && (
                    <div className="fixed inset-0 bg-[rgba(12,34,37,0.5)] backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCategoryModal(false)}>
                        <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-ink/10">
                                <h2 className="text-lg font-semibold">Manage categories</h2>
                                <button className="text-brand-ink/40 hover:text-brand-ink cursor-pointer" onClick={() => setShowCategoryModal(false)}>
                                    <CloseIcon />
                                </button>
                            </div>

                            {categories.length > 0 && (
                                <div className="px-6 pt-5 grid gap-1.5">
                                    {categories.map((cat) => (
                                        <div key={cat.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-brand-surface rounded-xl">
                                            <span className="text-sm font-medium truncate">{cat.name}</span>
                                            <button
                                                onClick={() => handleDeleteCategory(cat)}
                                                className="p-1.5 text-brand-ink/50 hover:text-[#c8553d] hover:bg-[#c8553d]/10 rounded-lg transition-colors cursor-pointer flex-none"
                                                title={`Delete ${cat.name}`}
                                            >
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="px-6 pt-5 pb-1">
                                <h3 className="text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50">Add new category</h3>
                            </div>

                            <form onSubmit={handleCreateCategory} className="p-6 pt-3 grid gap-4">
                                <div>
                                    <label className={labelClass}>Category name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={categoryFormData.name}
                                        onChange={handleCategoryInputChange}
                                        required
                                        autoFocus
                                        className={inputClass}
                                        placeholder="e.g., Electronics, Beverages"
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>Description</label>
                                    <textarea
                                        name="description"
                                        value={categoryFormData.description}
                                        onChange={handleCategoryInputChange}
                                        rows="3"
                                        className={`${inputClass} resize-none`}
                                        placeholder="Optional category description"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <button type="button" className="px-4 py-2.5 border border-brand-ink/[0.16] rounded-xl hover:bg-brand-surface transition-colors font-semibold cursor-pointer" onClick={() => setShowCategoryModal(false)}>
                                        Close
                                    </button>
                                    <button type="submit" className="px-4 py-2.5 bg-brand-ink text-brand-surface rounded-xl hover:bg-brand-ink/90 transition-colors font-semibold cursor-pointer">
                                        Create category
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Inventory
