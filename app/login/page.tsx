"use client"

import React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useLocale } from "@/lib/locale-context"
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Zap, ArrowLeft, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const { t } = useLocale()
  const [isRegister, setIsRegister] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const handleGoogle = async () => {
    try {
      setLoading(true)
      await signInWithPopup(auth, googleProvider)
      toast.success(t.common.success)
      router.push("/builder")
    } catch {
      toast.error(t.common.error)
    } finally {
      setLoading(false)
    }
  }

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isRegister && password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    try {
      setLoading(true)
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password)
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
      toast.success(t.common.success)
      router.push("/builder")
    } catch {
      toast.error(t.common.error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen">
      {/* Left side - Branding */}
      <div className="hidden w-1/2 flex-col justify-between bg-foreground p-12 text-background lg:flex">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background">
            <Zap className="h-4 w-4 text-foreground" />
          </div>
          <span className="text-lg font-bold">Prompt2Web</span>
        </Link>

        <div>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <h2 className="text-4xl font-bold leading-tight">
              Build websites
              <br />
              at the speed
              <br />
              of thought.
            </h2>
            <p className="mt-4 max-w-sm text-background/60">
              Transform your ideas into production-ready code with the power of AI.
            </p>
          </motion.div>

          {/* Glass floating cards */}
          <div className="relative mt-12 h-48">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="absolute left-0 top-0 w-64 rounded-xl border border-background/10 bg-background/5 p-4 backdrop-blur-sm"
            >
              <div className="mb-2 h-3 w-24 rounded bg-background/20" />
              <div className="h-2 w-full rounded bg-background/10" />
              <div className="mt-1 h-2 w-3/4 rounded bg-background/10" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="absolute left-20 top-16 w-64 rounded-xl border border-background/10 bg-background/5 p-4 backdrop-blur-sm"
            >
              <div className="mb-2 h-3 w-16 rounded bg-background/20" />
              <div className="flex gap-2">
                <div className="h-8 w-8 rounded bg-background/15" />
                <div className="h-8 w-8 rounded bg-background/15" />
                <div className="h-8 w-8 rounded bg-background/15" />
              </div>
            </motion.div>
          </div>
        </div>

        <p className="text-sm text-background/40">
          2024 Prompt2Web. All rights reserved.
        </p>
      </div>

      {/* Right side - Auth form */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
        <div className="absolute inset-0 grid-pattern opacity-20 lg:hidden" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-md"
        >
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.common.back}
          </Link>

          <div className="lg:hidden mb-8 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
              <Zap className="h-4 w-4 text-background" />
            </div>
            <span className="text-lg font-bold">Prompt2Web</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={isRegister ? "register" : "login"}
              initial={{ opacity: 0, x: isRegister ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isRegister ? -20 : 20 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-2xl font-bold">
                {isRegister ? t.auth.createAccount : t.auth.welcomeBack}
              </h1>
              <p className="mt-2 text-muted-foreground">
                {isRegister
                  ? "Create your Prompt2Web account to get started"
                  : "Sign in to continue building with AI"}
              </p>

              <div className="mt-8">
                <Button
                  variant="outline"
                  className="w-full gap-3 bg-transparent h-12 text-sm transition-all duration-300 hover:bg-accent"
                  onClick={handleGoogle}
                  disabled={loading}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  {t.auth.googleLogin}
                </Button>

                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-background px-4 text-xs text-muted-foreground">
                      or continue with email
                    </span>
                  </div>
                </div>

                <form onSubmit={handleEmail} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="email" className="text-sm">{t.auth.email}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 pl-10 transition-all duration-200 focus:ring-2 focus:ring-ring"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="password" className="text-sm">{t.auth.password}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 pl-10 pr-10 transition-all duration-200 focus:ring-2 focus:ring-ring"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isRegister && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col gap-2 overflow-hidden"
                      >
                        <Label htmlFor="confirm" className="text-sm">{t.auth.confirmPassword}</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="confirm"
                            type="password"
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="h-12 pl-10 transition-all duration-200 focus:ring-2 focus:ring-ring"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!isRegister && (
                    <div className="flex justify-end">
                      <button type="button" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
                        {t.auth.forgotPassword}
                      </button>
                    </div>
                  )}

                  <Button type="submit" className="h-12 text-sm" disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isRegister ? (
                      t.auth.register
                    ) : (
                      t.auth.login
                    )}
                  </Button>
                </form>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                  {isRegister ? t.auth.hasAccount : t.auth.noAccount}{" "}
                  <button
                    type="button"
                    onClick={() => setIsRegister(!isRegister)}
                    className="font-medium text-foreground transition-colors hover:underline"
                  >
                    {isRegister ? t.auth.login : t.auth.register}
                  </button>
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
