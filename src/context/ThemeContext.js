import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
    const [darkMode, setDarkMode] = useState(() => {
        // Check localStorage first
        const saved = localStorage.getItem('pos_darkMode')
        if (saved !== null) {
            return JSON.parse(saved)
        }
        // Check system preference
        return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
    })

    useEffect(() => {
        // Save to localStorage
        localStorage.setItem('pos_darkMode', JSON.stringify(darkMode))

        // Update document class for Tailwind dark mode
        if (darkMode) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }, [darkMode])

    const toggleDarkMode = () => {
        setDarkMode(prev => !prev)
    }

    return (
        <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider')
    }
    return context
}
