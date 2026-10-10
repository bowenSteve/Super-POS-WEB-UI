function DashboardShimmer() {
    return (
        <div className="grid gap-5 animate-pulse">
            {/* Stat tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="bg-white border border-brand-ink/[0.09] rounded-2xl px-[22px] py-5 grid gap-3.5">
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                        <div className="h-7 bg-gray-300 rounded w-28"></div>
                    </div>
                ))}
            </div>

            {/* Chart + payment methods */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
                <div className="bg-white border border-brand-ink/[0.09] rounded-2xl p-6">
                    <div className="h-5 bg-gray-200 rounded w-36 mb-6"></div>
                    <div className="h-[220px] bg-gray-100 rounded-lg"></div>
                </div>
                <div className="bg-white border border-brand-ink/[0.09] rounded-2xl p-6">
                    <div className="h-5 bg-gray-200 rounded w-40 mb-6"></div>
                    <div className="h-2.5 bg-gray-100 rounded-full mb-6"></div>
                    <div className="space-y-2.5">
                        {[1, 2].map((item) => (
                            <div key={item} className="h-[62px] bg-gray-100 rounded-xl"></div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top selling / alerts / staff */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1, 2, 3].map((item) => (
                    <div key={item} className="bg-white border border-brand-ink/[0.09] rounded-2xl p-6">
                        <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>
                        <div className="space-y-3">
                            {[1, 2, 3].map((row) => (
                                <div key={row} className="h-8 bg-gray-100 rounded"></div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Activity */}
            <div className="bg-white border border-brand-ink/[0.09] rounded-2xl p-6">
                <div className="h-5 bg-gray-200 rounded w-24 mb-4"></div>
                <div className="space-y-3">
                    {[1, 2, 3, 4].map((row) => (
                        <div key={row} className="h-6 bg-gray-100 rounded"></div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default DashboardShimmer
