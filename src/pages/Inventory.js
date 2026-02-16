import { useState, useEffect, useRef } from "react"
import { useAuth } from "../context/AuthContext"
import { productsAPI } from "../api/api"
import Sidebar from "../components/Sidebar"
import ProfileDropdown from "../components/ProfileDropdown"
import ToastNotification, { toast } from '../components/ToastNotification'

function Inventory() {
    const { currentShop } = useAuth()
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("")
    const [showLowStock, setShowLowStock] = useState(false)
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
        reorder_level: "10",
        description: ""
    })

    const [restockAmount, setRestockAmount] = useState("")

    useEffect(() => {
        fetchProducts()
        fetchCategories()
    }, [])

    const fetchProducts = async () => {
        setLoading(true)
        try {
            const response = await productsAPI.getAll()
            const productsData = response.data.results || response.data
            setProducts(Array.isArray(productsData) ? productsData : [])
        } catch (err) {
            const errorMsg = err.response?.data?.detail || err.response?.data?.error || "Failed to fetch products"
            toast.error(errorMsg)
            console.error('Fetch products error:', err.response || err)
            setProducts([])
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

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.sku.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = !selectedCategory || product.category === parseInt(selectedCategory)
        const matchesLowStock = !showLowStock || product.is_low_stock

        return matchesSearch && matchesCategory && matchesLowStock
    })

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
                reorder_level: "10",
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
            setShowCategoryModal(false)
            setCategoryFormData({ name: "", description: "" })
            fetchCategories()
        } catch (err) {
            const errorMsg = err.response?.data?.name?.[0] || err.response?.data?.detail || "Failed to create category"
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
        <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="M21 21l-4.35-4.35"></path>
        </svg>
    )

    const PlusIcon = () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

    return (
        <div className="flex min-h-screen bg-pos-bg">
            <ToastNotification />
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <header className="bg-white px-6 py-4 border-b border-pos-border flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-pos-text">Inventory Management</h1>
                    <div className="flex items-center gap-4">
                        {/* download excel sample */}
                        <button
                            className="inline-flex items-center gap-2 px-4 py-2 border-2 border-pos-primary text-pos-primary rounded-lg hover:bg-pos-primary hover:text-white transition-colors disabled:opacity-50"
                            onClick={handleDownloadSample}
                            disabled={importing}
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            Download Sample
                        </button>
                        <button
                            className="inline-flex items-center gap-2 px-4 py-2 border-2 border-pos-primary text-pos-primary rounded-lg hover:bg-pos-primary hover:text-white transition-colors disabled:opacity-50"
                            onClick={handleImportClick}
                            disabled={importing}
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="17 14 12 9 7 14"></polyline>
                                <line x1="12" y1="9" x2="12" y2="21"></line>
                            </svg>
                            {importing ? 'Importing...' : 'Import Excel'}
                        </button>
                        <button
                            className="inline-flex items-center gap-2 px-4 py-2 bg-pos-primary text-white rounded-lg hover:bg-pos-text/90 transition-colors"
                            onClick={() => {
                                if (!currentShop) {
                                    toast.error("Please select a shop from your profile to add products")
                                    return
                                }
                                setShowAddModal(true)
                            }}
                        >
                            <PlusIcon />
                            Add Product
                        </button>
                        <ProfileDropdown />
                    </div>
                </header>

                <main className="flex-1 p-6">
                    {/* Filters */}
                    <div className="bg-white rounded-xl p-4 mb-6">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="relative flex-1 min-w-[200px]">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                    <SearchIcon />
                                </div>
                                <input
                                    type="text"
                                    className="w-full pl-10 pr-4 py-2 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                    placeholder="Search by name or SKU..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <select
                                    className="px-4 py-2 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary bg-white"
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                >
                                    <option value="">All Categories</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => {
                                        if (!currentShop) {
                                            toast.error("Please select a shop from your profile to add categories") // <--- Fixed
                                            return
                                        }
                                        setShowCategoryModal(true)
                                    }}
                                    className="p-2 text-pos-primary hover:bg-pos-primary/10 rounded-lg transition-colors"
                                    title="Add New Category"
                                >
                                    <PlusIcon />
                                </button>
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-pos-border text-pos-primary focus:ring-pos-primary/20"
                                    checked={showLowStock}
                                    onChange={(e) => setShowLowStock(e.target.checked)}
                                />
                                <span className="text-sm text-gray-600">Low Stock Only</span>
                            </label>

                            <div className="text-sm text-gray-600">
                                Total Products: <span className="font-semibold text-pos-text">{filteredProducts.length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Products Table */}
                    {loading ? (
                        <div className="bg-white rounded-xl p-12 text-center text-gray-500">
                            Loading products...
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-pos-border">
                                        <tr>
                                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">SKU</th>
                                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Product Name</th>
                                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Category</th>
                                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Cost Price</th>
                                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Selling Price</th>
                                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Stock</th>
                                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-pos-border">
                                        {filteredProducts.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" className="px-4 py-12 text-center text-gray-500">
                                                    No products found
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredProducts.map(product => (
                                                <tr key={product.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 font-mono text-sm text-pos-text">{product.sku}</td>
                                                    <td className="px-4 py-3 text-sm font-medium text-pos-text">{product.name}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">{product.category_name}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">KSh {product.cost_price}</td>
                                                    <td className="px-4 py-3 text-sm font-medium text-pos-text">KSh {product.selling_price}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                                                            product.is_low_stock
                                                                ? 'bg-red-100 text-red-700'
                                                                : 'bg-green-100 text-green-700'
                                                        }`}>
                                                            {product.stock_quantity}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {product.is_low_stock ? (
                                                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                                                Low Stock
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                                In Stock
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                className="p-2 text-gray-500 hover:text-pos-text hover:bg-pos-hover rounded-lg transition-colors"
                                                                onClick={() => openEditModal(product)}
                                                                title="Edit Product"
                                                            >
                                                                <EditIcon />
                                                            </button>
                                                            <button
                                                                className="p-2 text-gray-500 hover:text-pos-text hover:bg-pos-hover rounded-lg transition-colors"
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
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowImportModal(false)}>
                        <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between px-6 py-4 border-b border-pos-border">
                                <h2 className="text-lg font-semibold text-pos-text">Import Results</h2>
                                <button className="text-gray-400 hover:text-gray-600" onClick={() => setShowImportModal(false)}>
                                    <CloseIcon />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                {/* Summary */}
                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-600 font-medium mb-1">Total Rows</p>
                                        <p className="text-2xl font-bold text-gray-900">{importResults.total_rows}</p>
                                    </div>
                                    <div className="bg-green-50 rounded-lg p-4">
                                        <p className="text-sm text-green-600 font-medium mb-1">Successful</p>
                                        <p className="text-2xl font-bold text-green-900">{importResults.success.length}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-600 font-medium mb-1">Failed</p>
                                        <p className="text-2xl font-bold text-gray-900">{importResults.errors.length}</p>
                                    </div>
                                </div>

                                {/* Success List */}
                                {importResults.success.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                                            <CheckIcon />
                                            Successfully Imported ({importResults.success.length})
                                        </h3>
                                        <div className="bg-green-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                                            <div className="space-y-2">
                                                {importResults.success.map((item) => (
                                                    <div key={`success-${item.row}-${item.sku}`} className="text-sm text-green-800">
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
                                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                            <AlertIcon />
                                            Errors ({importResults.errors.length})
                                        </h3>
                                        <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                                            <div className="space-y-3">
                                                {importResults.errors.map((item) => (
                                                    <div key={`error-${item.row}`} className="bg-white rounded-lg p-3 border border-gray-200">
                                                        <p className="text-sm font-medium text-gray-900 mb-1">
                                                            Row {item.row}
                                                        </p>
                                                        <p className="text-sm text-gray-700">{item.error}</p>
                                                        {item.data && (
                                                            <p className="text-xs text-gray-600 mt-1">
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

                            <div className="flex justify-end gap-3 px-6 py-4 border-t border-pos-border">
                                <button
                                    className="px-4 py-2 bg-pos-primary text-white rounded-lg hover:bg-pos-text/90 transition-colors"
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
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
                        <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between px-6 py-4 border-b border-pos-border">
                                <h2 className="text-lg font-semibold text-pos-text">Add New Product</h2>
                                <button className="text-gray-400 hover:text-gray-600" onClick={() => setShowAddModal(false)}>
                                    <CloseIcon />
                                </button>
                            </div>

                            <form onSubmit={handleAddProduct} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-3 py-2 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                                        <input
                                            type="text"
                                            name="sku"
                                            value={formData.sku}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-3 py-2 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                                        <select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-3 py-2 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary bg-white"
                                        >
                                            <option value="">Select Category</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock *</label>
                                        <input
                                            type="number"
                                            name="stock_quantity"
                                            value={formData.stock_quantity}
                                            onChange={handleInputChange}
                                            min="0"
                                            required
                                            className="w-full px-3 py-2 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price (KSh) *</label>
                                        <input
                                            type="number"
                                            name="cost_price"
                                            value={formData.cost_price}
                                            onChange={handleInputChange}
                                            step="0.01"
                                            min="0"
                                            required
                                            className="w-full px-3 py-2 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (KSh) *</label>
                                        <input
                                            type="number"
                                            name="selling_price"
                                            value={formData.selling_price}
                                            onChange={handleInputChange}
                                            step="0.01"
                                            min="0"
                                            required
                                            className="w-full px-3 py-2 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                                    <input
                                        type="number"
                                        name="reorder_level"
                                        value={formData.reorder_level}
                                        onChange={handleInputChange}
                                        min="0"
                                        className="w-full px-3 py-2 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Alert when stock falls below this level</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows="3"
                                        className="w-full px-3 py-2 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary resize-none"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        className="px-4 py-2 text-gray-600 hover:text-pos-text hover:bg-pos-hover rounded-lg transition-colors"
                                        onClick={() => setShowAddModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-pos-primary text-white rounded-lg hover:bg-pos-text/90 transition-colors"
                                    >
                                        Add Product
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Product Modal */}
                {showEditModal && selectedProduct && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowEditModal(false)}>
                        <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between px-6 py-4 border-b border-pos-border">
                                <h2 className="text-lg font-semibold text-pos-text">Edit Product</h2>
                                <button className="text-gray-400 hover:text-gray-600" onClick={() => setShowEditModal(false)}>
                                    <CloseIcon />
                                </button>
                            </div>

                            <form onSubmit={handleEditProduct} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-3 py-2 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                                        <input
                                            type="text"
                                            name="sku"
                                            value={formData.sku}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-3 py-2 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                                        <select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-3 py-2 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary bg-white"
                                        >
                                            <option value="">Select Category</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity *</label>
                                        <input
                                            type="number"
                                            name="stock_quantity"
                                            value={formData.stock_quantity}
                                            onChange={handleInputChange}
                                            min="0"
                                            required
                                            className="w-full px-3 py-2 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price (KSh) *</label>
                                        <input
                                            type="number"
                                            name="cost_price"
                                            value={formData.cost_price}
                                            onChange={handleInputChange}
                                            step="0.01"
                                            min="0"
                                            required
                                            className="w-full px-3 py-2 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (KSh) *</label>
                                        <input
                                            type="number"
                                            name="selling_price"
                                            value={formData.selling_price}
                                            onChange={handleInputChange}
                                            step="0.01"
                                            min="0"
                                            required
                                            className="w-full px-3 py-2 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                                    <input
                                        type="number"
                                        name="reorder_level"
                                        value={formData.reorder_level}
                                        onChange={handleInputChange}
                                        min="0"
                                        className="w-full px-3 py-2 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows="3"
                                        className="w-full px-3 py-2 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary resize-none"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        className="px-4 py-2 text-gray-600 hover:text-pos-text hover:bg-pos-hover rounded-lg transition-colors"
                                        onClick={() => setShowEditModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-pos-primary text-white rounded-lg hover:bg-pos-text/90 transition-colors"
                                    >
                                        Update Product
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Restock Modal */}
                {showRestockModal && selectedProduct && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowRestockModal(false)}>
                        <div className="bg-white rounded-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between px-6 py-4 border-b border-pos-border">
                                <h2 className="text-lg font-semibold text-pos-text">Restock Product</h2>
                                <button className="text-gray-400 hover:text-gray-600" onClick={() => setShowRestockModal(false)}>
                                    <CloseIcon />
                                </button>
                            </div>

                            <form onSubmit={handleRestock} className="p-6 space-y-4">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-600">Product: <span className="font-medium text-pos-text">{selectedProduct.name}</span></p>
                                    <p className="text-sm text-gray-600">Current Stock: <span className="font-medium text-pos-text">{selectedProduct.stock_quantity} units</span></p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Add Quantity *</label>
                                    <input
                                        type="number"
                                        value={restockAmount}
                                        onChange={(e) => setRestockAmount(e.target.value)}
                                        min="1"
                                        required
                                        autoFocus
                                        className="w-full px-3 py-2 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                    />
                                </div>

                                {restockAmount && (
                                    <div className="bg-green-50 rounded-lg p-3 text-sm text-green-700">
                                        New Stock: <span className="font-semibold">{parseInt(selectedProduct.stock_quantity) + parseInt(restockAmount)} units</span>
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        className="px-4 py-2 text-gray-600 hover:text-pos-text hover:bg-pos-hover rounded-lg transition-colors"
                                        onClick={() => setShowRestockModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-pos-primary text-white rounded-lg hover:bg-pos-text/90 transition-colors"
                                    >
                                        Restock
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Add Category Modal */}
                {showCategoryModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCategoryModal(false)}>
                        <div className="bg-white rounded-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between px-6 py-4 border-b border-pos-border">
                                <h2 className="text-lg font-semibold text-pos-text">Add New Category</h2>
                                <button className="text-gray-400 hover:text-gray-600" onClick={() => setShowCategoryModal(false)}>
                                    <CloseIcon />
                                </button>
                            </div>

                            <form onSubmit={handleCreateCategory} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={categoryFormData.name}
                                        onChange={handleCategoryInputChange}
                                        required
                                        autoFocus
                                        className="w-full px-3 py-2 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                        placeholder="e.g., Electronics, Beverages"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        name="description"
                                        value={categoryFormData.description}
                                        onChange={handleCategoryInputChange}
                                        rows="3"
                                        className="w-full px-3 py-2 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary resize-none"
                                        placeholder="Optional category description"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        className="px-4 py-2 text-gray-600 hover:text-pos-text hover:bg-pos-hover rounded-lg transition-colors"
                                        onClick={() => setShowCategoryModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-pos-primary text-white rounded-lg hover:bg-pos-text/90 transition-colors"
                                    >
                                        Create Category
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
