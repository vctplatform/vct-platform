'use client'
// ════════════════════════════════════════════════════════════════
// VCT PLATFORM — I18n Provider
// Centralized internationalization context (Vietnamese / English)
// ════════════════════════════════════════════════════════════════

import * as React from 'react'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { vi } from './vi'
import { en } from './en'

export type Lang = 'vi' | 'en'

const STORAGE_KEY = 'vct-lang'

const dictionaries: Record<Lang, Record<string, string>> = { vi, en }

interface I18nContextValue {
    lang: Lang
    setLang: (lang: Lang) => void
    t: (key: string) => string
}

const I18nContext = createContext<I18nContextValue>({
    lang: 'vi',
    setLang: () => { },
    t: (key) => key,
})

export const useI18n = () => useContext(I18nContext)

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
    const [lang, setLangState] = useState<Lang>('vi')

    // Hydrate from localStorage on mount
    useEffect(() => {
        if (typeof window === 'undefined') return
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored === 'en' || stored === 'vi') {
            setLangState(stored)
        }
    }, [])

    const setLang = useCallback((next: Lang) => {
        setLangState(next)
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, next)
        }
    }, [])

    const t = useCallback(
        (key: string): string => dictionaries[lang][key] ?? key,
        [lang],
    )

    const value = React.useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
