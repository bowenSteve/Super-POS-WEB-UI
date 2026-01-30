import { useNavigate } from 'react-router-dom'
import Sidebar from "../components/Sidebar"
import { ProfileSettings } from "../features/profile"
import { useAuth } from '../context/AuthContext'
import { FiUser, FiArrowLeft, FiShoppingBag, FiCheck, FiPlus, FiLogOut, FiUsers } from 'react-icons/fi'

function Profile() {
    const navigate = useNavigate()
    const { shops, currentShop, switchShop, logout } = useAuth()

    const handleShopSwitch = (shop) => {
        switchShop(shop)
    }

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <div className="flex min-h-screen bg-pos-bg">
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="bg-white px-6 py-4 border-b border-pos-border">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-pos-hover rounded-lg transition-colors"
                        >
                            <FiArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div className="flex items-center gap-3">
                            <FiUser className="w-6 h-6 text-pos-primary" />
                            <h1 className="text-2xl font-bold text-pos-text">My Profile</h1>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-4xl space-y-6">
                        {/* Shop Selector Section */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-pos-text flex items-center gap-2">
                                    <FiShoppingBag className="w-5 h-5 text-pos-primary" />
                                    My Shops
                                </h2>
                                <button
                                    onClick={() => navigate('/create-shop')}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-pos-primary text-white rounded-lg hover:bg-pos-primary/90 transition-colors"
                                >
                                    <FiPlus className="w-4 h-4" />
                                    Create Shop
                                </button>
                            </div>

                            <div className="space-y-2">
                                {shops && shops.length > 0 ? (
                                    shops.filter(sm => sm?.shop).map((shopMembership) => {
                                        const shop = shopMembership.shop
                                        const isSelected = currentShop?.id === shop?.id

                                        return (
                                            <button
                                                key={shop.id}
                                                onClick={() => handleShopSwitch(shopMembership)}
                                                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                                                    isSelected
                                                        ? 'bg-pos-primary/10 border-2 border-pos-primary'
                                                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <FiShoppingBag className={`w-5 h-5 ${isSelected ? 'text-pos-primary' : 'text-gray-400'}`} />
                                                    <div className="text-left">
                                                        <p className={`text-sm font-medium ${isSelected ? 'text-pos-primary' : 'text-pos-text'}`}>
                                                            {shop.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500 capitalize">{shopMembership.role}</p>
                                                    </div>
                                                </div>
                                                {isSelected && (
                                                    <FiCheck className="w-5 h-5 text-pos-primary" />
                                                )}
                                            </button>
                                        )
                                    })
                                ) : (
                                    <div className="text-center py-6">
                                        <p className="text-gray-500 mb-3">No shops available</p>
                                        <button
                                            onClick={() => navigate('/create-shop')}
                                            className="text-pos-primary hover:underline"
                                        >
                                            Create your first shop
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Profile Settings */}
                        <ProfileSettings />

                        {/* Quick Actions */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-lg font-semibold text-pos-text mb-4">Quick Actions</h2>
                            <div className="space-y-2">
                                <button
                                    onClick={() => navigate('/settings')}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                                >
                                    <FiUsers className="w-5 h-5 text-pos-primary" />
                                    <div>
                                        <p className="text-sm font-medium text-pos-text">Staff Management</p>
                                        <p className="text-xs text-gray-500">Manage staff members and permissions</p>
                                    </div>
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 transition-colors text-left"
                                >
                                    <FiLogOut className="w-5 h-5 text-red-600" />
                                    <div>
                                        <p className="text-sm font-medium text-red-600">Logout</p>
                                        <p className="text-xs text-red-400">Sign out of your account</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default Profile
