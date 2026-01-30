import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { FiChevronDown, FiCheck, FiShoppingBag } from 'react-icons/fi'

const ShopSelector = () => {
  const { shops, currentShop, switchShop, loadingShops } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleShopSwitch = (shop) => {
    switchShop(shop)
    setIsOpen(false)
  }

  if (loadingShops) {
    return (
      <div className="px-3 py-3">
        <div className="flex items-center space-x-2 text-gray-500">
          <FiShoppingBag className="w-5 h-5" />
          <span className="text-sm">Loading shops...</span>
        </div>
      </div>
    )
  }

  if (!shops || shops.length === 0) {
    return (
      <div className="px-3 py-3">
        <div className="flex items-center space-x-2 text-gray-500">
          <FiShoppingBag className="w-5 h-5" />
          <span className="text-sm">No shops available</span>
        </div>
      </div>
    )
  }

  return (
    <div className="px-3 py-3 border-b border-pos-border" ref={dropdownRef}>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2 bg-pos-hover hover:bg-gray-100 rounded-lg transition-colors"
        >
          <div className="flex items-center space-x-2 min-w-0">
            <FiShoppingBag className="w-5 h-5 text-pos-primary flex-shrink-0" />
            <div className="min-w-0 text-left">
              <p className="text-sm font-medium text-pos-text truncate">
                {currentShop?.name || 'Select Shop'}
              </p>
              {currentShop?.role && (
                <p className="text-xs text-gray-500 capitalize">{currentShop.role}</p>
              )}
            </div>
          </div>
          <FiChevronDown
            className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${
              isOpen ? 'transform rotate-180' : ''
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-pos-border z-50 max-h-64 overflow-y-auto">
            {shops.map((shopMembership) => {
              const shop = shopMembership.shop
              const isSelected = currentShop?.id === shop.id

              return (
                <button
                  key={shop.id}
                  onClick={() => handleShopSwitch(shopMembership)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 hover:bg-pos-hover transition-colors ${
                    isSelected ? 'bg-pos-hover' : ''
                  }`}
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <FiShoppingBag className="w-4 h-4 text-pos-primary flex-shrink-0" />
                    <div className="min-w-0 text-left">
                      <p className="text-sm font-medium text-pos-text truncate">
                        {shop.name}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {shopMembership.role}
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <FiCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ShopSelector
