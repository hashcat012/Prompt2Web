"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useLocale } from "@/lib/locale-context"
import { ThemeToggle } from "./theme-toggle"
import { LanguageSelector } from "./language-selector"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Zap,
  Home,
  Code2,
  CreditCard,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
  FolderOpen,
  Layers,
  History,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"

export function AppSidebar() {
  const pathname = usePathname()
  const { user, userData, signOut } = useAuth()
  const { t } = useLocale()
  const [collapsed, setCollapsed] = useState(false)

  const navItems = [
    { href: "/", icon: Home, label: t.nav.home },
    { href: "/builder", icon: Code2, label: t.nav.builder },
    { href: "/history", icon: History, label: "History" },
    { href: "/pricing", icon: CreditCard, label: t.nav.pricing },
    { href: "/templates", icon: Layers, label: "Templates" },
  ]

  const bottomItems = [
    { href: "/settings", icon: Settings, label: t.nav.settings },
    ...(userData?.isAdmin
      ? [{ href: "/admin", icon: Shield, label: t.nav.admin }]
      : []),
  ]

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="relative flex h-screen flex-col border-r border-border bg-sidebar"
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-border px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground">
          <Zap className="h-4 w-4 text-background" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden whitespace-nowrap font-bold"
            >
              Prompt2Web
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto p-2">
        <div className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start gap-3 transition-all duration-200 ${collapsed ? "px-0 justify-center" : ""
                    } ${isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden whitespace-nowrap text-sm"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Bottom section */}
      <div className="border-t border-border p-2">
        {bottomItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={`w-full justify-start gap-3 transition-all duration-200 ${collapsed ? "px-0 justify-center" : ""
                  } ${isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden whitespace-nowrap text-sm"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </Link>
          )
        })}

        <div className={`mt-2 flex items-center gap-2 ${collapsed ? "flex-col" : "justify-between"}`}>
          <LanguageSelector />
          <ThemeToggle />
        </div>

        {/* User profile */}
        {user && (
          <Link href="/settings" className={`mt-2 block rounded-lg hover:bg-accent/50 transition-colors`}>
            <div className={`flex items-center gap-3 p-2 ${collapsed ? "justify-center" : ""}`}>
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={user.photoURL || undefined} />
                <AvatarFallback className="bg-foreground text-background text-xs">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-1 items-center justify-between overflow-hidden"
                  >
                    <div className="min-w-0 text-left">
                      <p className="truncate text-sm font-medium">
                        {user.displayName || "User"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {userData?.plan || "free"}
                      </p>
                    </div>
                    {/* LogOut button moved outside link or handled separately? 
                        Ideally logout shouldn't trigger navigation to settings. 
                        Let's keep logout button separate or verify if nesting button inside link is okay (it's not valid HTML).
                        We should use a div with onClick for navigation on the parent, or restructure.
                        Actually, Next.js Link wraps children. A button inside might cause hydration issues or navigation conflict.
                        I'll use a click handler on the container div for navigation instead of Link wrapper if I keep the button inside.
                        OR, move the Logout button out. 
                        Let's move Logout button out of the clickable profile area, perhaps to the bottom items or next to theme toggle?
                        Or just keep it here but stop propagation on the button click.
                    */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive z-10"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        signOut()
                      }}
                    >
                      <LogOut className="h-3.5 w-3.5" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Link>
        )}
      </div>
    </motion.aside>
  )
}
