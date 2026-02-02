import { useMemo } from 'react'
import { useAuth } from '../context/AuthContext'

/**
 * Hook to check user permissions based on their role in the current shop
 *
 * Roles and their permissions:
 * - owner: Full access to everything
 * - manager: Full access (admin)
 * - cashier: POS, sales, customers only
 * - inventory: Inventory management only
 */
export function usePermissions() {
    const { currentShop } = useAuth()

    const permissions = useMemo(() => {
        const role = currentShop?.role || null

        // Check if user is admin (owner or manager)
        const isAdmin = role === 'owner' || role === 'manager'
        const isOwner = role === 'owner'

        // Feature permissions based on role
        const canAccessDashboard = isAdmin
        const canAccessPOS = isAdmin || role === 'cashier'
        const canAccessInventory = isAdmin || role === 'inventory'
        const canAccessCustomers = isAdmin || role === 'cashier'
        const canAccessReports = isAdmin
        const canAccessSettings = isAdmin
        const canManageStaff = isAdmin

        // Action permissions
        const canCreateProduct = isAdmin || role === 'inventory'
        const canEditProduct = isAdmin || role === 'inventory'
        const canDeleteProduct = isAdmin
        const canCreateCategory = isAdmin || role === 'inventory'
        const canProcessSale = isAdmin || role === 'cashier'
        const canVoidSale = isAdmin
        const canGiveDiscount = isAdmin || role === 'cashier'
        const canManageStock = isAdmin || role === 'inventory'

        return {
            role,
            isAdmin,
            isOwner,

            // Navigation permissions
            canAccessDashboard,
            canAccessPOS,
            canAccessInventory,
            canAccessCustomers,
            canAccessReports,
            canAccessSettings,
            canManageStaff,

            // Action permissions
            canCreateProduct,
            canEditProduct,
            canDeleteProduct,
            canCreateCategory,
            canProcessSale,
            canVoidSale,
            canGiveDiscount,
            canManageStock,

            // Helper to check any permission
            hasPermission: (permission) => {
                const permMap = {
                    'dashboard': canAccessDashboard,
                    'pos': canAccessPOS,
                    'inventory': canAccessInventory,
                    'customers': canAccessCustomers,
                    'reports': canAccessReports,
                    'settings': canAccessSettings,
                    'staff': canManageStaff,
                }
                return permMap[permission] ?? false
            }
        }
    }, [currentShop?.role])

    return permissions
}

export default usePermissions
