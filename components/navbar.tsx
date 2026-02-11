"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useLocale } from "@/lib/locale-context"
import { ThemeToggle } from "./theme-toggle"
import { LanguageSelector } from "./language-selector"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Zap,
  Menu,
  X,
  User,
  LogOut,
  Settings,
  Shield,
  LayoutDashboard,
} from "lucide-react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export function Navbar() {
  const { user, userData, signOut } = useAuth()
  const { t } = useLocale()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 liquid-glass"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
            <Zap className="h-4 w-4 text-background" />
          </div>
          <span className="text-lg font-bold tracking-tight">Prompt2Web</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-sm transition-all duration-200 hover:bg-accent">
              {t.nav.home}
            </Button>
          </Link>
          <Link href="/builder">
            <Button variant="ghost" size="sm" className="text-sm transition-all duration-200 hover:bg-accent">
              {t.nav.builder}
            </Button>
          </Link>
          <Link href="/pricing">
            <Button variant="ghost" size="sm" className="text-sm transition-all duration-200 hover:bg-accent">
              {t.nav.pricing}
            </Button>
          </Link>
          {userData?.isAdmin && (
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="text-sm transition-all duration-200 hover:bg-accent gap-1">
                <Shield className="h-3 w-3" />
                {t.nav.admin}
              </Button>
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSelector />
          <ThemeToggle />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user.photoURL || undefined} />
                    <AvatarFallback className="bg-foreground text-background text-xs">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="liquid-glass w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">{user.displayName || "User"}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  {userData?.plan && (
                    <span className="mt-1 inline-block rounded-full bg-foreground px-2 py-0.5 text-[10px] font-medium text-background uppercase">
                      {userData.plan}
                    </span>
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/builder" className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    {t.nav.dashboard}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    {t.nav.settings}
                  </Link>
                </DropdownMenuItem>
                {userData?.isAdmin && (
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/admin" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      {t.nav.admin}
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t.nav.logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button size="sm" className="transition-all duration-300 hover:opacity-90">
                {t.nav.login}
              </Button>
            </Link>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden border-t border-border md:hidden"
          >
            <nav className="flex flex-col gap-1 p-4">
              <Link href="/" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">{t.nav.home}</Button>
              </Link>
              <Link href="/builder" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">{t.nav.builder}</Button>
              </Link>
              <Link href="/pricing" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">{t.nav.pricing}</Button>
              </Link>
              {userData?.isAdmin && (
                <Link href="/admin" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Shield className="h-4 w-4" />
                    {t.nav.admin}
                  </Button>
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
