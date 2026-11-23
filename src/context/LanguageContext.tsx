import React, { createContext, useContext, useEffect, useState } from 'react'
import { translations, type Language, type TranslationKey } from '../i18n/translations'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey, fallback?: string) => string
}

const LANGUAGE_KEY = 'pos_language'

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(LANGUAGE_KEY)
    if (saved === 'ms' || saved === 'id') return saved
    return 'ms'
  })

  useEffect(() => {
    localStorage.setItem(LANGUAGE_KEY, language)
  }, [language])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem(LANGUAGE_KEY, lang)
  }

  const t = (key: TranslationKey, fallback?: string): string => {
    const langDict = translations[language] || translations.ms
    if (key in langDict) {
      return langDict[key]
    }
    const defaultDict = translations.ms
    if (key in defaultDict) {
      return defaultDict[key]
    }
    return fallback || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
