function DashboardShimmer() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Top Row - 4 Stat Cards */}
            <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="bg-white rounded-xl p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                            <div className="space-y-2">
                                <div className="h-3 bg-gray-200 rounded w-20"></div>
                                <div className="h-6 bg-gray-300 rounded w-28"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Middle Row - 3 Columns */}
            <div className="grid grid-cols-3 gap-6">
                {/* Quick Actions Shimmer */}
                <div className="bg-white rounded-xl p-5">
                    <div className="h-5 bg-gray-200 rounded w-28 mb-4"></div>
                    <div className="grid grid-cols-2 gap-3">
                        {[1, 2, 3, 4].map((item) => (
                            <div key={item} className="flex flex-col items-center gap-2 p-4 bg-gray-100 rounded-lg">
                                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                                <div className="h-3 bg-gray-200 rounded w-16"></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Payment Methods Shimmer */}
                <div className="bg-white rounded-xl p-5">
                    <div className="h-5 bg-gray-200 rounded w-36 mb-4"></div>
                    <div className="space-y-4">
                        {[1, 2].map((item) => (
                            <div key={item} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                                    <div className="space-y-1">
                                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                                        <div className="h-3 bg-gray-100 rounded w-24"></div>
                                    </div>
                                </div>
                                <div className="h-4 bg-gray-300 rounded w-20"></div>
                            </div>
                        ))}
                        <div className="pt-3 border-t border-gray-100">
                            <div className="flex gap-2">
                                <div className="h-2 bg-gray-200 rounded-full w-1/2"></div>
                                <div className="h-2 bg-gray-200 rounded-full w-1/2"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Staff Performance Shimmer */}
                <div className="bg-white rounded-xl p-5">
                    <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                        <div className="space-y-1">
                            <div className="h-4 bg-gray-200 rounded w-24"></div>
                            <div className="h-3 bg-gray-100 rounded w-16"></div>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {[1, 2, 3].map((item) => (
                            <div key={item} className="flex justify-between">
                                <div className="h-3 bg-gray-200 rounded w-24"></div>
                                <div className="h-3 bg-gray-300 rounded w-20"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Row - 3 Columns */}
            <div className="grid grid-cols-3 gap-6">
                {/* Inventory Alerts Shimmer */}
                <div className="bg-white rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-5 bg-gray-200 rounded w-32"></div>
                        <div className="h-5 bg-gray-200 rounded-full w-16"></div>
                    </div>
                    <div className="space-y-3">
                        {[1, 2, 3].map((item) => (
                            <div key={item} className="flex items-center justify-between p-2 bg-gray-100 rounded-lg">
                                <div className="space-y-1">
                                    <div className="h-4 bg-gray-200 rounded w-28"></div>
                                    <div className="h-3 bg-gray-100 rounded w-20"></div>
                                </div>
                                <div className="h-5 bg-gray-200 rounded w-14"></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Selling Shimmer */}
                <div className="bg-white rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-5 bg-gray-200 rounded w-32"></div>
                        <div className="w-5 h-5 bg-gray-200 rounded"></div>
                    </div>
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((item) => (
                            <div key={item} className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                                <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                                <div className="h-3 bg-gray-200 rounded w-14"></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Notifications Shimmer */}
                <div className="bg-white rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-5 bg-gray-200 rounded w-28"></div>
                        <div className="w-5 h-5 bg-gray-200 rounded"></div>
                    </div>
                    <div className="space-y-3">
                        {[1, 2].map((item) => (
                            <div key={item} className="flex items-start gap-3 p-3 bg-gray-100 rounded-lg">
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div>
                                <div className="space-y-1 flex-1">
                                    <div className="h-4 bg-gray-200 rounded w-28"></div>
                                    <div className="h-3 bg-gray-100 rounded w-full"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DashboardShimmer
