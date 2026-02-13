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
  const [model, setModel] = useState<AIModel>("groq")
  const mode = "planning" // Enforce single planning mode
  const [generatedFiles, setGeneratedFiles] = useState<Record<string, string>>({ "index.html": "" })
  const [activeFile, setActiveFile] = useState("index.html")
  const [finalPreviewHtml, setFinalPreviewHtml] = useState("")
  const [projectOverview, setProjectOverview] = useState("")

  const [activeTab, setActiveTab] = useState<"preview" | "code" | "files" | "overview">("preview")
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
    setGeneratedFiles({ "index.html": "" })
    setActiveFile("index.html")
    setPlanSteps([])

    // Always use chimera/openrouter for consistent planning behavior unless using groq specifically requested by user.
    // Actually, "Groq Llama 3.3" is in the model list.
    // But the user requested "Dynamic model selection" which we can't fully do in backend easily.
    // We will route Groq to Groq route, others to Chimera/OpenRouter.
    let apiUrl = "/api/ai/groq"
    if (model === "groq") apiUrl = "/api/ai/groq"
    else apiUrl = "/api/ai/chimera" // Everything else goes to OpenRouter

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMessage, mode, model }),
      })

      if (!res.ok) {
        let errorMessage = "API request failed"
        try {
          const errorData = await res.json()
          errorMessage = errorData.details || errorData.error || errorMessage
        } catch {
          // fallback to default
        }
        throw new Error(errorMessage)
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error("Failed to initialize stream reader")

      let fullContent = ""
      const decoder = new TextDecoder()
      let streamBuffer = ""

      if (true) { // All modes are planning now
        // For planning mode, show initial steps
        const initialSteps: PlanStep[] = [
          { title: t.builder.analyzing, description: "Understanding your requirements...", status: "active" },
          { title: "Planning architecture", description: "Designing component structure...", status: "pending" },
          { title: t.builder.building, description: "Generating production code...", status: "pending" },
          { title: "Optimizing", description: "Adding responsive design & animations...", status: "pending" },
          { title: t.builder.complete, description: "Ready for preview!", status: "pending" },
        ]
        setPlanSteps(initialSteps)
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        streamBuffer += decoder.decode(value, { stream: true })
        const lines = streamBuffer.split("\n")
        streamBuffer = lines.pop() || ""

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith("data: ")) continue
          const data = trimmed.slice(6)
          if (data === "[DONE]") continue

          try {
            const parsed = JSON.parse(data)
            if (parsed.content) {
              fullContent += parsed.content

              // Extract code and files from content dynamically
              // Since we are always in planning mode, we expect JSON-ish output possibly wrapped in markdown
              try {
                // Try to find the JSON object in the accumulated content
                const jsonStart = fullContent.indexOf("{")
                const jsonEnd = fullContent.lastIndexOf("}")
                if (jsonStart !== -1 && jsonEnd !== -1) {
                  const jsonStr = fullContent.slice(jsonStart, jsonEnd + 1)
                  // Try parsing the accumulated JSON candidates
                  // Note: In streaming, this often fails until the end, but we try
                  try {
                    const parsedJson = JSON.parse(jsonStr)

                    if (parsedJson.overview) {
                      setProjectOverview(parsedJson.overview)
                    }

                    if (parsedJson.steps && Array.isArray(parsedJson.steps)) {
                      setPlanSteps(parsedJson.steps.map((s: any, idx: number) => ({
                        ...s,
                        status: idx < parsedJson.steps.length - 1 ? "complete" : "active"
                      })))
                    }

                    if (parsedJson.files) {
                      setGeneratedFiles(parsedJson.files)
                      if (parsedJson.indexFile) setActiveFile(parsedJson.indexFile)
                    } else if (parsedJson.code) {
                      setGeneratedFiles({ "index.html": parsedJson.code })
                    }
                  } catch { }
                }
              } catch {
                // Partial JSON or HTML fallback
                const htmlMatch = fullContent.match(/<!DOCTYPE html>[\s\S]*<\/html>/i) || fullContent.match(/<html[\s\S]*<\/html>/i)
                if (htmlMatch) {
                  setGeneratedFiles(prev => ({ ...prev, "index.html": htmlMatch[0] }))
                }
              }
            }
          } catch {
            // skip unparseable
          }
        }
      }

      // Final cleanup and complete all steps
      setPlanSteps((prev) => prev.map((s) => ({ ...s, status: "complete" as const })))

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: fullContent },
      ])

      // Only update preview at the very end
      setGeneratedFiles(prev => {
        if (prev["index.html"]) {
          setFinalPreviewHtml(prev["index.html"])
        }
        return prev
      })
    } catch (err: any) {
      console.error("Builder Error:", err)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `❌ [V2] Hata: ${err.message || "Bilinmeyen bir hata oluştu. Lütfen Vercel Logs panelini kontrol edin."}`
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(generatedFiles[activeFile] || "")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadCode = () => {
    const content = generatedFiles[activeFile] || ""
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = activeFile
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
              // mode is now internalized or fixed to 'planning'
              onModelChange={setModel}

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
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user"
                      ? "bg-foreground text-background"
                      : "bg-card border border-border"
                      }`}
                  >
                    {msg.role === "assistant" && Object.values(generatedFiles).some(c => c.length > 0) ? (
                      <div className="flex flex-col gap-2">
                        <p className="text-muted-foreground">Project generated successfully!</p>
                        {planSteps.length > 0 && (
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
                    {planSteps.length > 0 ? (
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
            <p className="mt-2 text-center text-[10px] text-muted-foreground uppercase tracking-widest">
              {model.split("/").pop()?.split(":")[0] || model} | Planning Mode
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
                { key: "overview" as const, icon: Sparkles, label: "Elite Plan" },
              ].filter(t => t.key !== "overview" || projectOverview).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 ${activeTab === tab.key
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
              {Object.keys(generatedFiles).some(k => generatedFiles[k].length > 0) && (
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
                  {Object.keys(generatedFiles).length > 0 && generatedFiles["index.html"] ? (
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
                        srcDoc={finalPreviewHtml}
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
                  {Object.keys(generatedFiles).length > 0 ? (
                    <div className="flex h-full flex-col gap-2">
                      <div className="flex items-center gap-1 overflow-x-auto border-b border-border bg-muted/30 p-2">
                        {Object.keys(generatedFiles).map(path => (
                          <button
                            key={path}
                            onClick={() => setActiveFile(path)}
                            className={`rounded px-2 py-1 text-[10px] whitespace-nowrap transition-colors ${activeFile === path ? "bg-foreground text-background" : "bg-card text-muted-foreground hover:text-foreground"}`}
                          >
                            {path.split("/").pop()}
                          </button>
                        ))}
                      </div>
                      <pre className="flex-1 overflow-auto font-mono text-xs leading-relaxed text-foreground p-4">
                        <code>{generatedFiles[activeFile]}</code>
                      </pre>
                    </div>
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
                  {Object.keys(generatedFiles).length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {Object.keys(generatedFiles).map(path => (
                        <div
                          key={path}
                          onClick={() => {
                            setActiveFile(path)
                            setActiveTab("code")
                          }}
                          className={`flex items-center gap-3 rounded-lg border border-border p-3 transition-colors cursor-pointer ${activeFile === path ? "bg-accent" : "bg-card hover:bg-accent/50"}`}
                        >
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{path}</p>
                            <p className="text-xs text-muted-foreground">
                              {(generatedFiles[path].length / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                      ))}
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
