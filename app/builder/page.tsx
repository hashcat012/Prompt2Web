"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useLocale } from "@/lib/locale-context"
import { useAuth } from "@/lib/auth-context"
import { AppSidebar } from "@/components/app-sidebar"
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
  ChevronRight,
  FolderOpen,
  Layout
} from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import Editor from "@monaco-editor/react"
import { toast } from "sonner"

interface PlanStep {
  title: string
  description: string
  status: "pending" | "active" | "complete"
}

export default function BuilderPage() {
  const { t } = useLocale()
  const { user } = useAuth()

  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState<"preview" | "code" | "plan">("plan")
  const [generatedFiles, setGeneratedFiles] = useState<Record<string, string>>({})
  const [activeFile, setActiveFile] = useState<string>("index.html")
  const [projectOverview, setProjectOverview] = useState("")
  const [finalPreviewHtml, setFinalPreviewHtml] = useState("")
  const [copied, setCopied] = useState(false)
  const [isFirstPrompt, setIsFirstPrompt] = useState(true)

  const [planSteps, setPlanSteps] = useState<PlanStep[]>([])

  const iframeRef = useRef<HTMLIFrameElement>(null)

  const saveProjectToHistory = async (overview: string, files: Record<string, string>) => {
    if (!user) return
    try {
      await addDoc(collection(db, "projects"), {
        userId: user.uid,
        prompt: prompt,
        overview: overview,
        files: files,
        createdAt: serverTimestamp(),
        title: overview.split("\n")[0].replace("#", "").trim() || "Untitled Project"
      })
    } catch (e) {
      console.error("Failed to save project history:", e)
    }
  }

  const updateStep = (index: number, status: "pending" | "active" | "complete") => {
    setPlanSteps(prev => {
      const next = [...prev]
      if (next[index]) {
        next[index] = { ...next[index], status }
      }
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || isGenerating) return

    setIsGenerating(true)
    setIsFirstPrompt(false)
    setActiveTab("plan")
    setGeneratedFiles({})
    setFinalPreviewHtml("")
    setProjectOverview("")

    // Initial analysis steps before AI specific steps arrive
    setPlanSteps([
      { title: "Analyzing Request", description: "Breaking down prompt requirements (GPT OSS 120B)", status: "active" },
      { title: "Planning Architecture", description: "Calculating optimal file structure", status: "pending" }
    ])

    try {
      const response = await fetch("/api/ai/chimera", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          model: "auto",
          stream: true
        }),
      })

      if (!response.ok) throw new Error("API request failed")

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let streamBuffer = ""
      let fullContent = ""

      while (true) {
        const { done, value } = await reader!.read()
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

              // Switch to CODE tab when we start getting files content
              if (fullContent.includes('"files"') && activeTab !== "code") {
                setActiveTab("code")
              }

              // REAL-TIME FILE EXTRACTION
              // We look for patterns like "filename": "content..." in the growing JSON string
              if (fullContent.includes('"files"')) {
                try {
                  // Extract the entire 'files' object content string
                  const filesMatch = fullContent.match(/"files"\s*:\s*\{([\s\S]*?)(?:\}|,"indexFile")/)
                  if (filesMatch) {
                    const filesStr = filesMatch[1]
                    // Match individual "key": "value" pairs
                    // Note: This regex is simplified for real-time extraction
                    const filePairs = filesStr.match(/"([^"]+)"\s*:\s*"([\s\S]*?)(?:"(?:\s*,|\s*)|$)/g)
                    if (filePairs) {
                      const tempFiles: Record<string, string> = { ...generatedFiles }
                      filePairs.forEach(pair => {
                        try {
                          // Clean pair and split
                          const splitIdx = pair.indexOf('":')
                          if (splitIdx !== -1) {
                            const name = pair.substring(1, splitIdx)
                            let content = pair.substring(splitIdx + 3).trim()
                            // Remove trailing quote and comma if they exist
                            if (content.endsWith('",')) content = content.slice(0, -2)
                            else if (content.endsWith('"')) content = content.slice(0, -1)

                            // Unescape JSON characters (new lines, etc)
                            const unescapedContent = content
                              .replace(/\\n/g, '\n')
                              .replace(/\\r/g, '\r')
                              .replace(/\\t/g, '\t')
                              .replace(/\\"/g, '"')
                              .replace(/\\\\/g, '\\')

                            tempFiles[name] = unescapedContent
                          }
                        } catch (e) { }
                      })
                      setGeneratedFiles(tempFiles)
                    }
                  }
                } catch (e) { }
              }

              // Live status updates from custom steps if they appear in the stream
              if (fullContent.includes('"steps"')) {
                const stepsMatch = fullContent.match(/"steps"\s*:\s*\[([\s\S]*?)\]/)
                if (stepsMatch) {
                  try {
                    const partialSteps = JSON.parse(`[${stepsMatch[1]}]`)
                    if (Array.isArray(partialSteps)) {
                      setPlanSteps(partialSteps.map((s: any, idx) => ({
                        ...s,
                        status: idx === 0 ? "active" : "pending"
                      })))
                    }
                  } catch { }
                }
              }
            }
          } catch (e) {
            console.error("Stream parse error:", e)
          }
        }
      }

      // Process complete content
      try {
        let cleanContent = fullContent
        if (cleanContent.includes("```json")) {
          cleanContent = cleanContent.split("```json")[1].split("```")[0]
        } else if (cleanContent.includes("```")) {
          const parts = cleanContent.split("```")
          if (parts.length >= 3) cleanContent = parts[1]
        }

        const jsonStart = cleanContent.indexOf("{")
        const jsonEnd = cleanContent.lastIndexOf("}")

        if (jsonStart !== -1 && jsonEnd !== -1) {
          const parsedJson = JSON.parse(cleanContent.substring(jsonStart, jsonEnd + 1))

          if (parsedJson.overview) setProjectOverview(parsedJson.overview)

          // SET CUSTOM STEPS FROM AI
          if (parsedJson.steps && Array.isArray(parsedJson.steps)) {
            setPlanSteps(parsedJson.steps.map((s: any) => ({ ...s, status: "complete" as const })))
          } else {
            // Fallback if AI didn't provide steps
            setPlanSteps(prev => prev.map(s => ({ ...s, status: "complete" as const })))
          }

          if (parsedJson.files) {
            setGeneratedFiles(parsedJson.files)
            const indexKey = Object.keys(parsedJson.files).find(f => f.endsWith("index.html")) || "index.html"
            setActiveFile(indexKey)

            // BUNDLER LOGIC: Inject files into index.html for the preview
            let bundledHtml = parsedJson.files[indexKey] || ""

            Object.keys(parsedJson.files).forEach(path => {
              if (path.endsWith(".css")) {
                const cssContent = parsedJson.files[path]
                const escapedPath = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                const linkRegex = new RegExp(`<link[^>]*href=["']${escapedPath}["'][^>]*>`, 'gi')
                bundledHtml = bundledHtml.replace(linkRegex, `<style>${cssContent}</style>`)
              }
            })

            Object.keys(parsedJson.files).forEach(path => {
              if (path.endsWith(".js") || path.endsWith(".ts") || path.endsWith(".tsx")) {
                const jsContent = parsedJson.files[path]
                const escapedPath = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                const scriptRegex = new RegExp(`<script[^>]*src=["']${escapedPath}["'][^>]*>\\s*</script>`, 'gi')
                bundledHtml = bundledHtml.replace(scriptRegex, `<script type="module">${jsContent}</script>`)
              }
            })

            setFinalPreviewHtml(bundledHtml)
            saveProjectToHistory(parsedJson.overview || "Generated Project", parsedJson.files)
          }
        }
      } catch (e) {
        console.error("Parse Error:", e)
        toast.error("Failed to parse AI output. Try a simpler prompt.")
      }

      setActiveTab("preview")
    } catch (error) {
      console.error(error)
      toast.error("Generation failed. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(generatedFiles[activeFile] || "")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success("Code copied to clipboard")
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <main className="flex-1 flex flex-col overflow-hidden relative bg-[#0a0a0b]">
        {/* Header */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-card/10 backdrop-blur-xl px-6 z-20">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[10px] uppercase tracking-wider font-bold text-primary">
              <Sparkles className="h-3 w-3" />
              <span>Advanced Agentic Engine</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-xl border border-border bg-muted/20 p-1">
              <button
                onClick={() => setActiveTab("plan")}
                className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${activeTab === "plan" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Rocket className="h-3.5 w-3.5" />
                Plan
              </button>
              <button
                onClick={() => setActiveTab("code")}
                className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${activeTab === "code" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Code2 className="h-3.5 w-3.5" />
                Code
              </button>
              <button
                onClick={() => setActiveTab("preview")}
                className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${activeTab === "preview" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Eye className="h-3.5 w-3.5" />
                Preview
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {activeTab === "plan" && (
              <motion.div
                key="plan"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full overflow-auto flex items-center justify-center p-6"
              >
                <AnimatePresence>
                  {isFirstPrompt ? (
                    <motion.div
                      key="splash"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 1.5, opacity: 0, filter: "blur(10px)" }}
                      transition={{ duration: 0.8, ease: "anticipate" }}
                      className="text-center"
                    >
                      <h1 className="text-8xl font-black bg-gradient-to-t from-white/20 to-white bg-clip-text text-transparent tracking-tighter">
                        Prompt2Web
                      </h1>
                      <p className="text-muted-foreground mt-4 text-sm tracking-widest uppercase">
                        Advanced AI Web Architect
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="roadmap"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="w-full max-w-3xl"
                    >
                      {projectOverview && (
                        <div className="mb-8 rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm">
                          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                            <Layout className="h-5 w-5 text-primary" />
                            Blueprint
                          </h2>
                          <div className="prose prose-sm prose-invert max-w-none text-muted-foreground text-xs leading-relaxed">
                            {projectOverview}
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        {planSteps.length > 0 ? planSteps.map((step, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`group flex items-start gap-4 rounded-xl border p-4 transition-all ${step.status === "active" ? "border-primary bg-primary/5 shadow-[0_0_20px_rgba(var(--primary),0.1)] scale-[1.01]" : "border-white/5 bg-white/2"}`}
                          >
                            <div className="mt-1">
                              {step.status === "complete" ? (
                                <div className="rounded-full bg-green-500/20 p-1 text-green-500">
                                  <Check className="h-3 w-3" />
                                </div>
                              ) : step.status === "active" ? (
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                              ) : (
                                <div className="h-2 w-2 rounded-full bg-white/10" />
                              )}
                            </div>
                            <div>
                              <h3 className="text-sm font-bold">{step.title}</h3>
                              <p className="text-xs text-muted-foreground">{step.description}</p>
                            </div>
                          </motion.div>
                        )) : (
                          <div className="text-center py-20">
                            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                            <p className="text-sm text-muted-foreground">Architecting your solution...</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {activeTab === "code" && (
              <motion.div
                key="code"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full overflow-hidden"
              >
                <div className="w-64 border-r border-border bg-black/40 flex flex-col shrink-0">
                  <div className="p-4 border-b border-white/5 flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Explorer</span>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                      {Object.keys(generatedFiles).map(file => (
                        <button
                          key={file}
                          onClick={() => setActiveFile(file)}
                          className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-left transition-all ${activeFile === file ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}
                        >
                          <FileText className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{file}</span>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <div className="flex-1 flex flex-col bg-[#0d0d0e]">
                  <div className="flex items-center justify-between border-b border-white/5 bg-black/20 px-4 py-2">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                      <FileText className="h-3 w-3" />
                      {activeFile}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-white" onClick={copyCode}>
                      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                  <div className="flex-1 relative">
                    <Editor
                      height="100%"
                      defaultLanguage="javascript"
                      language={activeFile.endsWith(".html") ? "html" : activeFile.endsWith(".css") ? "css" : "javascript"}
                      value={generatedFiles[activeFile] || ""}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 12,
                        readOnly: true,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        wordWrap: "on",
                        fontFamily: "JetBrains Mono, monospace"
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "preview" && (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full bg-white flex flex-col"
              >
                {!finalPreviewHtml ? (
                  <div className="flex h-full flex-col items-center justify-center bg-[#0a0a0b] p-6">
                    <div className="relative mb-12 h-40 w-40">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 rounded-full border-t border-primary/40 border-l border-primary/20 shadow-[0_0_50px_rgba(var(--primary),0.1)]"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Rocket className="h-12 w-12 text-primary animate-pulse" />
                      </div>
                    </div>
                    <h2 className="text-3xl font-black bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent tracking-tight">
                      İnşa Ediliyor...
                    </h2>
                    <p className="mt-4 max-w-xs text-muted-foreground text-xs leading-relaxed text-center opacity-60">
                      Advanced Engine, projenizi profesyonel standartlarda orkestra ediyor.
                    </p>
                  </div>
                ) : (
                  <iframe
                    ref={iframeRef}
                    title="Site Preview"
                    srcDoc={finalPreviewHtml}
                    className="h-full w-full border-none"
                    sandbox="allow-scripts allow-modals allow-forms"
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Global Prompt Bar */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-50">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="relative overflow-hidden rounded-3xl border border-white/5 bg-black/40 p-2 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10"
          >
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Örn: Modern bir fintech landing sayfası inşa et..."
                disabled={isGenerating}
                className="flex-1 bg-transparent px-6 py-3 text-sm focus:outline-none disabled:opacity-50 placeholder:text-white/20"
              />
              <Button
                type="submit"
                disabled={isGenerating || !prompt.trim()}
                className="rounded-2xl px-8 h-12 bg-primary hover:bg-primary/90 transition-all font-bold text-xs uppercase tracking-widest shadow-[0_0_30px_rgba(var(--primary),0.4)]"
              >
                {isGenerating ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span className="mr-2">Assemle</span>
                    <Send className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
