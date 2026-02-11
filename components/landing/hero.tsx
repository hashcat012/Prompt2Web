"use client"

import { motion } from "framer-motion"
import { useLocale } from "@/lib/locale-context"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"

export function Hero() {
  const { t } = useLocale()

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 pt-16">
      {/* Background grid pattern */}
      <div className="absolute inset-0 grid-pattern opacity-40" />

      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 40, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-foreground/[0.03] blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -30, 0],
            y: [0, 40, 0],
          }}
          transition={{ duration: 25, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-foreground/[0.03] blur-3xl"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">AI-Powered Website Builder</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-balance text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl"
        >
          {t.hero.title}
          <span className="block text-muted-foreground">{t.hero.subtitle}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground"
        >
          {t.hero.description}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
        >
          <Link href="/builder">
            <Button size="lg" className="group gap-2 px-8 text-base transition-all duration-300">
              {t.hero.cta}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
          </Link>
          <Link href="/pricing">
            <Button variant="outline" size="lg" className="bg-transparent px-8 text-base transition-all duration-300 hover:bg-accent">
              {t.hero.secondary}
            </Button>
          </Link>
        </motion.div>

        {/* Preview mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="relative mt-20"
        >
          <div className="liquid-glass overflow-hidden rounded-xl p-1">
            <div className="rounded-lg bg-card">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <div className="h-3 w-3 rounded-full bg-destructive/60" />
                <div className="h-3 w-3 rounded-full bg-chart-4/60" />
                <div className="h-3 w-3 rounded-full bg-chart-2/60" />
                <div className="ml-4 flex-1 rounded-md bg-muted px-3 py-1 text-xs text-muted-foreground">
                  prompt2web.app/builder
                </div>
              </div>
              <div className="flex h-80 sm:h-96">
                <div className="flex w-1/3 flex-col gap-3 border-r border-border p-4">
                  <div className="h-4 w-3/4 rounded bg-muted animate-pulse-slow" />
                  <div className="h-4 w-full rounded bg-muted animate-pulse-slow" style={{ animationDelay: "0.2s" }} />
                  <div className="h-4 w-2/3 rounded bg-muted animate-pulse-slow" style={{ animationDelay: "0.4s" }} />
                  <div className="mt-4 flex-1 rounded-lg border border-border bg-muted/50 p-3">
                    <div className="h-3 w-1/2 rounded bg-muted-foreground/20" />
                    <div className="mt-2 h-3 w-3/4 rounded bg-muted-foreground/20" />
                    <div className="mt-2 h-3 w-1/3 rounded bg-muted-foreground/20" />
                  </div>
                  <div className="h-10 rounded-lg bg-foreground" />
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-center gap-2 pb-3">
                    <div className="h-7 w-16 rounded bg-foreground" />
                    <div className="h-7 w-14 rounded bg-muted" />
                    <div className="h-7 w-12 rounded bg-muted" />
                  </div>
                  <div className="flex-1 rounded-lg border border-border bg-muted/30 p-4">
                    <div className="h-6 w-1/2 rounded bg-muted animate-pulse-slow" />
                    <div className="mt-3 h-4 w-3/4 rounded bg-muted animate-pulse-slow" style={{ animationDelay: "0.3s" }} />
                    <div className="mt-2 h-4 w-full rounded bg-muted animate-pulse-slow" style={{ animationDelay: "0.5s" }} />
                    <div className="mt-6 grid grid-cols-3 gap-3">
                      <div className="h-20 rounded-lg bg-muted animate-pulse-slow" style={{ animationDelay: "0.7s" }} />
                      <div className="h-20 rounded-lg bg-muted animate-pulse-slow" style={{ animationDelay: "0.9s" }} />
                      <div className="h-20 rounded-lg bg-muted animate-pulse-slow" style={{ animationDelay: "1.1s" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Glow effect behind the card */}
          <div className="absolute -inset-4 -z-10 rounded-2xl bg-foreground/[0.02] blur-2xl" />
        </motion.div>
      </div>
    </section>
  )
}
