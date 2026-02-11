"use client"

import React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useLocale } from "@/lib/locale-context"
import { useAuth } from "@/lib/auth-context"
import { AppSidebar } from "@/components/app-sidebar"
import { AISelector, type AIModel, type BuildMode } from "@/components/builder/ai-selector"
import { PlanningSteps } from "@/components/builder/planning-steps"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Send,
  Eye,
  Code2,
  FileText,
  Rocket,
  Loader2,
  Copy,
  Check,
  Download,
  RefreshCw,
  Sparkles,
  ExternalLink,
} from "lucide-react"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface PlanStep {
  title: string
  description: string
  status: "pending" | "active" | "complete"
}

export default function BuilderPage() {
  const { t } = useLocale()
  const { userData } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [model, setModel] = useState<AIModel>("deepseek")
  const [mode, setMode] = useState<BuildMode>("fast")
  const [generatedCode, setGeneratedCode] = useState("")
  const [activeTab, setActiveTab] = useState<"preview" | "code" | "files">("preview")
  const [copied, setCopied] = useState(false)
  const [planSteps, setPlanSteps] = useState<PlanStep[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const userPlan = userData?.plan || "free"

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleSubmit = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setLoading(true)
    setGeneratedCode("")
    setPlanSteps([])

    const apiUrl = model === "deepseek" ? "/api/ai/deepseek" : "/api/ai/groq"

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMessage, mode }),
      })

      if (!res.ok) {
        throw new Error("API request failed")
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error("No reader")

      let fullContent = ""
      const decoder = new TextDecoder()

      if (mode === "planning") {
        // For planning mode, show steps
        const initialSteps: PlanStep[] = [
          { title: t.builder.analyzing, description: "Understanding your requirements...", status: "active" },
          { title: "Planning architecture", description: "Designing component structure...", status: "pending" },
          { title: t.builder.building, description: "Generating production code...", status: "pending" },
          { title: "Optimizing", description: "Adding responsive design & animations...", status: "pending" },
          { title: t.builder.complete, description: "Ready for preview!", status: "pending" },
        ]
        setPlanSteps(initialSteps)

        // Simulate step progression during streaming
        setTimeout(() => {
          setPlanSteps((prev) =>
            prev.map((s, i) =>
              i === 0 ? { ...s, status: "complete" } : i === 1 ? { ...s, status: "active" } : s
            )
          )
        }, 2000)
        setTimeout(() => {
          setPlanSteps((prev) =>
            prev.map((s, i) =>
              i <= 1 ? { ...s, status: "complete" } : i === 2 ? { ...s, status: "active" } : s
            )
          )
        }, 4000)
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split("\n")

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith("data: ")) continue
          const data = trimmed.slice(6)
          if (data === "[DONE]") continue

          try {
            const parsed = JSON.parse(data)
            if (parsed.content) {
              fullContent += parsed.content
            }
          } catch {
            // skip
          }
        }

        // Extract code from content
        let codeContent = fullContent
        if (mode === "planning") {
          try {
            // Try to parse JSON response
            const jsonStart = fullContent.indexOf("{")
            const jsonEnd = fullContent.lastIndexOf("}")
            if (jsonStart !== -1 && jsonEnd !== -1) {
              const jsonStr = fullContent.slice(jsonStart, jsonEnd + 1)
              const parsed = JSON.parse(jsonStr)
              if (parsed.steps && Array.isArray(parsed.steps)) {
                setPlanSteps((prev) => {
                  const newSteps = parsed.steps.map(
                    (s: { title: string; description: string }, idx: number) => ({
                      title: s.title,
                      description: s.description,
                      status: idx < parsed.steps.length - 1 ? "complete" as const : "active" as const,
                    })
                  )
                  // Add final complete step
                  newSteps.push({
                    title: t.builder.complete,
                    description: "Ready for preview!",
                    status: "pending" as const,
                  })
                  return newSteps
                })
              }
              if (parsed.code) {
                codeContent = parsed.code
              }
            }
          } catch {
            // Not yet valid JSON - extract HTML if available
            const htmlStart = fullContent.indexOf("<!DOCTYPE")
            if (htmlStart === -1) {
              const htmlStart2 = fullContent.indexOf("<html")
              if (htmlStart2 !== -1) codeContent = fullContent.slice(htmlStart2)
            } else {
              codeContent = fullContent.slice(htmlStart)
            }
          }
        } else {
          // Fast mode - extract HTML directly
          const htmlStart = fullContent.indexOf("<!DOCTYPE")
          if (htmlStart !== -1) {
            codeContent = fullContent.slice(htmlStart)
          } else {
            const htmlStart2 = fullContent.indexOf("<html")
            if (htmlStart2 !== -1) {
              codeContent = fullContent.slice(htmlStart2)
            }
          }
        }

        setGeneratedCode(codeContent)
      }

      // Complete all steps
      if (mode === "planning") {
        setPlanSteps((prev) => prev.map((s) => ({ ...s, status: "complete" as const })))
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: fullContent },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, there was an error generating your website. Please try again." },
      ])
    } finally {
      setLoading(false)
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadCode = () => {
    const blob = new Blob([generatedCode], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "index.html"
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Chat */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="flex w-full flex-col border-r border-border md:w-[420px] lg:w-[480px]"
        >
          {/* Chat header */}
          <div className="flex h-14 items-center justify-between border-b border-border px-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-semibold">AI Builder</span>
            </div>
            <AISelector
              model={model}
              mode={mode}
              onModelChange={setModel}
              onModeChange={setMode}
              disabled={loading}
              userPlan={userPlan}
            />
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-4 p-4">
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-20 text-center"
                >
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-foreground/5">
                    <Sparkles className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">
                    {t.builder.placeholder.split("...")[0]}
                  </h3>
                  <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                    Choose your AI model and mode, then describe what you want to build.
                  </p>
                  <div className="mt-6 grid grid-cols-2 gap-2">
                    {[
                      "Landing page for a SaaS",
                      "Portfolio website",
                      "Restaurant website",
                      "Blog template",
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setInput(suggestion)}
                        className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground transition-all duration-200 hover:border-foreground/20 hover:bg-accent hover:text-foreground"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-foreground text-background"
                        : "bg-card border border-border"
                    }`}
                  >
                    {msg.role === "assistant" && generatedCode ? (
                      <div className="flex flex-col gap-2">
                        <p className="text-muted-foreground">Website generated successfully!</p>
                        {mode === "planning" && planSteps.length > 0 && (
                          <PlanningSteps steps={planSteps} />
                        )}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </motion.div>
              ))}

              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="rounded-2xl border border-border bg-card px-4 py-3">
                    {mode === "planning" && planSteps.length > 0 ? (
                      <PlanningSteps steps={planSteps} />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">
                          {t.builder.generating}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="border-t border-border p-4">
            <div className="flex items-end gap-2 rounded-xl border border-border bg-card p-2 transition-all duration-200 focus-within:border-foreground/20 focus-within:ring-1 focus-within:ring-ring">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t.builder.placeholder}
                rows={1}
                className="max-h-32 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
                style={{ height: "40px" }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = "40px"
                  target.style.height = `${Math.min(target.scrollHeight, 128)}px`
                }}
              />
              <Button
                size="icon"
                className="h-9 w-9 shrink-0 rounded-lg transition-all duration-200"
                onClick={handleSubmit}
                disabled={!input.trim() || loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              {model === "deepseek" ? "DeepSeek" : "Groq"} / {mode === "fast" ? t.builder.fast : t.builder.planning} mode
            </p>
          </div>
        </motion.div>

        {/* Right Panel - Preview/Code/Files */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="hidden flex-1 flex-col md:flex"
        >
          {/* Tabs */}
          <div className="flex h-14 items-center justify-between border-b border-border px-4">
            <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-0.5">
              {[
                { key: "preview" as const, icon: Eye, label: t.builder.preview },
                { key: "code" as const, icon: Code2, label: t.builder.code },
                { key: "files" as const, icon: FileText, label: t.builder.files },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                    activeTab === tab.key
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {generatedCode && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 bg-transparent text-xs"
                    onClick={copyCode}
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 bg-transparent text-xs"
                    onClick={downloadCode}
                  >
                    <Download className="h-3 w-3" />
                    Download
                  </Button>
                  <Button size="sm" className="gap-1.5 text-xs">
                    <Rocket className="h-3 w-3" />
                    {t.builder.deploy}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === "preview" && (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  {generatedCode ? (
                    <div className="flex h-full flex-col">
                      <div className="flex items-center gap-2 border-b border-border bg-card/50 px-4 py-2">
                        <div className="flex gap-1.5">
                          <div className="h-2.5 w-2.5 rounded-full bg-destructive/50" />
                          <div className="h-2.5 w-2.5 rounded-full bg-chart-4/50" />
                          <div className="h-2.5 w-2.5 rounded-full bg-chart-2/50" />
                        </div>
                        <div className="flex-1 rounded-md bg-muted px-3 py-1 text-[11px] text-muted-foreground">
                          localhost:3000
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                      <iframe
                        ref={iframeRef}
                        srcDoc={generatedCode}
                        className="flex-1 bg-white"
                        title="Preview"
                        sandbox="allow-scripts allow-same-origin"
                      />
                    </div>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
                        <Eye className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold">Preview</h3>
                      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                        Your generated website will appear here. Start by describing what you want to build.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "code" && (
                <motion.div
                  key="code"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-full overflow-auto bg-card p-4"
                >
                  {generatedCode ? (
                    <pre className="font-mono text-xs leading-relaxed text-foreground">
                      <code>{generatedCode}</code>
                    </pre>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <Code2 className="mb-4 h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Generated code will appear here
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "files" && (
                <motion.div
                  key="files"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-full p-4"
                >
                  {generatedCode ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent/50">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">index.html</p>
                          <p className="text-xs text-muted-foreground">
                            {(generatedCode.length / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <FileText className="mb-4 h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Generated files will appear here
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
