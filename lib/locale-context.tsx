"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { type Locale, defaultLocale, getTranslations } from "./i18n"

interface LocaleContextType {
  locale: Locale
  setLocale: (l: Locale) => void
  t: ReturnType<typeof getTranslations>
}

const LocaleContext = createContext<LocaleContextType>({
  locale: defaultLocale,
  setLocale: () => {},
  t: getTranslations(defaultLocale),
})

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(defaultLocale)

  return (
    <LocaleContext.Provider
      value={{
        locale,
        setLocale,
        t: getTranslations(locale),
      }}
    >
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  return useContext(LocaleContext)
}
