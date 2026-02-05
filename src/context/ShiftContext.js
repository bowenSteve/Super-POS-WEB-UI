import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { salesAPI } from '../api/api'
import { useAuth } from './AuthContext'

const ShiftContext = createContext(null)

export function useShift() {
    const context = useContext(ShiftContext)
    if (!context) {
        throw new Error('useShift must be used within a ShiftProvider')
    }
    return context
}

export function ShiftProvider({ children }) {
    const { user, currentShop } = useAuth()
    const [currentShift, setCurrentShift] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchCurrentShift = useCallback(async () => {
        if (!user || !currentShop) {
            setCurrentShift(null)
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            const response = await salesAPI.getCurrentShift()
            setCurrentShift(response.data.shift !== null ? response.data : null)
            // Handle the response - if shift is null, there's no open shift
            if (response.data.shift === null) {
                setCurrentShift(null)
            } else {
                setCurrentShift(response.data)
            }
            setError(null)
        } catch (err) {
            console.error('Error fetching current shift:', err)
            setCurrentShift(null)
            // Don't set error for 404s - just means no open shift
            if (err.response?.status !== 404) {
                setError(err.message)
            }
        } finally {
            setLoading(false)
        }
    }, [user, currentShop])

    // Fetch current shift when user or shop changes
    useEffect(() => {
        fetchCurrentShift()
    }, [fetchCurrentShift])

    const openShift = async (openingCash, notes = '') => {
        try {
            setLoading(true)
            const response = await salesAPI.openShift({
                opening_cash: openingCash,
                notes
            })
            setCurrentShift(response.data)
            setError(null)
            return { success: true, data: response.data }
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Failed to open shift'
            setError(errorMessage)
            return { success: false, error: errorMessage }
        } finally {
            setLoading(false)
        }
    }

    const closeShift = async (closingCash, closingNotes = '') => {
        if (!currentShift) {
            return { success: false, error: 'No open shift to close' }
        }

        try {
            setLoading(true)
            const response = await salesAPI.closeShift(currentShift.id, {
                closing_cash: closingCash,
                closing_notes: closingNotes
            })
            const shiftReport = response.data
            setCurrentShift(null)
            setError(null)
            return { success: true, data: shiftReport }
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Failed to close shift'
            setError(errorMessage)
            return { success: false, error: errorMessage }
        } finally {
            setLoading(false)
        }
    }

    const getShiftReport = async (shiftId) => {
        try {
            const response = await salesAPI.getShiftReport(shiftId)
            return { success: true, data: response.data }
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Failed to get shift report'
            return { success: false, error: errorMessage }
        }
    }

    const exportShiftPDF = async (shiftId) => {
        try {
            const response = await salesAPI.exportShiftPDF(shiftId)
            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `shift_report_${shiftId}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
            return { success: true }
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Failed to export shift PDF'
            return { success: false, error: errorMessage }
        }
    }

    const value = {
        currentShift,
        loading,
        error,
        isShiftOpen: !!currentShift,
        openShift,
        closeShift,
        getShiftReport,
        exportShiftPDF,
        refreshShift: fetchCurrentShift
    }

    return <ShiftContext.Provider value={value}>{children}</ShiftContext.Provider>
}

export default ShiftContext
