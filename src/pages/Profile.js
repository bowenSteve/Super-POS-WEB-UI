import { useNavigate } from 'react-router-dom'
import Sidebar from "../components/Sidebar"
import { ProfileSettings } from "../features/profile"
import { useAuth } from '../context/AuthContext'
import { FiArrowLeft, FiShoppingBag, FiCheck, FiPlus, FiLogOut, FiUsers } from 'react-icons/fi'

function Profile() {
    const navigate = useNavigate()
    const { user, shops, currentShop, switchShop, logout } = useAuth()

    const handleShopSwitch = (shop) => {
        switchShop(shop)
    }

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const initials = (user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase() + (user?.last_name?.[0] || '').toUpperCase()

    return (
        <div className="flex min-h-screen bg-brand-surface font-sans text-brand-ink">
            <Sidebar />

            <div className="flex-1 min-w-0">
                <header className="sticky top-0 z-20 bg-brand-surface/[0.9] backdrop-blur-md border-b border-brand-ink/[0.09]">
                    <div className="flex items-center gap-4 px-8 py-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 grid place-items-center bg-white border border-brand-ink/[0.12] rounded-[11px] hover:bg-white/80 transition-colors cursor-pointer"
                        >
                            <FiArrowLeft className="w-4 h-4" />
                        </button>
                        <h1 className="text-[22px] font-semibold tracking-[-0.03em] flex-1">My profile</h1>
                        <span className="w-[38px] h-[38px] rounded-full bg-brand-ink text-brand-surface grid place-items-center text-[13px] font-semibold">{initials}</span>
                    </div>
                </header>

                <main className="px-8 py-6">
                    <div className="max-w-4xl grid gap-5">
                        {/* Shop Selector Section */}
                        <div className="bg-white rounded-2xl border border-brand-ink/[0.09] p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base font-semibold flex items-center gap-2.5">
                                    <FiShoppingBag className="w-5 h-5 text-brand-ink/60" />
                                    My shops
                                </h2>
                                <button
                                    onClick={() => navigate('/create-shop')}
                                    className="flex items-center gap-2 px-3.5 py-2 text-sm bg-brand-ink text-brand-surface rounded-xl hover:bg-brand-ink/90 transition-colors font-semibold cursor-pointer"
                                >
                                    <FiPlus className="w-4 h-4" />
                                    Create shop
                                </button>
                            </div>

                            <div className="grid gap-2">
                                {shops && shops.length > 0 ? (
                                    shops.filter(sm => sm?.shop).map((shopMembership) => {
                                        const shop = shopMembership.shop
                                        const isSelected = currentShop?.id === shop?.id

                                        return (
                                            <button
                                                key={shop.id}
                                                onClick={() => handleShopSwitch(shopMembership)}
                                                className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors cursor-pointer"
                                                style={{
                                                    background: isSelected ? 'rgba(20,55,59,0.06)' : '#f0f8f5',
                                                    border: `1.5px solid ${isSelected ? '#14373b' : 'transparent'}`
                                                }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <FiShoppingBag className="w-5 h-5" style={{ color: isSelected ? '#14373b' : 'rgba(20,55,59,0.35)' }} />
                                                    <div className="text-left">
                                                        <p className="text-sm font-semibold">{shop.name}</p>
                                                        <p className="text-xs text-brand-ink/55 capitalize">{shopMembership.role}</p>
                                                    </div>
                                                </div>
                                                {isSelected && <FiCheck className="w-5 h-5" />}
                                            </button>
                                        )
                                    })
                                ) : (
                                    <div className="text-center py-6">
                                        <p className="text-brand-ink/55 mb-3">No shops available</p>
                                        <button
                                            onClick={() => navigate('/create-shop')}
                                            className="text-brand-ink font-semibold hover:underline cursor-pointer"
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
                        <div className="bg-white rounded-2xl border border-brand-ink/[0.09] p-6">
                            <h2 className="text-base font-semibold mb-4">Quick actions</h2>
                            <div className="grid gap-1">
                                <button
                                    onClick={() => navigate('/settings')}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-brand-surface transition-colors text-left cursor-pointer"
                                >
                                    <FiUsers className="w-5 h-5 text-brand-ink/60" />
                                    <div>
                                        <p className="text-sm font-semibold">Staff management</p>
                                        <p className="text-xs text-brand-ink/55">Manage staff members and permissions</p>
                                    </div>
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#c8553d]/5 transition-colors text-left cursor-pointer"
                                >
                                    <FiLogOut className="w-5 h-5 text-[#c8553d]" />
                                    <div>
                                        <p className="text-sm font-semibold text-[#c8553d]">Logout</p>
                                        <p className="text-xs text-[#c8553d]/70">Sign out of your account</p>
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
