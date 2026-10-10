import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../api/api'
import { getCurrentSlug, getRootDomain } from '../utils/tenant'
import { FiChevronDown, FiCheck, FiShoppingBag } from 'react-icons/fi'

const ShopSelector = ({ collapsed = false }) => {
  const { shops, currentShop, switchShop, loadingShops } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [switching, setSwitching] = useState(false)
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

  const handleShopSwitch = async (shopMembership) => {
    const shop = shopMembership.shop
    const currentSlug = getCurrentSlug()

    // Only workspace subdomains need a cross-origin handoff; otherwise this
    // is the same instant in-SPA switch as always.
    if (currentSlug && shop.slug && shop.slug !== currentSlug) {
      setSwitching(true)
      try {
        const { data } = await authAPI.mintHandoff(shop.id)
        if (data.redirect_url) {
          window.location.href = data.redirect_url
          return
        }
      } catch (_) {
        // fall through to in-place switch
      } finally {
        setSwitching(false)
      }
    }

    switchShop(shopMembership)
    setIsOpen(false)
  }

  const rootDomain = getRootDomain()

  if (loadingShops) {
    return (
      <div className={`flex items-center gap-2 text-brand-surface/50 text-sm ${collapsed ? 'justify-center' : ''}`}>
        <FiShoppingBag className="w-4 h-4 flex-none" />
        {!collapsed && 'Loading shops...'}
      </div>
    )
  }

  if (!shops || shops.length === 0) {
    return (
      <div className={`flex items-center gap-2 text-brand-surface/50 text-sm ${collapsed ? 'justify-center' : ''}`}>
        <FiShoppingBag className="w-4 h-4 flex-none" />
        {!collapsed && 'No shops available'}
      </div>
    )
  }

  const initials = (currentShop?.name || '?').slice(0, 2).toUpperCase()

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={switching}
        title={collapsed ? (currentShop?.name || 'Select shop') : undefined}
        className={`flex items-center gap-2.5 w-full text-left bg-brand-surface/[0.06] border border-brand-surface/[0.12] rounded-xl text-brand-surface hover:bg-brand-surface/10 transition-colors disabled:opacity-60 ${collapsed ? 'justify-center p-2' : 'px-3 py-2.5'}`}
      >
        <span className="w-[30px] h-[30px] rounded-lg bg-brand-accent text-brand-ink grid place-items-center text-xs font-bold flex-none">
          {initials}
        </span>
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] font-semibold truncate">{currentShop?.name || 'Select shop'}</span>
              <span className="block font-mono text-[10.5px] text-brand-surface/55 truncate">
                {currentShop?.slug ? `${currentShop.slug}.${rootDomain}` : currentShop?.role}
              </span>
            </span>
            <FiChevronDown className={`w-4 h-4 opacity-60 flex-none transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      {isOpen && (
        <div className={`absolute top-full mt-2 bg-white rounded-xl shadow-lg border border-brand-ink/10 z-50 max-h-64 overflow-y-auto ${collapsed ? 'left-0 w-56' : 'left-0 right-0'}`}>
          {shops.map((shopMembership) => {
            const shop = shopMembership.shop
            const isSelected = currentShop?.id === shop.id

            return (
              <button
                key={shop.id}
                onClick={() => handleShopSwitch(shopMembership)}
                disabled={switching}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-brand-ink hover:bg-brand-surface transition-colors disabled:opacity-60 ${
                  isSelected ? 'bg-brand-surface' : ''
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FiShoppingBag className="w-4 h-4 text-brand-ink/60 flex-shrink-0" />
                  <div className="min-w-0 text-left">
                    <p className="text-sm font-medium truncate">{shop.name}</p>
                    <p className="text-xs text-brand-ink/50 capitalize">{shopMembership.role}</p>
                  </div>
                </div>
                {isSelected && <FiCheck className="w-4 h-4 text-green-600 flex-shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ShopSelector
