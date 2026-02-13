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
  Layout,
  Terminal
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
  const [activeTab, setActiveTab] = useState<"code" | "preview">("preview")
  const [generatedFiles, setGeneratedFiles] = useState<Record<string, string>>({})
  const [activeFile, setActiveFile] = useState<string>("index.html")
  const [projectOverview, setProjectOverview] = useState("")
  const [finalPreviewHtml, setFinalPreviewHtml] = useState("")
  const [copied, setCopied] = useState(false)
  const [isFirstPrompt, setIsFirstPrompt] = useState(true)

  const [planSteps, setPlanSteps] = useState<PlanStep[]>([])

  const iframeRef = useRef<HTMLIFrameElement>(null)

  const saveProjectToHistory = async (overview: string, files: Record<string, string>, currentPrompt: string) => {
    if (!user) return
    try {
      await addDoc(collection(db, "projects"), {
        userId: user.uid,
        prompt: currentPrompt,
        overview: overview,
        files: files,
        createdAt: serverTimestamp(),
        title: overview.split("\n")[0].replace("#", "").trim() || "Untitled Project"
      })
    } catch (e) {
      console.error("Failed to save project history:", e)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || isGenerating) return

    const currentPrompt = prompt
    setIsGenerating(true)
    setIsFirstPrompt(false)
    setGeneratedFiles({})
    setFinalPreviewHtml("")
    setProjectOverview("")

    // Initial analysis steps before AI specific steps arrive
    setPlanSteps([
      { title: "Analyzing Request", description: "Breaking down prompt requirements...", status: "active" },
      { title: "Planning Architecture", description: "Calculating optimal file structure...", status: "pending" }
    ])

    try {
      const response = await fetch("/api/ai/chimera", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: currentPrompt,
          model: "auto",
          stream: true
        }),
      })

      if (!response.ok) throw new Error("API request failed")

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullContent = ""
      let streamBuffer = ""

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

              // Live status updates from custom steps if they appear
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
          } catch (e) { }
        }
      }

      // Process complete content after stream finishes
      try {
        let cleanContent = fullContent.trim()

        // Try to extract JSON from code blocks if present
        if (cleanContent.includes("```json")) {
          cleanContent = cleanContent.split("```json")[1].split("```")[0]
        } else if (cleanContent.includes("```")) {
          const parts = cleanContent.split("```")
          if (parts.length >= 3) cleanContent = parts[1]
        }

        const jsonStart = cleanContent.indexOf("{")
        const jsonEnd = cleanContent.lastIndexOf("}")

        if (jsonStart !== -1 && jsonEnd !== -1) {
          const jsonString = cleanContent.substring(jsonStart, jsonEnd + 1)
          const parsedJson = JSON.parse(jsonString)

          if (parsedJson.overview) setProjectOverview(parsedJson.overview)

          if (parsedJson.steps && Array.isArray(parsedJson.steps)) {
            setPlanSteps(parsedJson.steps.map((s: any) => ({ ...s, status: "complete" as const })))
          } else {
            setPlanSteps(prev => prev.map(s => ({ ...s, status: "complete" as const })))
          }

          if (parsedJson.files) {
            setGeneratedFiles(parsedJson.files)
            const indexKey = Object.keys(parsedJson.files).find(f => f.endsWith("index.html")) || "index.html"
            setActiveFile(indexKey)

            // BUNDLER LOGIC
            let bundledHtml = parsedJson.files[indexKey] || ""

            // Inject CSS
            Object.keys(parsedJson.files).forEach(path => {
              if (path.endsWith(".css")) {
                const cssContent = parsedJson.files[path]
                const escapedPath = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                const linkRegex = new RegExp(`<link[^>]*href=["']${escapedPath}["'][^>]*>`, 'gi')
                bundledHtml = bundledHtml.replace(linkRegex, `<style>${cssContent}</style>`)
              }
            })

            // Inject JS
            Object.keys(parsedJson.files).forEach(path => {
              if (path.endsWith(".js") || path.endsWith(".ts") || path.endsWith(".tsx")) {
                const jsContent = parsedJson.files[path]
                const escapedPath = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                const scriptRegex = new RegExp(`<script[^>]*src=["']${escapedPath}["'][^>]*>\\s*</script>`, 'gi')
                bundledHtml = bundledHtml.replace(scriptRegex, `<script type="module">${jsContent}</script>`)
              }
            })

            setFinalPreviewHtml(bundledHtml)
            saveProjectToHistory(parsedJson.overview || "Generated Project", parsedJson.files, currentPrompt)
          }
        } else {
          throw new Error("Invalid JSON structure returned from AI")
        }
      } catch (e) {
        console.error("Parse Error:", e)
        toast.error("AI response interpretation failed. Output might be incomplete.")
        // Even if JSON fails, display what we have in the code tab as raw if possible
        setGeneratedFiles({ "failed_output.json": fullContent })
        setActiveFile("failed_output.json")
        setActiveTab("code")
      }

    } catch (error) {
      console.error(error)
      toast.error("Generation process failed.")
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
    <div className="flex h-screen overflow-hidden bg-[#050505]">
      <AppSidebar />
      <main className="flex-1 flex overflow-hidden">

        {/* LEFT COLUMN: PLAN & PROMPT */}
        <div className="w-1/3 flex flex-col border-r border-white/5 bg-[#0a0a0b] relative">
          <div className="flex-1 overflow-auto p-6 flex flex-col">
            <header className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[10px] uppercase tracking-widest font-black text-primary border border-primary/20">
                <Sparkles className="h-3 w-3" />
                <span>Agentic Engine</span>
              </div>
            </header>

            <AnimatePresence mode="wait">
              {isFirstPrompt ? (
                <motion.div
                  key="splash"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex-1 flex flex-col items-center justify-center text-center px-4"
                >
                  <h1 className="text-6xl font-black bg-gradient-to-b from-white to-white/20 bg-clip-text text-transparent tracking-tighter mb-4">
                    Prompt2Web
                  </h1>
                  <p className="text-muted-foreground text-sm tracking-widest uppercase opacity-40">
                    Your Personal Software Engineer
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="roadmap"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/40 mb-2">
                    <Terminal className="h-3.5 w-3.5" />
                    Current Roadmap
                  </div>

                  <div className="space-y-3">
                    {planSteps.length > 0 ? planSteps.map((step, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`group relative flex items-start gap-3 rounded-xl border p-3.5 transition-all ${step.status === "active"
                            ? "border-primary/50 bg-primary/5 shadow-[0_0_15px_rgba(var(--primary),0.05)]"
                            : step.status === "complete"
                              ? "border-white/10 bg-white/5"
                              : "border-white/5 bg-transparent opacity-40"
                          }`}
                      >
                        <div className="mt-0.5">
                          {step.status === "complete" ? (
                            <div className="rounded-full bg-green-500/20 p-1 text-green-500">
                              <Check className="h-3 w-3" />
                            </div>
                          ) : step.status === "active" ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                          ) : (
                            <div className="h-1.5 w-1.5 rounded-full bg-white/20 mx-1" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className={`text-xs font-bold ${step.status === "active" ? "text-primary" : "text-white/90"}`}>
                            {step.title}
                          </h3>
                          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{step.description}</p>
                        </div>
                      </motion.div>
                    )) : (
                      <div className="flex flex-col items-center justify-center py-20 opacity-20">
                        <Loader2 className="h-8 w-8 animate-spin mb-4" />
                        <p className="text-xs uppercase tracking-widest">Architecting...</p>
                      </div>
                    )}
                  </div>

                  {projectOverview && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-8 rounded-xl border border-white/5 bg-[#111112] p-4"
                    >
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3 flex items-center gap-2">
                        <Layout className="h-3 w-3" />
                        Project Spec
                      </div>
                      <div className="prose prose-invert max-w-none text-[11px] leading-relaxed text-muted-foreground">
                        {projectOverview}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* PROMPT BAR (Attached to Left Column) */}
          <div className="p-4 border-t border-white/5 bg-black/20">
            <form onSubmit={handleSubmit} className="relative group">
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What are we building today?"
                disabled={isGenerating}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all disabled:opacity-50 pr-12"
              />
              <button
                type="submit"
                disabled={isGenerating || !prompt.trim()}
                className="absolute right-2 top-1.5 h-10 w-10 flex items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none"
              >
                {isGenerating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: CODE & PREVIEW */}
        <div className="flex-1 flex flex-col bg-black relative">
          {/* Tabs */}
          <div className="h-14 flex items-center justify-between px-6 border-b border-white/5 bg-[#0a0a0b]/80 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <div className="bg-white/5 rounded-lg p-1 flex">
                <button
                  onClick={() => setActiveTab("preview")}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${activeTab === "preview" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-white"}`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </button>
                <button
                  onClick={() => setActiveTab("code")}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${activeTab === "code" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-white"}`}
                >
                  <Code2 className="h-3.5 w-3.5" />
                  Code
                </button>
              </div>
            </div>

            {activeTab === "code" && Object.keys(generatedFiles).length > 0 && (
              <Button variant="outline" size="sm" className="h-8 text-[10px] uppercase font-bold tracking-widest gap-2 bg-white/5 border-white/10 hover:bg-white/10" onClick={copyCode}>
                {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                Copy
              </Button>
            )}
          </div>

          <div className="flex-1 relative overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === "preview" && (
                <motion.div
                  key="preview-panel"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full w-full bg-white"
                >
                  {isGenerating && !finalPreviewHtml ? (
                    <div className="h-full flex flex-col items-center justify-center bg-[#050505]">
                      <div className="relative mb-8 h-32 w-32 flex items-center justify-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary"
                        />
                        <Rocket className="h-10 w-10 text-primary animate-pulse" />
                      </div>
                      <h2 className="text-xl font-bold tracking-tight text-white mb-2">Assembling Project...</h2>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest opacity-40">Heavy Lifting in Progress</p>
                    </div>
                  ) : finalPreviewHtml ? (
                    <iframe
                      ref={iframeRef}
                      title="Preview"
                      srcDoc={finalPreviewHtml}
                      className="h-full w-full border-none"
                      sandbox="allow-scripts allow-modals allow-forms h-full w-full"
                    />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center bg-[#050505] opacity-20">
                      <Layout className="h-12 w-12 mb-4" />
                      <p className="text-xs uppercase tracking-widest">No Preview Available</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "code" && (
                <motion.div
                  key="code-panel"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex"
                >
                  {/* Small File Tree */}
                  <div className="w-48 bg-[#0a0a0b] border-r border-white/5 flex flex-col shrink-0">
                    <div className="p-3 border-b border-white/5 text-[9px] font-black uppercase tracking-[0.2em] text-white/30">
                      Project Tree
                    </div>
                    <ScrollArea className="flex-1 p-2">
                      <div className="space-y-1">
                        {Object.keys(generatedFiles).map(file => (
                          <button
                            key={file}
                            onClick={() => setActiveFile(file)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-[11px] transition-all truncate flex items-center gap-2 ${activeFile === file ? "bg-primary/20 text-primary font-bold shadow-sm" : "text-muted-foreground hover:bg-white/5"}`}
                          >
                            <FileText className="h-3 w-3 shrink-0" />
                            {file}
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Editor */}
                  <div className="flex-1 bg-[#0d0d0f]">
                    <Editor
                      height="100%"
                      language={activeFile.endsWith(".html") ? "html" : activeFile.endsWith(".css") ? "css" : "javascript"}
                      value={generatedFiles[activeFile] || "// No content"}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 12,
                        readOnly: true,
                        automaticLayout: true,
                        fontFamily: "JetBrains Mono, monospace",
                        padding: { top: 20 }
                      }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  )
}
