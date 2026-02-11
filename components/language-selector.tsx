"use client"

import { useLocale } from "@/lib/locale-context"
import { type Locale, localeNames } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Globe } from "lucide-react"

const flagEmoji: Record<Locale, string> = {
  en: "EN",
  tr: "TR",
  ru: "RU",
  zh: "CN",
  de: "DE",
}

export function LanguageSelector() {
  const { locale, setLocale } = useLocale()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 gap-2 px-3 transition-all duration-300 hover:bg-accent">
          <Globe className="h-4 w-4" />
          <span className="text-xs font-medium">{flagEmoji[locale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="liquid-glass min-w-[140px]">
        {(Object.keys(localeNames) as Locale[]).map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => setLocale(l)}
            className={`cursor-pointer gap-2 transition-colors ${
              locale === l ? "bg-accent" : ""
            }`}
          >
            <span className="text-xs font-bold">{flagEmoji[l]}</span>
            <span>{localeNames[l]}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
