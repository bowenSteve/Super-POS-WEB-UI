import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { customersAPI } from "../api/api"
import Sidebar from "../components/Sidebar"
import ToastNotification, { toast } from '../components/ToastNotification'

function Customers() {
    const { user, currentShop } = useAuth()
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
            const customerData = {
                name: formData.name.trim(),
                email: formData.email.trim() || undefined,
                phone: formData.phone.trim() || undefined,
                address: formData.address.trim() || undefined,
                is_active: formData.is_active
            }
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
            const customerData = {
                name: formData.name.trim(),
                email: formData.email.trim() || undefined,
                phone: formData.phone.trim() || undefined,
                address: formData.address.trim() || undefined,
                is_active: formData.is_active
            }
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
        return new Date(dateString).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })
    }

    const abbr = (name) => (name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    const initials = (user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase() + (user?.last_name?.[0] || '').toUpperCase()
    const inputClass = 'w-full px-3.5 py-2.5 border border-brand-ink/[0.16] rounded-xl outline-none focus:border-brand-ink transition-colors'
    const labelClass = 'block text-sm font-semibold mb-1.5'

    return (
        <div className="flex min-h-screen bg-brand-surface font-sans text-brand-ink">
            <ToastNotification />
            <Sidebar />
            <div className="flex-1 min-w-0">
                <header className="sticky top-0 z-20 bg-brand-surface/[0.9] backdrop-blur-md border-b border-brand-ink/[0.09]">
                    <div className="flex items-center gap-4 px-8 py-4">
                        <h1 className="text-[22px] font-semibold tracking-[-0.03em] flex-1">Customers</h1>
                        <button
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-ink text-brand-surface rounded-xl hover:bg-brand-ink/90 transition-colors font-semibold cursor-pointer"
                            onClick={() => {
                                if (!currentShop) {
                                    toast.error("Please select a shop from your profile to add customers")
                                    return
                                }
                                setShowAddModal(true)
                            }}
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            Add customer
                        </button>
                        <span className="w-[38px] h-[38px] rounded-full bg-brand-ink text-brand-surface grid place-items-center text-[13px] font-semibold">{initials}</span>
                    </div>
                </header>

                <main className="px-8 py-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-px bg-brand-ink/[0.09] border border-brand-ink/[0.09] rounded-2xl overflow-hidden mb-5">
                        <div className="bg-brand-ink text-brand-surface px-[22px] py-5">
                            <div className="text-[12.5px] text-brand-surface/65">Total customers</div>
                            <div className="text-2xl font-semibold tracking-[-0.035em] mt-1.5">{customers.length}</div>
                        </div>
                        <div className="bg-white px-[22px] py-5">
                            <div className="text-[12.5px] text-brand-ink/60">Total revenue</div>
                            <div className="text-2xl font-semibold tracking-[-0.035em] mt-1.5">
                                KSh {customers.reduce((sum, c) => sum + parseFloat(c.total_purchases || 0), 0).toFixed(2)}
                            </div>
                        </div>
                        <div className="bg-white px-[22px] py-5">
                            <div className="text-[12.5px] text-brand-ink/60">Total transactions</div>
                            <div className="text-2xl font-semibold tracking-[-0.035em] mt-1.5">
                                {customers.reduce((sum, c) => sum + (c.total_transactions || 0), 0)}
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white border border-brand-ink/[0.09] rounded-2xl p-3.5 flex flex-wrap items-center gap-3 mb-5">
                        <label className="flex-1 min-w-[220px] flex items-center gap-2.5 bg-brand-surface rounded-xl px-3 h-[42px] focus-within:ring-1 focus-within:ring-brand-ink transition-shadow">
                            <svg className="w-4 h-4 opacity-50 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg>
                            <input
                                type="text"
                                className="flex-1 min-w-0 border-0 outline-none bg-transparent text-sm"
                                placeholder="Search by name, email, or phone…"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-sm">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded accent-brand-ink"
                                checked={showActiveOnly}
                                onChange={(e) => setShowActiveOnly(e.target.checked)}
                            />
                            Active only
                        </label>

                        <div className="text-sm text-brand-ink/60">
                            Total: <span className="font-semibold text-brand-ink">{filteredCustomers.length}</span> customers
                        </div>
                    </div>

                    {/* Customers Table */}
                    {loading ? (
                        <div className="bg-white border border-brand-ink/[0.09] rounded-2xl p-12 text-center text-brand-ink/55">
                            Loading customers…
                        </div>
                    ) : (
                        <div className="bg-white border border-brand-ink/[0.09] rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-[13.5px]">
                                    <thead className="bg-[#fafcfb] border-b border-brand-ink/[0.08]">
                                        <tr>
                                            <th className="text-left px-[18px] py-3 text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50">Name</th>
                                            <th className="text-left px-3 py-3 text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50">Email</th>
                                            <th className="text-left px-3 py-3 text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50">Phone</th>
                                            <th className="text-left px-3 py-3 text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50">Total purchases</th>
                                            <th className="text-left px-3 py-3 text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50">Transactions</th>
                                            <th className="text-left px-3 py-3 text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50">Status</th>
                                            <th className="text-left px-3 py-3 text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50">Joined</th>
                                            <th className="text-left px-[18px] py-3 text-[11.5px] font-semibold tracking-[0.06em] uppercase text-brand-ink/50">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-brand-ink/[0.06]">
                                        {filteredCustomers.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" className="px-4 py-12 text-center text-brand-ink/55">
                                                    No customers found
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredCustomers.map(customer => (
                                                <tr key={customer.id} className="hover:bg-brand-surface/60 transition-colors">
                                                    <td className="px-[18px] py-3 font-semibold">{customer.name}</td>
                                                    <td className="px-3 py-3 text-brand-ink/65">{customer.email || '-'}</td>
                                                    <td className="px-3 py-3 text-brand-ink/65">{customer.phone || '-'}</td>
                                                    <td className="px-3 py-3 font-mono font-medium">
                                                        KSh {parseFloat(customer.total_purchases || 0).toFixed(2)}
                                                    </td>
                                                    <td className="px-3 py-3 text-brand-ink/65">{customer.total_transactions || 0}</td>
                                                    <td className="px-3 py-3">
                                                        <span
                                                            className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold"
                                                            style={customer.is_active ? { background: 'rgba(47,122,95,0.12)', color: '#2f7a5f' } : { background: 'rgba(20,55,59,0.08)', color: 'rgba(20,55,59,0.6)' }}
                                                        >
                                                            {customer.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-3 text-brand-ink/65">
                                                        {formatDate(customer.created_at)}
                                                    </td>
                                                    <td className="px-[18px] py-3">
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                className="p-2 text-brand-ink/55 hover:text-brand-ink hover:bg-brand-surface rounded-lg transition-colors cursor-pointer"
                                                                onClick={() => openViewModal(customer)}
                                                                title="View details"
                                                            >
                                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                                            </button>
                                                            <button
                                                                className="p-2 text-brand-ink/55 hover:text-brand-ink hover:bg-brand-surface rounded-lg transition-colors cursor-pointer"
                                                                onClick={() => openEditModal(customer)}
                                                                title="Edit customer"
                                                            >
                                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                            </button>
                                                            <button
                                                                className="p-2 text-brand-ink/55 hover:text-[#c8553d] hover:bg-[#c8553d]/5 rounded-lg transition-colors cursor-pointer"
                                                                onClick={() => openDeleteModal(customer)}
                                                                title="Delete customer"
                                                            >
                                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
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
                    <div className="fixed inset-0 bg-[rgba(12,34,37,0.5)] backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
                        <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-ink/10">
                                <h2 className="text-lg font-semibold">Add new customer</h2>
                                <button className="text-brand-ink/40 hover:text-brand-ink cursor-pointer" onClick={() => setShowAddModal(false)}>
                                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>

                            <form onSubmit={handleAddCustomer} className="p-6 grid gap-4">
                                <div>
                                    <label className={labelClass}>Customer name *</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className={inputClass} placeholder="Enter customer name" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Email</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} className={inputClass} placeholder="email@example.com" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Phone</label>
                                        <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className={inputClass} placeholder="e.g., +254 712 345 678" />
                                    </div>
                                </div>

                                <div>
                                    <label className={labelClass}>Address</label>
                                    <textarea name="address" value={formData.address} onChange={handleInputChange} rows="3" className={`${inputClass} resize-none`} placeholder="Enter customer address" />
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <button type="button" className="px-4 py-2.5 border border-brand-ink/[0.16] rounded-xl hover:bg-brand-surface transition-colors font-semibold cursor-pointer" onClick={() => setShowAddModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="px-4 py-2.5 bg-brand-ink text-brand-surface rounded-xl hover:bg-brand-ink/90 transition-colors font-semibold cursor-pointer">
                                        Add customer
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Customer Modal */}
                {showEditModal && selectedCustomer && (
                    <div className="fixed inset-0 bg-[rgba(12,34,37,0.5)] backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowEditModal(false)}>
                        <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-ink/10">
                                <h2 className="text-lg font-semibold">Edit customer</h2>
                                <button className="text-brand-ink/40 hover:text-brand-ink cursor-pointer" onClick={() => setShowEditModal(false)}>
                                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>

                            <form onSubmit={handleEditCustomer} className="p-6 grid gap-4">
                                <div>
                                    <label className={labelClass}>Customer name *</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className={inputClass} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Email</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Phone</label>
                                        <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className={inputClass} />
                                    </div>
                                </div>

                                <div>
                                    <label className={labelClass}>Address</label>
                                    <textarea name="address" value={formData.address} onChange={handleInputChange} rows="3" className={`${inputClass} resize-none`} />
                                </div>

                                <label className="flex items-center gap-2.5 text-sm cursor-pointer">
                                    <input type="checkbox" id="is_active" name="is_active" checked={formData.is_active} onChange={handleInputChange} className="w-4 h-4 rounded accent-brand-ink" />
                                    Active customer
                                </label>

                                <div className="flex justify-end gap-3 pt-2">
                                    <button type="button" className="px-4 py-2.5 border border-brand-ink/[0.16] rounded-xl hover:bg-brand-surface transition-colors font-semibold cursor-pointer" onClick={() => setShowEditModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="px-4 py-2.5 bg-brand-ink text-brand-surface rounded-xl hover:bg-brand-ink/90 transition-colors font-semibold cursor-pointer">
                                        Update customer
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* View Customer Modal */}
                {showViewModal && selectedCustomer && (
                    <div className="fixed inset-0 bg-[rgba(12,34,37,0.5)] backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowViewModal(false)}>
                        <div className="bg-white rounded-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-ink/10">
                                <h2 className="text-lg font-semibold">Customer details</h2>
                                <button className="text-brand-ink/40 hover:text-brand-ink cursor-pointer" onClick={() => setShowViewModal(false)}>
                                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>

                            <div className="p-6">
                                {/* Customer Header */}
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-16 h-16 rounded-full bg-brand-ink text-brand-surface flex items-center justify-center font-semibold text-lg">
                                        {abbr(selectedCustomer.name)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold">{selectedCustomer.name}</h3>
                                        <span
                                            className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold"
                                            style={selectedCustomer.is_active ? { background: 'rgba(47,122,95,0.12)', color: '#2f7a5f' } : { background: 'rgba(20,55,59,0.08)', color: 'rgba(20,55,59,0.6)' }}
                                        >
                                            {selectedCustomer.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>

                                {/* Contact Info */}
                                <div className="grid gap-3 mb-6">
                                    {selectedCustomer.email && (
                                        <div className="flex items-center gap-3 text-sm text-brand-ink/65">
                                            <svg className="w-4 h-4 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                                            {selectedCustomer.email}
                                        </div>
                                    )}
                                    {selectedCustomer.phone && (
                                        <div className="flex items-center gap-3 text-sm text-brand-ink/65">
                                            <svg className="w-4 h-4 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                            {selectedCustomer.phone}
                                        </div>
                                    )}
                                    {selectedCustomer.address && (
                                        <div className="flex items-start gap-3 text-sm text-brand-ink/65">
                                            <svg className="w-4 h-4 flex-none mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                            {selectedCustomer.address}
                                        </div>
                                    )}
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="bg-brand-surface rounded-xl p-4">
                                        <p className="text-xs text-brand-ink/55 mb-1">Total purchases</p>
                                        <p className="text-xl font-semibold">
                                            KSh {parseFloat(selectedCustomer.total_purchases || 0).toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="bg-brand-surface rounded-xl p-4">
                                        <p className="text-xs text-brand-ink/55 mb-1">Transactions</p>
                                        <p className="text-xl font-semibold">
                                            {selectedCustomer.total_transactions || 0}
                                        </p>
                                    </div>
                                </div>

                                {/* Timestamps */}
                                <div className="text-xs text-brand-ink/55 grid gap-0.5">
                                    <p>Joined: {formatDate(selectedCustomer.created_at)}</p>
                                    <p>Last updated: {formatDate(selectedCustomer.updated_at)}</p>
                                </div>

                                <div className="flex justify-end gap-3 pt-6">
                                    <button
                                        className="px-4 py-2.5 border border-brand-ink/[0.16] rounded-xl hover:bg-brand-surface transition-colors font-semibold cursor-pointer"
                                        onClick={() => setShowViewModal(false)}
                                    >
                                        Close
                                    </button>
                                    <button
                                        className="px-4 py-2.5 bg-brand-ink text-brand-surface rounded-xl hover:bg-brand-ink/90 transition-colors font-semibold cursor-pointer"
                                        onClick={() => {
                                            setShowViewModal(false)
                                            openEditModal(selectedCustomer)
                                        }}
                                    >
                                        Edit customer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteModal && selectedCustomer && (
                    <div className="fixed inset-0 bg-[rgba(12,34,37,0.5)] backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
                        <div className="bg-white rounded-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-ink/10">
                                <h2 className="text-lg font-semibold">Delete customer</h2>
                                <button className="text-brand-ink/40 hover:text-brand-ink cursor-pointer" onClick={() => setShowDeleteModal(false)}>
                                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>

                            <div className="p-6">
                                <p className="text-brand-ink/65 mb-4">
                                    Are you sure you want to delete <span className="font-semibold text-brand-ink">{selectedCustomer.name}</span>?
                                    This action cannot be undone.
                                </p>

                                {selectedCustomer.total_transactions > 0 && (
                                    <div className="bg-[#d98b2b]/10 border border-[#d98b2b]/25 rounded-xl p-3 mb-4">
                                        <p className="text-sm" style={{ color: '#9a6319' }}>
                                            This customer has {selectedCustomer.total_transactions} transaction(s).
                                            Consider deactivating instead of deleting.
                                        </p>
                                    </div>
                                )}

                                <div className="flex justify-end gap-3">
                                    <button
                                        className="px-4 py-2.5 border border-brand-ink/[0.16] rounded-xl hover:bg-brand-surface transition-colors font-semibold cursor-pointer"
                                        onClick={() => setShowDeleteModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="px-4 py-2.5 bg-[#c8553d] text-white rounded-xl hover:bg-[#c8553d]/90 transition-colors font-semibold cursor-pointer"
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
