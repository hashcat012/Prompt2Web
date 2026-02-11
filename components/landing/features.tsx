"use client"

import { motion } from "framer-motion"
import { useLocale } from "@/lib/locale-context"
import { Cpu, Zap, Rocket, Smartphone, Shield, Users } from "lucide-react"

const icons = [Cpu, Zap, Rocket, Smartphone, Shield, Users]

export function Features() {
  const { t } = useLocale()

  const features = [
    { title: t.features.ai, desc: t.features.aiDesc },
    { title: t.features.fast, desc: t.features.fastDesc },
    { title: t.features.deploy, desc: t.features.deployDesc },
    { title: t.features.responsive, desc: t.features.responsiveDesc },
    { title: t.features.secure, desc: t.features.secureDesc },
    { title: t.features.collab, desc: t.features.collabDesc },
  ]

  return (
    <section className="relative overflow-hidden px-4 py-32">
      <div className="absolute inset-0 dot-pattern opacity-30" />
      <div className="relative z-10 mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            {t.features.title}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t.features.subtitle}
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => {
            const Icon = icons[i]
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group relative rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-foreground/20 hover:shadow-lg"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-foreground transition-transform duration-300 group-hover:scale-110">
                  <Icon className="h-5 w-5 text-background" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.desc}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
