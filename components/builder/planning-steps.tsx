"use client"

import { motion } from "framer-motion"
import { Check, Loader2 } from "lucide-react"

interface Step {
  title: string
  description: string
  status: "pending" | "active" | "complete"
}

interface PlanningStepsProps {
  steps: Step[]
}

export function PlanningSteps({ steps }: PlanningStepsProps) {
  return (
    <div className="flex flex-col gap-3 py-2">
      {steps.map((step, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: i * 0.1 }}
          className="flex items-start gap-3"
        >
          <div className="relative mt-0.5 flex shrink-0 items-center justify-center">
            {step.status === "complete" ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500"
              >
                <Check className="h-3.5 w-3.5 text-white" />
              </motion.div>
            ) : step.status === "active" ? (
              <div className="relative flex h-6 w-6 items-center justify-center">
                <div className="absolute inset-0 animate-ping rounded-full bg-foreground/20" />
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-foreground bg-card">
                  <Loader2 className="h-3 w-3 animate-spin" />
                </div>
              </div>
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-border bg-card">
                <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
              </div>
            )}
            {i < steps.length - 1 && (
              <div
                className={`absolute top-6 left-1/2 h-8 w-px -translate-x-1/2 ${
                  step.status === "complete" ? "bg-emerald-500" : "bg-border"
                }`}
              />
            )}
          </div>
          <div className="min-w-0 pb-6">
            <p
              className={`text-sm font-medium ${
                step.status === "complete"
                  ? "text-foreground"
                  : step.status === "active"
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {step.title}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
