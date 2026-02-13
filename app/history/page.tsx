"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore"
import { AppSidebar } from "@/components/app-sidebar"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import { FileText, Calendar, Code, ChevronRight, X, Loader2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import Editor from "@monaco-editor/react"

interface Project {
    id: string
    title: string
    overview: string
    prompt: string
    files: Record<string, string>
    createdAt: Timestamp
}

export default function HistoryPage() {
    const { user } = useAuth()
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedProject, setSelectedProject] = useState<Project | null>(null)
    const [activeFile, setActiveFile] = useState<string>("")

    useEffect(() => {
        async function fetchHistory() {
            if (!user) return
            try {
                const q = query(
                    collection(db, "projects"),
                    where("userId", "==", user.uid),
                    orderBy("createdAt", "desc")
                )
                const querySnapshot = await getDocs(q)
                const p: Project[] = []
                querySnapshot.forEach((doc) => {
                    p.push({ id: doc.id, ...doc.data() } as Project)
                })
                setProjects(p)
            } catch (e) {
                console.error("Error loading history:", e)
            } finally {
                setLoading(false)
            }
        }

        fetchHistory()
    }, [user])

    const openProject = (p: Project) => {
        setSelectedProject(p)
        // Set default active file
        const indexHtml = Object.keys(p.files).find(f => f.endsWith("index.html"))
        setActiveFile(indexHtml || Object.keys(p.files)[0] || "")
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <AppSidebar />
            <div className="flex-1 flex flex-col overflow-hidden bg-muted/10">
                <header className="flex h-14 items-center border-b border-border bg-card px-6">
                    <h1 className="text-lg font-semibold">Project History</h1>
                </header>

                <main className="flex-1 overflow-auto p-6">
                    {loading ? (
                        <div className="flex h-full items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-center">
                            <div className="mb-4 rounded-full bg-muted p-4">
                                <Calendar className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium">No history yet</h3>
                            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                                Projects you build in the AI Builder will appear here automatically.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {projects.map((project) => (
                                <motion.div
                                    key={project.id}
                                    layoutId={project.id}
                                    onClick={() => openProject(project)}
                                    className="group relative cursor-pointer overflow-hidden rounded-xl border border-border bg-card p-4 hover:shadow-md transition-all hover:border-primary/50"
                                    whileHover={{ y: -2 }}
                                >
                                    <div className="mb-3 flex items-start justify-between">
                                        <div className="rounded-md bg-primary/10 p-2 text-primary">
                                            <Code className="h-4 w-4" />
                                        </div>
                                        {project.createdAt && (
                                            <span className="text-xs text-muted-foreground font-mono">
                                                {format(project.createdAt.toDate(), "MMM d, yyyy")}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="font-semibold line-clamp-1">{project.title}</h3>
                                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                                        {project.prompt}
                                    </p>
                                    <div className="mt-4 flex items-center text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                                        View Code <ChevronRight className="ml-1 h-3 w-3" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </main>
            </div>

            {/* Project Details Modal */}
            <AnimatePresence>
                {selectedProject && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 md:p-10"
                        onClick={() => setSelectedProject(null)}
                    >
                        <motion.div
                            layoutId={selectedProject.id}
                            className="flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-card shadow-2xl ring-1 ring-border"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between border-b border-border px-6 py-4">
                                <div>
                                    <h2 className="text-xl font-bold">{selectedProject.title}</h2>
                                    <p className="text-xs text-muted-foreground">
                                        Generated on {selectedProject.createdAt && format(selectedProject.createdAt.toDate(), "PPP p")}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedProject(null)}
                                    className="rounded-full p-2 hover:bg-muted"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="flex flex-1 overflow-hidden">
                                {/* File List */}
                                <div className="w-64 border-r border-border bg-muted/10 flex flex-col">
                                    <div className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Files
                                    </div>
                                    <ScrollArea className="flex-1">
                                        <div className="px-2">
                                            {Object.keys(selectedProject.files).map(file => (
                                                <button
                                                    key={file}
                                                    onClick={() => setActiveFile(file)}
                                                    className={`w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-left mb-1 transition-colors ${activeFile === file ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"}`}
                                                >
                                                    <FileText className="h-4 w-4 shrink-0" />
                                                    <span className="truncate">{file}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </div>

                                {/* Editor View */}
                                <div className="flex-1 flex flex-col bg-[#1e1e1e]">
                                    <div className="h-full">
                                        <Editor
                                            height="100%"
                                            defaultLanguage="javascript"
                                            language={activeFile.endsWith(".html") ? "html" : activeFile.endsWith(".css") ? "css" : "javascript"}
                                            value={selectedProject.files[activeFile] || ""}
                                            theme="vs-dark"
                                            options={{
                                                readOnly: true,
                                                minimap: { enabled: false },
                                                fontSize: 13,
                                                automaticLayout: true
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
