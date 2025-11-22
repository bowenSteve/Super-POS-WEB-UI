import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { productsAPI } from "../api/api"
import Sidebar from "../components/Sidebar"
import "../styles/inventory.css"

function Inventory() {
    const { user } = useAuth()
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("")
    const [showLowStock, setShowLowStock] = useState(false)
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showRestockModal, setShowRestockModal] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    // Form states
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

    // Filter products
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.sku.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = !selectedCategory || product.category === parseInt(selectedCategory)
        const matchesLowStock = !showLowStock || product.is_low_stock

        return matchesSearch && matchesCategory && matchesLowStock
    })

    // Handle form input change
    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    // Add new product
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

    // Edit product
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

    // Restock product
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

    // Open edit modal
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

    // Open restock modal
    const openRestockModal = (product) => {
        setSelectedProduct(product)
        setRestockAmount("")
        setShowRestockModal(true)
    }

    return (
        <div className="home-container">
            <Sidebar />
            <div className="main-wrapper">
                <header className="home-header">
                    <div className="header-content">
                        <h1 className="page-title">Inventory Management</h1>
                        <div className="header-actions">
                            <button className="add-product-btn" onClick={() => setShowAddModal(true)}>
                                + Add Product
                            </button>
                        </div>
                    </div>
                </header>

                <main className="inventory-main">
                    {error && (
                        <div className="alert alert-error">
                            <span className="alert-icon">⚠️</span>
                            {error}
                            <button className="alert-close" onClick={() => setError("")}>×</button>
                        </div>
                    )}

                    {success && (
                        <div className="alert alert-success">
                            <span className="alert-icon">✓</span>
                            {success}
                        </div>
                    )}

                    {/* Filters */}
                    <div className="inventory-filters">
                        <div className="filter-group">
                            <input
                                type="text"
                                className="filter-search"
                                placeholder="Search by name or SKU..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="filter-group">
                            <select
                                className="filter-select"
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                <option value="">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label className="filter-checkbox">
                                <input
                                    type="checkbox"
                                    checked={showLowStock}
                                    onChange={(e) => setShowLowStock(e.target.checked)}
                                />
                                <span>Low Stock Only</span>
                            </label>
                        </div>

                        <div className="filter-stats">
                            Total Products: <strong>{filteredProducts.length}</strong>
                        </div>
                    </div>

                    {/* Products Table */}
                    {loading ? (
                        <div className="loading-state">Loading products...</div>
                    ) : (
                        <div className="inventory-table-wrapper">
                            <table className="inventory-table">
                                <thead>
                                    <tr>
                                        <th>SKU</th>
                                        <th>Product Name</th>
                                        <th>Category</th>
                                        <th>Cost Price</th>
                                        <th>Selling Price</th>
                                        <th>Stock</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="empty-state">
                                                No products found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredProducts.map(product => (
                                            <tr key={product.id}>
                                                <td className="sku-cell">{product.sku}</td>
                                                <td className="name-cell">{product.name}</td>
                                                <td>{product.category_name}</td>
                                                <td>KSh {product.cost_price}</td>
                                                <td className="price-cell">KSh {product.selling_price}</td>
                                                <td className="stock-cell">
                                                    <span className={`stock-badge ${product.is_low_stock ? 'low' : ''}`}>
                                                        {product.stock_quantity}
                                                    </span>
                                                </td>
                                                <td>
                                                    {product.is_low_stock ? (
                                                        <span className="status-badge warning">Low Stock</span>
                                                    ) : (
                                                        <span className="status-badge success">In Stock</span>
                                                    )}
                                                </td>
                                                <td className="actions-cell">
                                                    <button
                                                        className="action-btn edit"
                                                        onClick={() => openEditModal(product)}
                                                        title="Edit Product"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        className="action-btn restock"
                                                        onClick={() => openRestockModal(product)}
                                                        title="Restock"
                                                    >
                                                        📦
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </main>

                {/* Add Product Modal */}
                {showAddModal && (
                    <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Add New Product</h2>
                                <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
                            </div>

                            <form onSubmit={handleAddProduct} className="product-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Product Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>SKU *</label>
                                        <input
                                            type="text"
                                            name="sku"
                                            value={formData.sku}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Category *</label>
                                        <select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="">Select Category</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Initial Stock Quantity *</label>
                                        <input
                                            type="number"
                                            name="stock_quantity"
                                            value={formData.stock_quantity}
                                            onChange={handleInputChange}
                                            min="0"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Cost Price (KSh) *</label>
                                        <input
                                            type="number"
                                            name="cost_price"
                                            value={formData.cost_price}
                                            onChange={handleInputChange}
                                            step="0.01"
                                            min="0"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Selling Price (KSh) *</label>
                                        <input
                                            type="number"
                                            name="selling_price"
                                            value={formData.selling_price}
                                            onChange={handleInputChange}
                                            step="0.01"
                                            min="0"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Reorder Level</label>
                                    <input
                                        type="number"
                                        name="reorder_level"
                                        value={formData.reorder_level}
                                        onChange={handleInputChange}
                                        min="0"
                                    />
                                    <small>Alert when stock falls below this level</small>
                                </div>

                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows="3"
                                    />
                                </div>

                                <div className="modal-actions">
                                    <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary">
                                        Add Product
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Product Modal */}
                {showEditModal && selectedProduct && (
                    <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Edit Product</h2>
                                <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
                            </div>

                            <form onSubmit={handleEditProduct} className="product-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Product Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>SKU *</label>
                                        <input
                                            type="text"
                                            name="sku"
                                            value={formData.sku}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Category *</label>
                                        <select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="">Select Category</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Stock Quantity *</label>
                                        <input
                                            type="number"
                                            name="stock_quantity"
                                            value={formData.stock_quantity}
                                            onChange={handleInputChange}
                                            min="0"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Cost Price (KSh) *</label>
                                        <input
                                            type="number"
                                            name="cost_price"
                                            value={formData.cost_price}
                                            onChange={handleInputChange}
                                            step="0.01"
                                            min="0"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Selling Price (KSh) *</label>
                                        <input
                                            type="number"
                                            name="selling_price"
                                            value={formData.selling_price}
                                            onChange={handleInputChange}
                                            step="0.01"
                                            min="0"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Reorder Level</label>
                                    <input
                                        type="number"
                                        name="reorder_level"
                                        value={formData.reorder_level}
                                        onChange={handleInputChange}
                                        min="0"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows="3"
                                    />
                                </div>

                                <div className="modal-actions">
                                    <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary">
                                        Update Product
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Restock Modal */}
                {showRestockModal && selectedProduct && (
                    <div className="modal-overlay" onClick={() => setShowRestockModal(false)}>
                        <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Restock Product</h2>
                                <button className="modal-close" onClick={() => setShowRestockModal(false)}>×</button>
                            </div>

                            <form onSubmit={handleRestock} className="product-form">
                                <div className="restock-info">
                                    <p><strong>Product:</strong> {selectedProduct.name}</p>
                                    <p><strong>Current Stock:</strong> {selectedProduct.stock_quantity} units</p>
                                </div>

                                <div className="form-group">
                                    <label>Add Quantity *</label>
                                    <input
                                        type="number"
                                        value={restockAmount}
                                        onChange={(e) => setRestockAmount(e.target.value)}
                                        min="1"
                                        required
                                        autoFocus
                                    />
                                </div>

                                {restockAmount && (
                                    <div className="restock-preview">
                                        New Stock: <strong>{parseInt(selectedProduct.stock_quantity) + parseInt(restockAmount)} units</strong>
                                    </div>
                                )}

                                <div className="modal-actions">
                                    <button type="button" className="btn-secondary" onClick={() => setShowRestockModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary">
                                        Restock
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
