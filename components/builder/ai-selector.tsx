"use client"

import { useLocale } from "@/lib/locale-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"

export type AIModel =
  | "groq"
  | "openai/gpt-oss-120b:free"
  | "tngtech/deepseek-r1t2-chimera:free"
  | "z-ai/glm-4.5-air:free"
  | "deepseek/deepseek-r1-0528:free"
  | "qwen/qwen3-coder:free"

export type BuildMode = "fast" | "planning"

interface AISelectorProps {
  model: AIModel
  mode: BuildMode
  onModelChange: (m: AIModel) => void
  onModeChange: (m: BuildMode) => void
  disabled?: boolean
  userPlan: string
}

function ModelLogo({ model, className }: { model: AIModel; className?: string }) {

  if (model === "groq") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="6" fill="currentColor" fillOpacity="0.1" />
        <path d="M12 4l7 4v8l-7 4-7-4V8l7-4zm0 2.31L7 8.85v6.3L12 17.7l5-2.54v-6.3L12 6.31z" fill="currentColor" />
        <circle cx="12" cy="12" r="2.5" fill="currentColor" />
      </svg>
    )
  }
  if (model.includes("deepseek")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="6" fill="#0066FF" fillOpacity="0.1" />
        <path d="M12 4C7.58 4 4 7.58 4 12s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm1.5 12.5a4.5 4.5 0 0 0 0-9v1.5a3 3 0 0 1 0 6v1.5z" fill="#0066FF" />
        <path d="M10.5 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" fill="#0066FF" />
      </svg>
    )
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="currentColor" fillOpacity="0.1" />
      <path
        d="M12 4C7.58 4 4 7.58 4 12s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14.4A6.4 6.4 0 1 1 18.4 12 6.41 6.41 0 0 1 12 18.4zm3.2-8h-2.4V8.8a.8.8 0 0 0-1.6 0v1.6H8.8a.8.8 0 0 0 0 1.6h2.4v2.4a.8.8 0 0 0 1.6 0V12h2.4a.8.8 0 0 0 0-1.6z"
        fill="currentColor"
      />
    </svg>
  )
}

export function AISelector({
  model,
  mode,
  onModelChange,
  onModeChange,
  disabled,
  userPlan,
}: AISelectorProps) {
  const { t } = useLocale()
  const isPaid = userPlan !== "free"

  const models: { id: AIModel; name: string; desc: string; premium?: boolean }[] = [
    { id: "groq", name: "Groq (Llama 3.3)", desc: "Ultra-fast generation", premium: false },
    { id: "openai/gpt-oss-120b:free", name: "GPT-OSS 120B", desc: "Massive open model", premium: true },
    { id: "tngtech/deepseek-r1t2-chimera:free", name: "R1T2 Chimera", desc: "Specialized architect", premium: true },
    { id: "z-ai/glm-4.5-air:free", name: "GLM-4.5 Air", desc: "Expert web coder", premium: true },
    { id: "deepseek/deepseek-r1-0528:free", name: "DeepSeek R1 v0528", desc: "Stable R1 version", premium: false },
    { id: "qwen/qwen3-coder:free", name: "Qwen 3 Coder", desc: "High precision coding", premium: true },
  ]

  const activeModel = models.find((m) => m.id === model) || models[0]

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 bg-transparent text-xs transition-all duration-200 hover:bg-accent"
            disabled={disabled}
          >
            <ModelLogo model={model} className="h-4 w-4" />
            <span className="hidden sm:inline">{activeModel.name}</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="liquid-glass w-64 max-h-[400px] overflow-y-auto">
          {models.map((m) => {
            const isLocked = false // Unlocked for testing as per user request
            return (
              <DropdownMenuItem
                key={m.id}
                disabled={isLocked}
                onClick={() => !isLocked && onModelChange(m.id)}
                className={`flex cursor-pointer items-start gap-3 p-3 ${model === m.id ? "bg-accent" : ""} ${isLocked ? "opacity-50 grayscale" : ""}`}
              >
                <ModelLogo model={m.id} className="h-5 w-5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{m.name}</span>
                    {isLocked && (
                      <span className="rounded bg-primary/20 px-1 py-0.5 text-[8px] font-bold uppercase text-primary">
                        PRO
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{m.desc}</div>
                </div>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex items-center rounded-lg border border-border bg-card p-0.5">
        <button
          onClick={() => onModeChange("fast")}
          disabled={disabled}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 ${mode === "fast" ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
        >
          {t.builder.fast}
        </button>
        <button
          onClick={() => {
            if (isPaid) onModeChange("planning")
          }}
          disabled={disabled || !isPaid}
          className={`relative rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 ${mode === "planning" ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"
            } ${!isPaid ? "cursor-not-allowed opacity-50" : ""}`}
        >
          {t.builder.planning}
          {!isPaid && (
            <span className="ml-1 rounded bg-muted-foreground/20 px-1 py-0.5 text-[9px] uppercase">Pro</span>
          )}
        </button>
      </div>
    </div>
  )
}
