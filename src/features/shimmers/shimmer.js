function Shimmer() {
    return (
        <div className="animate-pulse p-4 space-y-4">
            {/* Single item shimmer - repeat this for multiple items */}
            <div className="bg-white rounded-lg shadow p-4 space-y-3">
                {/* Item name */}
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                
                {/* Item details */}
                <div className="flex justify-between items-center">
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
                
                {/* Price */}
                <div className="h-5 bg-gray-300 rounded w-1/3"></div>
            </div>

            {/* Repeat for multiple loading items */}
            <div className="bg-white rounded-lg shadow p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="flex justify-between items-center">
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
                <div className="h-5 bg-gray-300 rounded w-1/3"></div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                <div className="flex justify-between items-center">
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
                <div className="h-5 bg-gray-300 rounded w-1/3"></div>
            </div>
        </div>
    )
}

export default Shimmer;