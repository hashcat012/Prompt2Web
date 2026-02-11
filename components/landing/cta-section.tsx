"use client"

import { motion } from "framer-motion"
import { useLocale } from "@/lib/locale-context"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export function CTASection() {
  const { t } = useLocale()

  return (
    <section className="relative overflow-hidden px-4 py-32">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative z-10 mx-auto max-w-3xl text-center"
      >
        <div className="liquid-glass rounded-2xl p-12 sm:p-16">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to build something amazing?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join thousands of developers and designers using Prompt2Web to create production-ready websites in seconds.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/builder">
              <Button size="lg" className="group gap-2 px-8 text-base">
                {t.hero.cta}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
