import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { customersAPI } from "../api/api"
import Sidebar from "../components/Sidebar"
import ProfileDropdown from "../components/ProfileDropdown"
import ToastNotification, { toast } from '../components/ToastNotification'

function Customers() {
    const { currentShop } = useAuth()
    const [customers, setCustomers] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [showActiveOnly, setShowActiveOnly] = useState(false)
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showViewModal, setShowViewModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [selectedCustomer, setSelectedCustomer] = useState(null)
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        is_active: true
    })

    useEffect(() => {
        fetchCustomers()
    }, [])

    const fetchCustomers = async () => {
        setLoading(true)
        try {
            const response = await customersAPI.getAll()
            const customersData = response.data.results || response.data
            setCustomers(Array.isArray(customersData) ? customersData : [])
        } catch (err) {
            const errorMsg = err.response?.data?.detail || err.response?.data?.error || "Failed to fetch customers"
            toast.error(errorMsg)
            console.error('Fetch customers error:', err.response || err)
            setCustomers([])
        } finally {
            setLoading(false)
        }
    }

    const filteredCustomers = customers.filter(customer => {
        const matchesSearch =
            (customer.name && customer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (customer.phone && customer.phone.toLowerCase().includes(searchTerm.toLowerCase()))
        const matchesActive = !showActiveOnly || customer.is_active

        return matchesSearch && matchesActive
    })

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        })
    }

    const handleAddCustomer = async (e) => {
        e.preventDefault()

        try {
            // Clean data - remove empty strings to avoid unique constraint issues
            const customerData = {
                name: formData.name.trim(),
                email: formData.email.trim() || undefined,
                phone: formData.phone.trim() || undefined,
                address: formData.address.trim() || undefined,
                is_active: formData.is_active
            }
            // Remove undefined fields
            Object.keys(customerData).forEach(key =>
                customerData[key] === undefined && delete customerData[key]
            )

            await customersAPI.create(customerData)
            toast.success("Customer added successfully!")
            setShowAddModal(false)
            setFormData({
                name: "",
                email: "",
                phone: "",
                address: "",
                is_active: true
            })
            fetchCustomers()
        } catch (err) {
            const errorMsg = err.response?.data?.email?.[0] || err.response?.data?.detail || "Failed to add customer"
            toast.error(errorMsg)
        }
    }

    const handleEditCustomer = async (e) => {
        e.preventDefault()

        try {
            // Clean data - remove empty strings to avoid unique constraint issues
            const customerData = {
                name: formData.name.trim(),
                email: formData.email.trim() || undefined,
                phone: formData.phone.trim() || undefined,
                address: formData.address.trim() || undefined,
                is_active: formData.is_active
            }
            // Remove undefined fields
            Object.keys(customerData).forEach(key =>
                customerData[key] === undefined && delete customerData[key]
            )

            await customersAPI.update(selectedCustomer.id, customerData)
            toast.success("Customer updated successfully!")
            setShowEditModal(false)
            setSelectedCustomer(null)
            fetchCustomers()
        } catch (err) {
            const errorMsg = err.response?.data?.detail || "Failed to update customer"
            toast.error(errorMsg)
        }
    }

    const handleDeleteCustomer = async () => {
        try {
            await customersAPI.delete(selectedCustomer.id)
            toast.success("Customer deleted successfully!")
            setShowDeleteModal(false)
            setSelectedCustomer(null)
            fetchCustomers()
        } catch (err) {
            const errorMsg = err.response?.data?.detail || "Failed to delete customer"
            toast.error(errorMsg)
        }
    }

    const openEditModal = (customer) => {
        setSelectedCustomer(customer)
        setFormData({
            name: customer.name,
            email: customer.email || "",
            phone: customer.phone || "",
            address: customer.address || "",
            is_active: customer.is_active
        })
        setShowEditModal(true)
    }

    const openViewModal = (customer) => {
        setSelectedCustomer(customer)
        setShowViewModal(true)
    }

    const openDeleteModal = (customer) => {
        setSelectedCustomer(customer)
        setShowDeleteModal(true)
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    // SVG Icons
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

    const EyeIcon = () => (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>
    )

    const TrashIcon = () => (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
    )

    const CloseIcon = () => (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    )

    const UserIcon = () => (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
        </svg>
    )

    const PhoneIcon = () => (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
        </svg>
    )

    const MailIcon = () => (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
    )

    const MapPinIcon = () => (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
        </svg>
    )

    const DollarIcon = () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
    )

    const ShoppingBagIcon = () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
    )

    return (
        <div className="flex min-h-screen bg-pos-bg">
            <ToastNotification />
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <header className="bg-white px-6 py-4 border-b border-pos-border flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-pos-text">Customer Management</h1>
                    <div className="flex items-center gap-4">
                        <button
                            className="inline-flex items-center gap-2 px-4 py-2 bg-pos-primary text-white rounded-lg hover:bg-pos-text/90 transition-colors"
                            onClick={() => {
                                if (!currentShop) {
                                    toast.error("Please select a shop from your profile to add customers")
                                    return
                                }
                                setShowAddModal(true)
                            }}
                        >
                            <PlusIcon />
                            Add Customer
                        </button>
                        <ProfileDropdown />
                    </div>
                </header>

                <main className="flex-1 p-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-xl p-5 flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                <UserIcon />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Customers</p>
                                <p className="text-xl font-semibold text-pos-text">{customers.length}</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-5 flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                                <DollarIcon />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Revenue</p>
                                <p className="text-xl font-semibold text-pos-text">
                                    KSh {customers.reduce((sum, c) => sum + parseFloat(c.total_purchases || 0), 0).toFixed(2)}
                                </p>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-5 flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
                                <ShoppingBagIcon />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Transactions</p>
                                <p className="text-xl font-semibold text-pos-text">
                                    {customers.reduce((sum, c) => sum + (c.total_transactions || 0), 0)}
                                </p>
                            </div>
                        </div>
                    </div>

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
                                    placeholder="Search by name, email, or phone..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-pos-border accent-gray-600"
                                    checked={showActiveOnly}
                                    onChange={(e) => setShowActiveOnly(e.target.checked)}
                                />
                                <span className="text-sm text-gray-600">Active Only</span>
                            </label>

                            <div className="text-sm text-gray-600">
                                Total: <span className="font-semibold text-pos-text">{filteredCustomers.length}</span> customers
                            </div>
                        </div>
                    </div>

                    {/* Customers Table */}
                    {loading ? (
                        <div className="bg-white rounded-xl p-12 text-center text-gray-500">
                            Loading customers...
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-pos-border">
                                        <tr>
                                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Name</th>
                                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Email</th>
                                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Phone</th>
                                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Total Purchases</th>
                                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Transactions</th>
                                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Joined</th>
                                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-pos-border">
                                        {filteredCustomers.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" className="px-4 py-12 text-center text-gray-500">
                                                    No customers found
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredCustomers.map(customer => (
                                                <tr key={customer.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-sm font-medium text-pos-text">{customer.name}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">{customer.email || '-'}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">{customer.phone || '-'}</td>
                                                    <td className="px-4 py-3 text-sm font-medium text-pos-text">
                                                        KSh {parseFloat(customer.total_purchases || 0).toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">{customer.total_transactions || 0}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                                                            customer.is_active
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                            {customer.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">
                                                        {formatDate(customer.created_at)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                className="p-2 text-gray-500 hover:text-pos-text hover:bg-pos-hover rounded-lg transition-colors"
                                                                onClick={() => openViewModal(customer)}
                                                                title="View Details"
                                                            >
                                                                <EyeIcon />
                                                            </button>
                                                            <button
                                                                className="p-2 text-gray-500 hover:text-pos-text hover:bg-pos-hover rounded-lg transition-colors"
                                                                onClick={() => openEditModal(customer)}
                                                                title="Edit Customer"
                                                            >
                                                                <EditIcon />
                                                            </button>
                                                            <button
                                                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                onClick={() => openDeleteModal(customer)}
                                                                title="Delete Customer"
                                                            >
                                                                <TrashIcon />
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

                {/* Add Customer Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
                        <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between px-6 py-4 border-b border-pos-border">
                                <h2 className="text-lg font-semibold text-pos-text">Add New Customer</h2>
                                <button className="text-gray-400 hover:text-gray-600" onClick={() => setShowAddModal(false)}>
                                    <CloseIcon />
                                </button>
                            </div>

                            <form onSubmit={handleAddCustomer} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                        placeholder="Enter customer name"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                            placeholder="email@example.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                            placeholder="e.g., +254 712 345 678"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        rows="3"
                                        className="w-full px-3 py-2 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary resize-none"
                                        placeholder="Enter customer address"
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
                                        Add Customer
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Customer Modal */}
                {showEditModal && selectedCustomer && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowEditModal(false)}>
                        <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between px-6 py-4 border-b border-pos-border">
                                <h2 className="text-lg font-semibold text-pos-text">Edit Customer</h2>
                                <button className="text-gray-400 hover:text-gray-600" onClick={() => setShowEditModal(false)}>
                                    <CloseIcon />
                                </button>
                            </div>

                            <form onSubmit={handleEditCustomer} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        rows="3"
                                        className="w-full px-3 py-2 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary resize-none"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        name="is_active"
                                        checked={formData.is_active}
                                        onChange={handleInputChange}
                                        className="w-4 h-4 rounded border-gray-300 accent-gray-600"
                                    />
                                    <label htmlFor="is_active" className="text-sm text-gray-700">Active Customer</label>
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
                                        Update Customer
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* View Customer Modal */}
                {showViewModal && selectedCustomer && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowViewModal(false)}>
                        <div className="bg-white rounded-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between px-6 py-4 border-b border-pos-border">
                                <h2 className="text-lg font-semibold text-pos-text">Customer Details</h2>
                                <button className="text-gray-400 hover:text-gray-600" onClick={() => setShowViewModal(false)}>
                                    <CloseIcon />
                                </button>
                            </div>

                            <div className="p-6">
                                {/* Customer Header */}
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                                        <UserIcon />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-pos-text">{selectedCustomer.name}</h3>
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                            selectedCustomer.is_active
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {selectedCustomer.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>

                                {/* Contact Info */}
                                <div className="space-y-3 mb-6">
                                    {selectedCustomer.email && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <MailIcon />
                                            <span className="text-gray-600">{selectedCustomer.email}</span>
                                        </div>
                                    )}
                                    {selectedCustomer.phone && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <PhoneIcon />
                                            <span className="text-gray-600">{selectedCustomer.phone}</span>
                                        </div>
                                    )}
                                    {selectedCustomer.address && (
                                        <div className="flex items-start gap-3 text-sm">
                                            <MapPinIcon />
                                            <span className="text-gray-600">{selectedCustomer.address}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-500 mb-1">Total Purchases</p>
                                        <p className="text-xl font-semibold text-pos-text">
                                            KSh {parseFloat(selectedCustomer.total_purchases || 0).toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-500 mb-1">Transactions</p>
                                        <p className="text-xl font-semibold text-pos-text">
                                            {selectedCustomer.total_transactions || 0}
                                        </p>
                                    </div>
                                </div>

                                {/* Timestamps */}
                                <div className="text-xs text-gray-500 space-y-1">
                                    <p>Joined: {formatDate(selectedCustomer.created_at)}</p>
                                    <p>Last updated: {formatDate(selectedCustomer.updated_at)}</p>
                                </div>

                                <div className="flex justify-end gap-3 pt-6">
                                    <button
                                        className="px-4 py-2 text-gray-600 hover:text-pos-text hover:bg-pos-hover rounded-lg transition-colors"
                                        onClick={() => setShowViewModal(false)}
                                    >
                                        Close
                                    </button>
                                    <button
                                        className="px-4 py-2 bg-pos-primary text-white rounded-lg hover:bg-pos-text/90 transition-colors"
                                        onClick={() => {
                                            setShowViewModal(false)
                                            openEditModal(selectedCustomer)
                                        }}
                                    >
                                        Edit Customer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteModal && selectedCustomer && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
                        <div className="bg-white rounded-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between px-6 py-4 border-b border-pos-border">
                                <h2 className="text-lg font-semibold text-pos-text">Delete Customer</h2>
                                <button className="text-gray-400 hover:text-gray-600" onClick={() => setShowDeleteModal(false)}>
                                    <CloseIcon />
                                </button>
                            </div>

                            <div className="p-6">
                                <p className="text-gray-600 mb-4">
                                    Are you sure you want to delete <span className="font-semibold text-pos-text">{selectedCustomer.name}</span>?
                                    This action cannot be undone.
                                </p>

                                {selectedCustomer.total_transactions > 0 && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                                        <p className="text-sm text-yellow-800">
                                            This customer has {selectedCustomer.total_transactions} transaction(s).
                                            Consider deactivating instead of deleting.
                                        </p>
                                    </div>
                                )}

                                <div className="flex justify-end gap-3">
                                    <button
                                        className="px-4 py-2 text-gray-600 hover:text-pos-text hover:bg-pos-hover rounded-lg transition-colors"
                                        onClick={() => setShowDeleteModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                        onClick={handleDeleteCustomer}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Customers
