import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { productsAPI } from "../api/api"
import Sidebar from "../components/Sidebar"
import ProfileDropdown from "../components/ProfileDropdown"

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
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [categoryFormData, setCategoryFormData] = useState({ name: "", description: "" })

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
            setError("Failed to fetch products")
            console.error(err)
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
        setError("")

        try {
            await productsAPI.create(formData)
            setSuccess("Product added successfully!")
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
            setTimeout(() => setSuccess(""), 3000)
        } catch (err) {
            const errorMsg = err.response?.data?.sku?.[0] || err.response?.data?.detail || "Failed to add product"
            setError(errorMsg)
        }
    }

    const handleEditProduct = async (e) => {
        e.preventDefault()
        setError("")

        try {
            await productsAPI.update(selectedProduct.id, formData)
            setSuccess("Product updated successfully!")
            setShowEditModal(false)
            setSelectedProduct(null)
            fetchProducts()
            setTimeout(() => setSuccess(""), 3000)
        } catch (err) {
            const errorMsg = err.response?.data?.detail || "Failed to update product"
            setError(errorMsg)
        }
    }

    const handleRestock = async (e) => {
        e.preventDefault()
        setError("")

        const newStock = parseInt(selectedProduct.stock_quantity) + parseInt(restockAmount)

        try {
            await productsAPI.update(selectedProduct.id, {
                stock_quantity: newStock
            })
            setSuccess(`Restocked ${selectedProduct.name} successfully!`)
            setShowRestockModal(false)
            setSelectedProduct(null)
            setRestockAmount("")
            fetchProducts()
            setTimeout(() => setSuccess(""), 3000)
        } catch (err) {
            setError("Failed to restock product")
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
        setError("")

        try {
            await productsAPI.createCategory(categoryFormData)
            setSuccess("Category created successfully!")
            setShowCategoryModal(false)
            setCategoryFormData({ name: "", description: "" })
            fetchCategories()
            setTimeout(() => setSuccess(""), 3000)
        } catch (err) {
            const errorMsg = err.response?.data?.name?.[0] || err.response?.data?.detail || "Failed to create category"
            setError(errorMsg)
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
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <header className="bg-white px-6 py-4 border-b border-pos-border flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-pos-text">Inventory Management</h1>
                    <div className="flex items-center gap-4">
                        <button
                            className="inline-flex items-center gap-2 px-4 py-2 bg-pos-primary text-white rounded-lg hover:bg-pos-text/90 transition-colors"
                            onClick={() => {
                                if (!currentShop) {
                                    setError("Please select a shop from your profile to add products")
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
                    {error && (
                        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                            <AlertIcon />
                            <span>{error}</span>
                            <button className="ml-auto text-red-500 hover:text-red-700" onClick={() => setError("")}>
                                <CloseIcon />
                            </button>
                        </div>
                    )}

                    {success && (
                        <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
                            <CheckIcon />
                            <span>{success}</span>
                        </div>
                    )}

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
                                            setError("Please select a shop from your profile to add categories")
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
                                                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
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
