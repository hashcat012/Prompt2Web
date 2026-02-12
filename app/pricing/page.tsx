"use client"

import { motion } from "framer-motion"
import { useLocale } from "@/lib/locale-context"
import { useAuth } from "@/lib/auth-context"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Check, X, Sparkles, Zap, Crown } from "lucide-react"
import Link from "next/link"

export default function PricingPage() {
  const { t } = useLocale()
  const { user } = useAuth()

  const plans = [
    {
      name: t.pricing.free,
      price: "$0",
      originalPrice: null,
      period: t.pricing.month,
      description: "Perfect for getting started",
      icon: Zap,
      popular: false,
      features: [
        { text: `3 ${t.pricing.features.projects}`, included: true },
        { text: `10 ${t.pricing.features.generations}`, included: true },
        { text: `Community ${t.pricing.features.support}`, included: true },
        { text: `1 ${t.pricing.features.deploy}`, included: true },
        { text: t.pricing.features.customDomain, included: false },
        { text: t.pricing.features.priorityQueue, included: false },
        { text: t.pricing.features.api, included: false },
        { text: t.pricing.features.teamCollab, included: false },
        { text: "Fast mode only", included: true },
        { text: "Planning mode", included: false },
      ],
      cta: t.pricing.getStarted,
      href: user ? "/builder" : "/login",
    },
    {
      name: t.pricing.plus,
      price: "$1",
      originalPrice: "$15",
      period: t.pricing.month,
      description: "For serious builders",
      icon: Sparkles,
      popular: true,
      features: [
        { text: `25 ${t.pricing.features.projects}`, included: true },
        { text: `200 ${t.pricing.features.generations}`, included: true },
        { text: `Priority ${t.pricing.features.support}`, included: true },
        { text: `10 ${t.pricing.features.deploy}`, included: true },
        { text: t.pricing.features.customDomain, included: true },
        { text: t.pricing.features.priorityQueue, included: true },
        { text: t.pricing.features.api, included: false },
        { text: t.pricing.features.teamCollab, included: false },
        { text: "Fast mode", included: true },
        { text: "Planning mode", included: true },
      ],
      cta: t.pricing.upgrade,
      href: user ? "/builder" : "/login",
    },
    {
      name: t.pricing.pro,
      price: "$9.99",
      originalPrice: "$40",
      period: t.pricing.month,
      description: "For teams and enterprises",
      icon: Crown,
      popular: false,
      features: [
        { text: `Unlimited ${t.pricing.features.projects}`, included: true },
        { text: `Unlimited ${t.pricing.features.generations}`, included: true },
        { text: `Dedicated ${t.pricing.features.support}`, included: true },
        { text: `Unlimited ${t.pricing.features.deploy}`, included: true },
        { text: t.pricing.features.customDomain, included: true },
        { text: t.pricing.features.priorityQueue, included: true },
        { text: t.pricing.features.api, included: true },
        { text: t.pricing.features.teamCollab, included: true },
        { text: "Fast mode", included: true },
        { text: "Planning mode", included: true },
      ],
      cta: t.pricing.upgrade,
      href: user ? "/builder" : "/login",
    },
  ]

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="px-4 pb-32 pt-32">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
              {t.pricing.title}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {t.pricing.subtitle}
            </p>
          </motion.div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className={`relative flex flex-col rounded-2xl border bg-card p-8 transition-all duration-300 ${plan.popular
                    ? "border-foreground shadow-lg shadow-foreground/5 scale-[1.02]"
                    : "border-border hover:border-foreground/20"
                  }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-4 py-1 text-xs font-semibold text-background">
                    {t.pricing.popular}
                  </div>
                )}

                <div className="mb-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-foreground/5">
                    <plan.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                </div>

                <div className="mb-6 flex items-baseline gap-2">
                  {plan.originalPrice && (
                    <span className="text-lg text-muted-foreground line-through">
                      {plan.originalPrice}
                    </span>
                  )}
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>

                {plan.originalPrice && (
                  <div className="mb-4 inline-flex items-center self-start rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    Save $1/month
                  </div>
                )}

                <div className="mb-8 flex flex-1 flex-col gap-3">
                  {plan.features.map((feature, fi) => (
                    <div key={fi} className="flex items-center gap-3">
                      {feature.included ? (
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground">
                          <Check className="h-3 w-3 text-background" />
                        </div>
                      ) : (
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted">
                          <X className="h-3 w-3 text-muted-foreground" />
                        </div>
                      )}
                      <span
                        className={`text-sm ${feature.included ? "text-foreground" : "text-muted-foreground"
                          }`}
                      >
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                <Link href={plan.href}>
                  <Button
                    className={`w-full transition-all duration-300 ${plan.popular
                        ? ""
                        : "bg-transparent"
                      }`}
                    variant={plan.popular ? "default" : "outline"}
                    size="lg"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* FAQ or trust badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-20 text-center"
          >
            <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                Cancel anytime
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                14-day money-back guarantee
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
