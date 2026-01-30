import { useState } from 'react'
import Sidebar from "../components/Sidebar"
import ProfileDropdown from "../components/ProfileDropdown"
import { ProfileSettings, StaffManagement } from "../features/profile"
import { FiUser, FiUsers, FiSettings } from 'react-icons/fi'

function Settings() {
    const [activeTab, setActiveTab] = useState('profile')

    const tabs = [
        { id: 'profile', label: 'Profile', icon: FiUser },
        { id: 'staff', label: 'Staff Management', icon: FiUsers },
    ]

    return (
        <div className="flex min-h-screen bg-pos-bg">
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
                        <nav className="flex gap-4">
                            {tabs.map((tab) => {
                                const Icon = tab.icon
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors ${
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
                    <div className="max-w-7xl w-full">
                        {activeTab === 'profile' && <ProfileSettings />}
                        {activeTab === 'staff' && <StaffManagement />}
                    </div>
                </main>
            </div>
        </div>
    )
}

export default Settings
