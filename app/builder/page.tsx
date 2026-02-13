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
  FolderOpen
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

  const [planSteps, setPlanSteps] = useState<PlanStep[]>([
    { title: "Analyzing Request", description: "Breaking down UI, logic, and architecture (GPT OSS 120B)", status: "pending" },
    { title: "Understanding Requirements", description: "Mapping needs to interactive components (GLM 4.5 AI)", status: "pending" },
    { title: "Planning Architecture", description: "Defining folder structure and tech stack (GPT OSS 120B)", status: "pending" },
    { title: "Designing UI Structure", description: "Creating wireframes and choosing styles (GLM 4.5 AI)", status: "pending" },
    { title: "Building Components", description: "Coding modular JS/CSS files (Deepseek R1)", status: "pending" },
    { title: "Generating Production Code", description: "Full assembly and logic integration (Deepseek + Groq)", status: "pending" },
    { title: "Optimizing & Refinement", description: "Debugging and performance tweaks (Deepseek R1)", status: "pending" },
    { title: "Adding Responsiveness", description: "Final media queries and smooth animations (GLM + Deepseek)", status: "pending" },
  ])

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
    setActiveTab("plan")
    setGeneratedFiles({})
    setFinalPreviewHtml("")
    setProjectOverview("")

    // Reset steps
    setPlanSteps(prev => prev.map(s => ({ ...s, status: "pending" })))

    try {
      updateStep(0, "active")

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
      let fullContent = ""
      let currentStepIndex = 0

      // Realistic progress simulation
      const stepInterval = setInterval(() => {
        if (currentStepIndex < 5) {
          updateStep(currentStepIndex, "complete")
          currentStepIndex++
          updateStep(currentStepIndex, "active")
        } else {
          clearInterval(stepInterval)
        }
      }, 4000)

      while (true) {
        const { done, value } = await reader!.read()
        if (done) break
        const chunk = decoder.decode(value)
        fullContent += chunk
      }

      clearInterval(stepInterval)

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
          if (parsedJson.files) {
            setGeneratedFiles(parsedJson.files)
            const indexKey = Object.keys(parsedJson.files).find(f => f.endsWith("index.html")) || "index.html"
            setActiveFile(indexKey)

            // BUNDLER LOGIC: Inject files into index.html for the preview
            let bundledHtml = parsedJson.files[indexKey] || ""

            // Inject CSS files
            Object.keys(parsedJson.files).forEach(path => {
              if (path.endsWith(".css")) {
                const cssContent = parsedJson.files[path]
                // Escape paths for regex
                const escapedPath = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                const linkRegex = new RegExp(`<link[^>]*href=["']${escapedPath}["'][^>]*>`, 'gi')
                bundledHtml = bundledHtml.replace(linkRegex, `<style>${cssContent}</style>`)
              }
            })

            // Inject JS files
            Object.keys(parsedJson.files).forEach(path => {
              if (path.endsWith(".js") || path.endsWith(".ts") || path.endsWith(".tsx")) {
                const jsContent = parsedJson.files[path]
                const escapedPath = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                const scriptRegex = new RegExp(`<script[^>]*src=["']${escapedPath}["'][^>]*>\\s*</script>`, 'gi')
                // Simple bundling: replace script tag with inline script
                bundledHtml = bundledHtml.replace(scriptRegex, `<script type="module">${jsContent}</script>`)
              }
            })

            setFinalPreviewHtml(bundledHtml)

            // Save to user history
            saveProjectToHistory(parsedJson.overview || "Generated Project", parsedJson.files)
          }
        }
      } catch (e) {
        console.error("Parse Error:", e)
        toast.error("Failed to parse AI output, but check the code tab.")
      }

      // Complete remaining steps
      for (let i = currentStepIndex; i < planSteps.length; i++) {
        updateStep(i, "active")
        await new Promise(r => setTimeout(r, 800))
        updateStep(i, "complete")
      }

      setActiveTab("preview")
    } catch (error) {
      console.error(error)
      toast.error("An error occurred during generation.")
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

  const downloadProject = () => {
    // Basic download logic could be added here
    toast.info("Download feature coming soon!")
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-card/50 backdrop-blur-md px-6 z-20">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3 w-3" />
              <span>Auto-Pilot Mode</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border bg-muted/50 p-1">
              <button
                onClick={() => setActiveTab("plan")}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${activeTab === "plan" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Rocket className="h-3.5 w-3.5" />
                Plan
              </button>
              <button
                onClick={() => setActiveTab("code")}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${activeTab === "code" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Code2 className="h-3.5 w-3.5" />
                Code
              </button>
              <button
                onClick={() => setActiveTab("preview")}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${activeTab === "preview" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Eye className="h-3.5 w-3.5" />
                Preview
              </button>
            </div>

            <Button variant="outline" size="sm" className="h-8 gap-2" onClick={downloadProject}>
              <Download className="h-3.5 w-3.5" />
              Download
            </Button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {activeTab === "plan" && (
              <motion.div
                key="plan"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full overflow-auto p-6 md:p-10"
              >
                <div className="mx-auto max-w-3xl">
                  {projectOverview && (
                    <div className="mb-10 rounded-2xl border border-border bg-card p-6 shadow-sm">
                      <h2 className="text-xl font-bold mb-4">Project Overview</h2>
                      <div className="prose prose-sm prose-invert max-w-none text-muted-foreground">
                        {projectOverview}
                      </div>
                    </div>
                  )}

                  <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <Rocket className="h-5 w-5 text-primary" />
                    Execution Roadmap
                  </h2>
                  <div className="space-y-4">
                    {planSteps.map((step, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`group relative flex items-start gap-4 rounded-xl border p-4 transition-all ${step.status === "active" ? "border-primary/50 bg-primary/5 shadow-md scale-[1.02]" : "border-border bg-card"}`}
                      >
                        <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center">
                          {step.status === "complete" ? (
                            <div className="rounded-full bg-green-500/20 p-1 text-green-500">
                              <Check className="h-3.5 w-3.5" />
                            </div>
                          ) : step.status === "active" ? (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          ) : (
                            <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                          )}
                        </div>
                        <div>
                          <h3 className={`text-sm font-semibold ${step.status === "active" ? "text-primary" : "text-foreground"}`}>
                            {step.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {step.description}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
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
                {/* File Explorer */}
                <div className="w-64 border-r border-border bg-muted/10 flex flex-col shrink-0">
                  <div className="p-4 border-b border-border flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Project Files</span>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                      {Object.keys(generatedFiles).length > 0 ? (
                        Object.keys(generatedFiles).map(file => (
                          <button
                            key={file}
                            onClick={() => setActiveFile(file)}
                            className={`w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-left transition-colors ${activeFile === file ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"}`}
                          >
                            <FileText className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{file}</span>
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center text-xs text-muted-foreground italic">
                          No files generated yet
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Editor */}
                <div className="flex-1 flex flex-col bg-[#1e1e1e]">
                  <div className="flex items-center justify-between border-b border-white/5 bg-[#252526] px-4 py-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
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
                        fontSize: 13,
                        readOnly: true,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        wordWrap: "on",
                        padding: { top: 16 }
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
                  <div className="flex h-full flex-col items-center justify-center bg-background p-6 text-center">
                    <div className="relative mb-8 h-32 w-32">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 rounded-full border-t-2 border-primary"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="h-10 w-10 text-primary animate-pulse" />
                      </div>
                    </div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                      Website oluşturuluyor...
                    </h2>
                    <p className="mt-4 max-w-md text-muted-foreground text-sm">
                      Advanced Agentic Platform, modelleri orkestra ederek profesyonel mimarinizi inşa ediyor. Lütfen bekleyin.
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
            className="relative overflow-hidden rounded-2xl border border-border bg-card/80 p-2 shadow-2xl backdrop-blur-xl ring-1 ring-white/10"
          >
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Örn: Navbar ve Hero olan modern bir portfolyo oluştur..."
                disabled={isGenerating}
                className="flex-1 bg-transparent px-4 py-3 text-sm focus:outline-none disabled:opacity-50"
              />
              <Button
                type="submit"
                disabled={isGenerating || !prompt.trim()}
                className="rounded-xl px-5 h-11 bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                {isGenerating ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span className="mr-2">Generate</span>
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
