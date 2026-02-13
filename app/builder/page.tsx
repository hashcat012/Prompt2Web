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

    const currentPrompt = prompt
    setIsGenerating(true)
    setIsFirstPrompt(false)
    setGeneratedFiles({})
    setFinalPreviewHtml("")
    setProjectOverview("")

    // Initial analysis steps (fallback roadmap)
    const initialSteps: PlanStep[] = [
      { title: "İstek Analiz Ediliyor", description: "Yapay zeka gereksinimleri ayrıştırıyor...", status: "active" },
      { title: "Mimari Planlama", description: "Dosya yapısı ve bileşen hiyerarşisi oluşturuluyor...", status: "pending" },
      { title: "Kod Üretimi", description: "Bileşenler ve stiller detaylıca yazılıyor...", status: "pending" },
      { title: "Proje Montajı", description: "Tüm dosyalar bir araya getiriliyor...", status: "pending" }
    ]
    setPlanSteps(initialSteps)

    // Manual step simulation (fallback)
    let manualStepIndex = 0
    const stepTimer = setInterval(() => {
      if (manualStepIndex < initialSteps.length - 1) {
        updateStep(manualStepIndex, "complete")
        manualStepIndex++
        updateStep(manualStepIndex, "active")
      } else {
        clearInterval(stepTimer)
      }
    }, 5000)

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

      if (!response.ok) {
        clearInterval(stepTimer)
        throw new Error("API hatası")
      }

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
            }
          } catch (e) { }
        }
      }

      clearInterval(stepTimer)

      // Final Process
      try {
        let cleanContent = fullContent.trim()
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
            setPlanSteps(initialSteps.map(s => ({ ...s, status: "complete" as const })))
          }

          if (parsedJson.files) {
            setGeneratedFiles(parsedJson.files)
            const indexKey = Object.keys(parsedJson.files).find(f => f.endsWith("index.html")) || "index.html"
            setActiveFile(indexKey)

            // BUNDLER
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
            saveProjectToHistory(parsedJson.overview || "Generated Project", parsedJson.files, currentPrompt)
            toast.success("Proje başarıyla oluşturuldu!")
          }
        } else {
          throw new Error("Geçersiz JSON yapısı")
        }
      } catch (e) {
        console.error("Parse Error:", e)
        toast.error("AI yanıtı işlenemedi, ancak ham çıktı Kod sekmesinde görüntülenebilir.")
        setGeneratedFiles({ "raw_output.md": fullContent })
        setActiveFile("raw_output.md")
        setActiveTab("code")
      }

    } catch (error) {
      console.error(error)
      toast.error("Oluşturma işlemi başarısız oldu.")
    } finally {
      setIsGenerating(false)
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(generatedFiles[activeFile] || "")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success("Kod kopyalandı!")
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#050505] text-white">
      <AppSidebar />
      <main className="flex-1 flex overflow-hidden">

        {/* LEFT COLUMN */}
        <div className="w-[380px] flex flex-col border-r border-white/5 bg-[#0a0a0b] relative z-20">
          <div className="flex-1 overflow-auto p-6 flex flex-col">
            <header className="mb-10 flex items-center justify-between">
              <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-[10px] uppercase tracking-widest font-black text-primary border border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.1)]">
                <Sparkles className="h-3 w-3" />
                <span>Advanced Agent Engine</span>
              </div>
            </header>

            <AnimatePresence mode="wait">
              {isFirstPrompt ? (
                <motion.div
                  key="splash"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                  className="flex-1 flex flex-col items-center justify-center text-center px-4"
                >
                  <h1 className="text-7xl font-black bg-gradient-to-b from-white to-white/30 bg-clip-text text-transparent tracking-tighter mb-6 selection:bg-primary/30">
                    Prompt2Web
                  </h1>
                  <p className="text-muted-foreground text-xs tracking-[0.3em] uppercase opacity-50 font-medium">
                    Yapay Zeka Yazılım Mühendisi
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="roadmap"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8"
                >
                  <div>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-6">
                      <Terminal className="h-3.5 w-3.5" />
                      Geliştirme Yol Haritası
                    </div>

                    <div className="space-y-4">
                      {planSteps.map((step, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className={`group relative flex items-start gap-4 rounded-2xl border p-4 transition-all duration-500 ${step.status === "active"
                              ? "border-primary bg-primary/5 shadow-[0_0_25px_rgba(var(--primary),0.1)] scale-[1.02]"
                              : step.status === "complete"
                                ? "border-white/10 bg-white/[0.02]"
                                : "border-white/5 bg-transparent opacity-30"
                            }`}
                        >
                          <div className="mt-1 shrink-0">
                            {step.status === "complete" ? (
                              <div className="rounded-full bg-green-500/20 p-1.5 text-green-500">
                                <Check className="h-3 w-3" />
                              </div>
                            ) : step.status === "active" ? (
                              <div className="relative h-6 w-6">
                                <Loader2 className="absolute inset-0 h-6 w-6 animate-spin text-primary" />
                                <div className="absolute inset-1.5 h-3 w-3 rounded-full bg-primary/20 animate-pulse" />
                              </div>
                            ) : (
                              <div className="h-2 w-2 rounded-full bg-white/20 m-2" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className={`text-xs font-black uppercase tracking-wider ${step.status === "active" ? "text-primary" : "text-white/80"}`}>
                              {step.title}
                            </h3>
                            <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed font-medium">
                              {step.description}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {projectOverview && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-sm"
                    >
                      <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-4 flex items-center gap-2">
                        <Layout className="h-3.5 w-3.5" />
                        Proje Spesifikasyonu
                      </div>
                      <ScrollArea className="h-48">
                        <div className="prose prose-invert max-w-none text-[11px] leading-relaxed text-muted-foreground/80 font-medium">
                          {projectOverview}
                        </div>
                      </ScrollArea>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* BOTTOM PROMPT AREA */}
          <div className="p-6 border-t border-white/5 bg-black/40 backdrop-blur-2xl">
            <form onSubmit={handleSubmit} className="relative">
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Bugün ne inşa ediyoruz?"
                disabled={isGenerating}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all disabled:opacity-50 pr-14 placeholder:text-white/20 font-medium"
              />
              <button
                type="submit"
                disabled={isGenerating || !prompt.trim()}
                className="absolute right-2 top-2 h-12 w-12 flex items-center justify-center rounded-xl bg-primary text-white hover:bg-primary/90 transition-all shadow-lg shadow-primary/30 disabled:opacity-50 disabled:shadow-none"
              >
                {isGenerating ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            </form>
            <p className="mt-4 text-[9px] text-center text-white/20 uppercase tracking-[0.2em] font-black">
              Powered by Google Antigravity
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex-1 flex flex-col bg-black relative z-10 selection:bg-primary/30">
          <div className="h-14 flex items-center justify-between px-8 border-b border-white/5 bg-[#0a0a0b]/80 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="bg-white/5 rounded-xl p-1 flex border border-white/5">
                <button
                  onClick={() => setActiveTab("preview")}
                  className={`flex items-center gap-2 px-5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === "preview" ? "bg-primary text-white shadow-[0_0_20px_rgba(var(--primary),0.3)]" : "text-white/40 hover:text-white hover:bg-white/5"}`}
                >
                  <Eye className="h-4 w-4" />
                  Preview
                </button>
                <button
                  onClick={() => setActiveTab("code")}
                  className={`flex items-center gap-2 px-5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === "code" ? "bg-primary text-white shadow-[0_0_20px_rgba(var(--primary),0.3)]" : "text-white/40 hover:text-white hover:bg-white/5"}`}
                >
                  <Code2 className="h-4 w-4" />
                  Code
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {activeTab === "code" && Object.keys(generatedFiles).length > 0 && (
                <Button variant="ghost" size="sm" className="h-9 px-4 text-[10px] uppercase font-black tracking-widest gap-2 bg-white/5 border border-white/5 hover:bg-white/10 hover:text-white text-white/60" onClick={copyCode}>
                  {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  Copy Code
                </Button>
              )}
              <Button variant="ghost" size="sm" className="h-9 px-4 text-[10px] uppercase font-black tracking-widest gap-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20">
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
            </div>
          </div>

          <div className="flex-1 relative overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === "preview" && (
                <motion.div
                  key="preview-panel"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full w-full bg-white relative"
                >
                  {isGenerating && !finalPreviewHtml ? (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#050505]">
                      <div className="relative mb-10 h-40 w-40 flex items-center justify-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 rounded-full border-[3px] border-primary/10 border-t-primary shadow-[0_0_40px_rgba(var(--primary),0.1)]"
                        />
                        <motion.div
                          animate={{ rotate: -360 }}
                          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-4 rounded-full border border-white/5 border-b-white/20"
                        />
                        <Rocket className="h-12 w-12 text-primary animate-pulse" />
                      </div>
                      <h2 className="text-2xl font-black tracking-tighter text-white mb-3 selection:bg-primary/30">PROJE MONTAJI YAPILIYOR</h2>
                      <p className="text-[10px] text-white/30 uppercase tracking-[0.4em] font-medium">Advanced Agent is architecting your solution</p>
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
                    <div className="h-full flex flex-col items-center justify-center bg-[#050505] opacity-10">
                      <Layout className="h-20 w-20 mb-6" />
                      <p className="text-[10px] font-black uppercase tracking-[0.3em]">Henüz bir önizleme yok</p>
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
                  <div className="w-[200px] bg-[#0a0a0b] border-r border-white/5 flex flex-col shrink-0">
                    <div className="p-4 border-b border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
                      Dosya Yapısı
                    </div>
                    <ScrollArea className="flex-1 p-3">
                      <div className="space-y-1.5">
                        {Object.keys(generatedFiles).map(file => (
                          <button
                            key={file}
                            onClick={() => setActiveFile(file)}
                            className={`w-full text-left px-4 py-2.5 rounded-xl text-[11px] font-bold transition-all truncate flex items-center gap-3 border ${activeFile === file ? "bg-primary/10 border-primary/20 text-primary shadow-sm" : "text-white/40 border-transparent hover:bg-white/5 hover:text-white/80"}`}
                          >
                            <FileText className="h-3.5 w-3.5 shrink-0" />
                            {file}
                          </button>
                        ))}
                        {Object.keys(generatedFiles).length === 0 && (
                          <div className="py-10 text-center opacity-10 flex flex-col items-center">
                            <FolderOpen className="h-8 w-8 mb-2" />
                            <span className="text-[9px] uppercase font-black">Dosya Yok</span>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Editor */}
                  <div className="flex-1 bg-[#0d0d0f]">
                    <Editor
                      height="100%"
                      language={activeFile.endsWith(".html") ? "html" : activeFile.endsWith(".css") ? "css" : "javascript"}
                      value={generatedFiles[activeFile] || "// Henüz içerik üretilmedi..."}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        readOnly: true,
                        automaticLayout: true,
                        fontFamily: "JetBrains Mono, monospace",
                        padding: { top: 24, bottom: 24 },
                        lineNumbersMinChars: 3,
                        scrollBeyondLastLine: false,
                        smoothScrolling: true,
                        cursorBlinking: "smooth",
                        renderLineHighlight: "all"
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
