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

export type AIModel = "deepseek" | "groq"
export type BuildMode = "fast" | "planning"

interface AISelectorProps {
  model: AIModel
  mode: BuildMode
  onModelChange: (m: AIModel) => void
  onModeChange: (m: BuildMode) => void
  disabled?: boolean
  userPlan: string
}

function DeepSeekLogo({ className }: { className?: string }) {
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

function GroqLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="currentColor" fillOpacity="0.1" />
      <path
        d="M12 4l7 4v8l-7 4-7-4V8l7-4zm0 2.31L7 8.85v6.3L12 17.7l5-2.54v-6.3L12 6.31z"
        fill="currentColor"
      />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
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

  const isPlanningLocked = userPlan === "free"

  return (
    <div className="flex items-center gap-2">
      {/* AI Model Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 bg-transparent text-xs transition-all duration-200 hover:bg-accent"
            disabled={disabled}
          >
            {model === "deepseek" ? (
              <DeepSeekLogo className="h-4 w-4" />
            ) : (
              <GroqLogo className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {model === "deepseek" ? "DeepSeek" : "Groq"}
            </span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="liquid-glass w-56">
          <DropdownMenuItem
            onClick={() => onModelChange("deepseek")}
            className={`cursor-pointer gap-3 p-3 ${model === "deepseek" ? "bg-accent" : ""}`}
          >
            <DeepSeekLogo className="h-5 w-5 shrink-0" />
            <div>
              <div className="text-sm font-medium">DeepSeek</div>
              <div className="text-xs text-muted-foreground">Advanced reasoning model</div>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onModelChange("groq")}
            className={`cursor-pointer gap-3 p-3 ${model === "groq" ? "bg-accent" : ""}`}
          >
            <GroqLogo className="h-5 w-5 shrink-0" />
            <div>
              <div className="text-sm font-medium">Groq</div>
              <div className="text-xs text-muted-foreground">Lightning-fast inference</div>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Mode Selector */}
      <div className="flex items-center rounded-lg border border-border bg-card p-0.5">
        <button
          onClick={() => onModeChange("fast")}
          disabled={disabled}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
            mode === "fast"
              ? "bg-foreground text-background shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t.builder.fast}
        </button>
        <button
          onClick={() => {
            if (!isPlanningLocked) onModeChange("planning")
          }}
          disabled={disabled || isPlanningLocked}
          className={`relative rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
            mode === "planning"
              ? "bg-foreground text-background shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          } ${isPlanningLocked ? "cursor-not-allowed opacity-50" : ""}`}
        >
          {t.builder.planning}
          {isPlanningLocked && (
            <span className="ml-1 rounded bg-muted-foreground/20 px-1 py-0.5 text-[9px] uppercase">
              Pro
            </span>
          )}
        </button>
      </div>
    </div>
  )
}
