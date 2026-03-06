import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface ThemeContextType {
    dark: boolean
    toggle: () => void
}

const ThemeContext = createContext<ThemeContextType>({ dark: false, toggle: () => { } })

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [dark, setDark] = useState(() => {
        const saved = localStorage.getItem('ubas_theme')
        return saved === 'dark'
    })

    useEffect(() => {
        if (dark) {
            document.documentElement.classList.add('dark')
            localStorage.setItem('ubas_theme', 'dark')
        } else {
            document.documentElement.classList.remove('dark')
            localStorage.setItem('ubas_theme', 'light')
        }
    }, [dark])

    return (
        <ThemeContext.Provider value={{ dark, toggle: () => setDark(prev => !prev) }}>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => useContext(ThemeContext)
