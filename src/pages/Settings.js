import { useState, useEffect } from 'react'
import Sidebar from "../components/Sidebar"
import ProfileDropdown from "../components/ProfileDropdown"
import { ProfileSettings, StaffManagement } from "../features/profile"
import { useAuth } from "../context/AuthContext"
import { shopsAPI } from "../api/api"
import { FiUser, FiUsers, FiSettings, FiShoppingBag, FiPercent, FiFileText, FiSave } from 'react-icons/fi'
import ToastNotification, { toast } from '../components/ToastNotification'

// Default settings
const defaultTaxSettings = {
    enabled: true,
    rate: 16,
    name: 'VAT',
    includeInPrice: false,
    showOnReceipt: true,
    taxNumber: ''
}

const defaultReceiptSettings = {
    showLogo: true,
    headerText: '',
    footerText: 'Thank you for your business!',
    showTaxBreakdown: true,
    showCashierName: true,
    showDateTime: true,
    showTransactionId: true,
    paperSize: '80mm',
    fontSize: 'medium'
}

function Settings() {
    const { currentShop, updateCurrentShop } = useAuth()
    const [activeTab, setActiveTab] = useState('profile')
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(true)

    // Shop Settings State
    const [shopSettings, setShopSettings] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
        currency: 'KES',
        timezone: 'Africa/Nairobi'
    })

    // Tax Settings State
    const [taxSettings, setTaxSettings] = useState(defaultTaxSettings)

    // Receipt Settings State
    const [receiptSettings, setReceiptSettings] = useState(defaultReceiptSettings)

    const tabs = [
        { id: 'profile', label: 'Profile', icon: FiUser },
        { id: 'staff', label: 'Staff', icon: FiUsers },
        { id: 'shop', label: 'Shop', icon: FiShoppingBag },
        { id: 'tax', label: 'Tax', icon: FiPercent },
        { id: 'receipt', label: 'Receipt', icon: FiFileText },
    ]

    // Load settings from currentShop when it changes
    useEffect(() => {
        if (currentShop) {
            // Shop settings
            setShopSettings({
                name: currentShop.name || '',
                address: currentShop.address || '',
                phone: currentShop.phone || '',
                email: currentShop.email || '',
                currency: currentShop.currency || 'KES',
                timezone: currentShop.timezone || 'Africa/Nairobi'
            })

            // Tax settings from backend (with defaults)
            const backendTaxSettings = currentShop.tax_settings || {}
            setTaxSettings({
                ...defaultTaxSettings,
                ...backendTaxSettings
            })

            // Receipt settings from backend (with defaults)
            const backendReceiptSettings = currentShop.receipt_settings || {}
            setReceiptSettings({
                ...defaultReceiptSettings,
                ...backendReceiptSettings
            })

            // Sync to localStorage for Sales page
            syncToLocalStorage(
                { ...defaultTaxSettings, ...backendTaxSettings },
                { ...defaultReceiptSettings, ...backendReceiptSettings }
            )

            setLoading(false)
        }
    }, [currentShop])

    // Sync settings to localStorage for other pages (Sales, etc.)
    const syncToLocalStorage = (tax, receipt) => {
        localStorage.setItem('pos_taxSettings', JSON.stringify(tax))
        localStorage.setItem('pos_taxRate', tax.rate.toString())
        localStorage.setItem('pos_taxEnabled', JSON.stringify(tax.enabled))
        localStorage.setItem('pos_receiptSettings', JSON.stringify(receipt))
    }

    // Helper to extract error message from DRF response
    const getErrorMessage = (error) => {
        if (!error.response?.data) {
            return 'Network error. Please try again.'
        }

        const data = error.response.data

        // Handle string error message
        if (typeof data === 'string') {
            return data
        }

        // Handle { detail: "message" } format
        if (data.detail) {
            return data.detail
        }

        // Handle { field: ["error1", "error2"] } format from DRF validation
        const fieldErrors = Object.entries(data)
            .map(([field, errors]) => {
                const errorMsg = Array.isArray(errors) ? errors[0] : errors
                return `${field}: ${errorMsg}`
            })
            .join(', ')

        return fieldErrors || 'Failed to save settings'
    }

    // Save all settings to backend
    const saveSettings = async (settingsType) => {
        if (!currentShop?.id) {
            toast.error('No shop selected')
            return
        }

        setSaving(true)
        try {
            const updateData = {}

            if (settingsType === 'shop' || settingsType === 'all') {
                updateData.name = shopSettings.name
                updateData.address = shopSettings.address || ''
                updateData.phone = shopSettings.phone || ''
                // Only include email if it's not empty (EmailField validates format)
                if (shopSettings.email && shopSettings.email.trim()) {
                    updateData.email = shopSettings.email.trim()
                } else {
                    updateData.email = ''
                }
                updateData.currency = shopSettings.currency
                updateData.timezone = shopSettings.timezone
            }

            if (settingsType === 'tax' || settingsType === 'all') {
                updateData.tax_settings = taxSettings
            }

            if (settingsType === 'receipt' || settingsType === 'all') {
                updateData.receipt_settings = receiptSettings
            }

            console.log('Sending update data:', updateData)
            const response = await shopsAPI.update(currentShop.id, updateData)

            // Update current shop in context and localStorage (preserves role)
            updateCurrentShop(response.data)

            // Sync to localStorage for Sales page
            if (settingsType === 'tax' || settingsType === 'all') {
                syncToLocalStorage(taxSettings, receiptSettings)
            }
            if (settingsType === 'receipt' || settingsType === 'all') {
                syncToLocalStorage(taxSettings, receiptSettings)
            }

            toast.success(`${settingsType.charAt(0).toUpperCase() + settingsType.slice(1)} settings saved`)
        } catch (error) {
            console.error('Error saving settings:', error)
            console.error('Error response:', error.response?.data)
            toast.error(getErrorMessage(error))
        } finally {
            setSaving(false)
        }
    }

    // Shop Settings Component
    const ShopSettings = () => (
        <div className="space-y-6">
            <div className="bg-white rounded-xl border border-pos-border p-6">
                <h2 className="text-lg font-semibold text-pos-text mb-6">Shop Information</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Shop Name *
                        </label>
                        <input
                            type="text"
                            value={shopSettings.name}
                            onChange={(e) => setShopSettings({ ...shopSettings, name: e.target.value })}
                            className="w-full px-4 py-2.5 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                            placeholder="My Shop"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            value={shopSettings.email}
                            onChange={(e) => setShopSettings({ ...shopSettings, email: e.target.value })}
                            className="w-full px-4 py-2.5 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                            placeholder="shop@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            value={shopSettings.phone}
                            onChange={(e) => setShopSettings({ ...shopSettings, phone: e.target.value })}
                            className="w-full px-4 py-2.5 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                            placeholder="+254 700 000 000"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Currency
                        </label>
                        <select
                            value={shopSettings.currency}
                            onChange={(e) => setShopSettings({ ...shopSettings, currency: e.target.value })}
                            className="w-full px-4 py-2.5 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary bg-white"
                        >
                            <option value="KES">KES - Kenyan Shilling</option>
                            <option value="USD">USD - US Dollar</option>
                            <option value="EUR">EUR - Euro</option>
                            <option value="GBP">GBP - British Pound</option>
                            <option value="TZS">TZS - Tanzanian Shilling</option>
                            <option value="UGX">UGX - Ugandan Shilling</option>
                            <option value="NGN">NGN - Nigerian Naira</option>
                            <option value="ZAR">ZAR - South African Rand</option>
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Address
                        </label>
                        <textarea
                            value={shopSettings.address}
                            onChange={(e) => setShopSettings({ ...shopSettings, address: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2.5 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary resize-none"
                            placeholder="123 Main Street, Nairobi, Kenya"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Timezone
                        </label>
                        <select
                            value={shopSettings.timezone}
                            onChange={(e) => setShopSettings({ ...shopSettings, timezone: e.target.value })}
                            className="w-full px-4 py-2.5 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary bg-white"
                        >
                            <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                            <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                            <option value="Africa/Johannesburg">Africa/Johannesburg (SAST)</option>
                            <option value="Africa/Cairo">Africa/Cairo (EET)</option>
                            <option value="UTC">UTC</option>
                            <option value="Europe/London">Europe/London (GMT/BST)</option>
                            <option value="America/New_York">America/New_York (EST/EDT)</option>
                        </select>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-pos-border flex justify-end">
                    <button
                        onClick={() => saveSettings('shop')}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-pos-primary text-white rounded-lg hover:bg-pos-primary-dark transition-colors disabled:opacity-50"
                    >
                        <FiSave size={18} />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    )

    // Tax Settings Component
    const TaxSettings = () => (
        <div className="space-y-6">
            <div className="bg-white rounded-xl border border-pos-border p-6">
                <h2 className="text-lg font-semibold text-pos-text mb-6">Tax Configuration</h2>

                <div className="space-y-6">
                    {/* Enable Tax Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <p className="font-medium text-pos-text">Enable Tax</p>
                            <p className="text-sm text-gray-500">Apply tax to all sales transactions</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={taxSettings.enabled}
                                onChange={(e) => setTaxSettings({ ...taxSettings, enabled: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-pos-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pos-primary"></div>
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tax Name
                            </label>
                            <input
                                type="text"
                                value={taxSettings.name}
                                onChange={(e) => setTaxSettings({ ...taxSettings, name: e.target.value })}
                                className="w-full px-4 py-2.5 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                placeholder="VAT"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tax Rate (%)
                            </label>
                            <input
                                type="number"
                                value={taxSettings.rate}
                                onChange={(e) => setTaxSettings({ ...taxSettings, rate: parseFloat(e.target.value) || 0 })}
                                min="0"
                                max="100"
                                step="0.1"
                                className="w-full px-4 py-2.5 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                placeholder="16"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tax Registration Number
                            </label>
                            <input
                                type="text"
                                value={taxSettings.taxNumber}
                                onChange={(e) => setTaxSettings({ ...taxSettings, taxNumber: e.target.value })}
                                className="w-full px-4 py-2.5 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                                placeholder="P000000000X"
                            />
                            <p className="text-xs text-gray-500 mt-1">Your KRA PIN or tax ID (shown on receipts)</p>
                        </div>
                    </div>

                    {/* Tax Options */}
                    <div className="space-y-4">
                        <h3 className="font-medium text-pos-text">Tax Options</h3>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={taxSettings.includeInPrice}
                                onChange={(e) => setTaxSettings({ ...taxSettings, includeInPrice: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300 accent-[#211A20] focus:ring-pos-primary/20"
                            />
                            <div>
                                <p className="text-sm font-medium text-pos-text">Tax included in product prices</p>
                                <p className="text-xs text-gray-500">Product prices already include tax (tax-inclusive pricing)</p>
                            </div>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={taxSettings.showOnReceipt}
                                onChange={(e) => setTaxSettings({ ...taxSettings, showOnReceipt: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300 accent-[#211A20] focus:ring-pos-primary/20"
                            />
                            <div>
                                <p className="text-sm font-medium text-pos-text">Show tax on receipt</p>
                                <p className="text-xs text-gray-500">Display tax breakdown on printed receipts</p>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-pos-border flex justify-end">
                    <button
                        onClick={() => saveSettings('tax')}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-pos-primary text-white rounded-lg hover:bg-pos-primary-dark transition-colors disabled:opacity-50"
                    >
                        <FiSave size={18} />
                        {saving ? 'Saving...' : 'Save Tax Settings'}
                    </button>
                </div>
            </div>

            {/* Tax Preview */}
            <div className="bg-white rounded-xl border border-pos-border p-6">
                <h3 className="text-lg font-semibold text-pos-text mb-4">Preview</h3>
                <div className="bg-gray-50 rounded-lg p-4 max-w-sm">
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal</span>
                            <span>KSh 1,000.00</span>
                        </div>
                        {taxSettings.enabled && (
                            <div className="flex justify-between">
                                <span className="text-gray-600">{taxSettings.name} ({taxSettings.rate}%)</span>
                                <span>KSh {(1000 * taxSettings.rate / 100).toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-semibold pt-2 border-t border-gray-200">
                            <span>Total</span>
                            <span>KSh {taxSettings.enabled ? (1000 + (1000 * taxSettings.rate / 100)).toFixed(2) : '1,000.00'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )

    // Receipt Settings Component
    const ReceiptSettings = () => (
        <div className="space-y-6">
            <div className="bg-white rounded-xl border border-pos-border p-6">
                <h2 className="text-lg font-semibold text-pos-text mb-6">Receipt Customization</h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Settings Form */}
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Header Text
                            </label>
                            <textarea
                                value={receiptSettings.headerText}
                                onChange={(e) => setReceiptSettings({ ...receiptSettings, headerText: e.target.value })}
                                rows={2}
                                className="w-full px-4 py-2.5 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary resize-none"
                                placeholder="Welcome to our store!"
                            />
                            <p className="text-xs text-gray-500 mt-1">Displayed at the top of receipts</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Footer Text
                            </label>
                            <textarea
                                value={receiptSettings.footerText}
                                onChange={(e) => setReceiptSettings({ ...receiptSettings, footerText: e.target.value })}
                                rows={2}
                                className="w-full px-4 py-2.5 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary resize-none"
                                placeholder="Thank you for your business!"
                            />
                            <p className="text-xs text-gray-500 mt-1">Displayed at the bottom of receipts</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Paper Size
                                </label>
                                <select
                                    value={receiptSettings.paperSize}
                                    onChange={(e) => setReceiptSettings({ ...receiptSettings, paperSize: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary bg-white"
                                >
                                    <option value="58mm">58mm (2.25")</option>
                                    <option value="80mm">80mm (3.15")</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Font Size
                                </label>
                                <select
                                    value={receiptSettings.fontSize}
                                    onChange={(e) => setReceiptSettings({ ...receiptSettings, fontSize: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-pos-border rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary bg-white"
                                >
                                    <option value="small">Small</option>
                                    <option value="medium">Medium</option>
                                    <option value="large">Large</option>
                                </select>
                            </div>
                        </div>

                        {/* Receipt Options */}
                        <div className="space-y-3">
                            <h3 className="font-medium text-pos-text">Display Options</h3>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={receiptSettings.showLogo}
                                    onChange={(e) => setReceiptSettings({ ...receiptSettings, showLogo: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300 accent-[#211A20] focus:ring-pos-primary/20"
                                />
                                <span className="text-sm text-pos-text">Show shop logo</span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={receiptSettings.showTaxBreakdown}
                                    onChange={(e) => setReceiptSettings({ ...receiptSettings, showTaxBreakdown: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300 accent-[#211A20] focus:ring-pos-primary/20"
                                />
                                <span className="text-sm text-pos-text">Show tax breakdown</span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={receiptSettings.showCashierName}
                                    onChange={(e) => setReceiptSettings({ ...receiptSettings, showCashierName: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300 accent-[#211A20] focus:ring-pos-primary/20"
                                />
                                <span className="text-sm text-pos-text">Show cashier name</span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={receiptSettings.showDateTime}
                                    onChange={(e) => setReceiptSettings({ ...receiptSettings, showDateTime: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300 accent-[#211A20] focus:ring-pos-primary/20"
                                />
                                <span className="text-sm text-pos-text">Show date and time</span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={receiptSettings.showTransactionId}
                                    onChange={(e) => setReceiptSettings({ ...receiptSettings, showTransactionId: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300 accent-[#211A20] focus:ring-pos-primary/20"
                                />
                                <span className="text-sm text-pos-text">Show transaction ID</span>
                            </label>
                        </div>
                    </div>

                    {/* Receipt Preview */}
                    <div>
                        <h3 className="font-medium text-pos-text mb-4">Receipt Preview</h3>
                        <div className={`bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 ${receiptSettings.paperSize === '58mm' ? 'max-w-[220px]' : 'max-w-[300px]'} mx-auto`}>
                            <div className={`font-mono ${receiptSettings.fontSize === 'small' ? 'text-xs' : receiptSettings.fontSize === 'large' ? 'text-base' : 'text-sm'}`}>
                                {/* Header */}
                                <div className="text-center border-b border-dashed border-gray-300 pb-3 mb-3">
                                    {receiptSettings.showLogo && (
                                        <div className="w-12 h-12 bg-gray-200 rounded mx-auto mb-2 flex items-center justify-center text-gray-400">
                                            Logo
                                        </div>
                                    )}
                                    <p className="font-bold">{shopSettings.name || 'Shop Name'}</p>
                                    {shopSettings.address && <p className="text-gray-600 text-xs">{shopSettings.address}</p>}
                                    {shopSettings.phone && <p className="text-gray-600 text-xs">Tel: {shopSettings.phone}</p>}
                                    {receiptSettings.headerText && (
                                        <p className="text-gray-600 text-xs mt-1">{receiptSettings.headerText}</p>
                                    )}
                                </div>

                                {/* Transaction Info */}
                                <div className="text-xs text-gray-600 mb-3">
                                    {receiptSettings.showTransactionId && <p>Receipt #: TXN-001234</p>}
                                    {receiptSettings.showDateTime && <p>Date: {new Date().toLocaleDateString()}</p>}
                                    {receiptSettings.showCashierName && <p>Cashier: John Doe</p>}
                                </div>

                                {/* Items */}
                                <div className="border-t border-dashed border-gray-300 py-3">
                                    <div className="flex justify-between mb-1">
                                        <span>Product A x2</span>
                                        <span>500.00</span>
                                    </div>
                                    <div className="flex justify-between mb-1">
                                        <span>Product B x1</span>
                                        <span>500.00</span>
                                    </div>
                                </div>

                                {/* Totals */}
                                <div className="border-t border-dashed border-gray-300 pt-2">
                                    <div className="flex justify-between text-xs">
                                        <span>Subtotal:</span>
                                        <span>1,000.00</span>
                                    </div>
                                    {receiptSettings.showTaxBreakdown && taxSettings.enabled && (
                                        <div className="flex justify-between text-xs">
                                            <span>{taxSettings.name} ({taxSettings.rate}%):</span>
                                            <span>{(1000 * taxSettings.rate / 100).toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-bold mt-1">
                                        <span>TOTAL:</span>
                                        <span>KSh {(1000 + (taxSettings.enabled ? 1000 * taxSettings.rate / 100 : 0)).toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Footer */}
                                {receiptSettings.footerText && (
                                    <div className="text-center border-t border-dashed border-gray-300 mt-3 pt-3">
                                        <p className="text-xs text-gray-600">{receiptSettings.footerText}</p>
                                    </div>
                                )}

                                {taxSettings.taxNumber && (
                                    <p className="text-xs text-gray-500 text-center mt-2">PIN: {taxSettings.taxNumber}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-pos-border flex justify-end">
                    <button
                        onClick={() => saveSettings('receipt')}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-pos-primary text-white rounded-lg hover:bg-pos-primary-dark transition-colors disabled:opacity-50"
                    >
                        <FiSave size={18} />
                        {saving ? 'Saving...' : 'Save Receipt Settings'}
                    </button>
                </div>
            </div>
        </div>
    )

    if (loading && !currentShop) {
        return (
            <div className="flex min-h-screen bg-pos-bg">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pos-primary"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen bg-pos-bg">
            <ToastNotification />
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="bg-white px-6 py-4 border-b border-pos-border">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <FiSettings className="w-6 h-6 text-pos-primary" />
                            <h1 className="text-2xl font-bold text-pos-text">Settings</h1>
                        </div>
                        <ProfileDropdown />
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-6">
                    {/* Tabs */}
                    <div className="mb-6 border-b border-gray-200">
                        <nav className="flex gap-1 overflow-x-auto">
                            {tabs.map((tab) => {
                                const Icon = tab.icon
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors whitespace-nowrap ${
                                            activeTab === tab.id
                                                ? 'border-pos-primary text-pos-primary'
                                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        {tab.label}
                                    </button>
                                )
                            })}
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="max-w-5xl w-full">
                        {activeTab === 'profile' && <ProfileSettings />}
                        {activeTab === 'staff' && <StaffManagement />}
                        {activeTab === 'shop' && <ShopSettings />}
                        {activeTab === 'tax' && <TaxSettings />}
                        {activeTab === 'receipt' && <ReceiptSettings />}
                    </div>
                </main>
            </div>
        </div>
    )
}

export default Settings
