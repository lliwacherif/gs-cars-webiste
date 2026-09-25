import { createContext, useContext, useState, useEffect } from 'react'
import { translations } from '../translations/translations'

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    const chosen = localStorage.getItem('app_lang_chosen') === '1'
    const stored = localStorage.getItem('app_lang')
    if (chosen && (stored === 'fr' || stored === 'ar')) return stored
    return 'fr'
  })

  // Synchronize document dir (RTL/LTR) & lang attribute whenever language changes
  useEffect(() => {
    const isRtl = lang === 'ar'
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
    localStorage.setItem('app_lang', lang)

    if (isRtl) {
      document.body.classList.add('rtl-mode')
    } else {
      document.body.classList.remove('rtl-mode')
    }
  }, [lang])

  const setLanguage = (newLang) => {
    if (newLang === 'fr' || newLang === 'ar') {
      localStorage.setItem('app_lang_chosen', '1')
      setLang(newLang)
    }
  }

  // Translation lookup helper t('nav.accueil', 'Accueil')
  const t = (path, fallback = '') => {
    if (!path) return fallback
    const parts = path.split('.')
    let current = translations[lang]
    for (const part of parts) {
      if (current && current[part] !== undefined) {
        current = current[part]
      } else {
        // Fallback to French if key missing in Arabic
        let frFallback = translations.fr
        for (const fPart of parts) {
          if (frFallback && frFallback[fPart] !== undefined) {
            frFallback = frFallback[fPart]
          } else {
            return fallback || path
          }
        }
        return typeof frFallback === 'string' ? frFallback : fallback || path
      }
    }
    return typeof current === 'string' ? current : fallback || path
  }

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, t, isRtl: lang === 'ar' }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
