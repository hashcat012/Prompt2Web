"use client"

import { motion } from "framer-motion"
import { useLocale } from "@/lib/locale-context"
import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import {
    Plus,
    Search,
    Filter,
    Layout,
    Smartphone,
    Globe,
    ShoppingCart,
    Briefcase,
    Layers
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

const templates = [
    {
        id: "saas-landing",
        name: "Elite SaaS Landing",
        description: "Modern dark mode landing page with fluid animations and pricing.",
        category: "Landing Page",
        icon: Globe,
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=500",
    },
    {
        id: "portfolio-pro",
        name: "Minimal Portfolio",
        description: "Clean, professional portfolio for designers and developers.",
        category: "Portfolio",
        icon: Briefcase,
        image: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=500",
    },
    {
        id: "ecom-dash",
        name: "E-Commerce Storefront",
        description: "High-conversion product pages and shopping experience.",
        category: "Store",
        icon: ShoppingCart,
        image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&q=80&w=500",
    },
    {
        id: "dashboard-dark",
        name: "Analytics Dashboard",
        description: "Complex UI for data visualization and user management.",
        category: "Web App",
        icon: Layers,
        image: "https://images.unsplash.com/photo-1484417855527-4482cf113cfc?auto=format&fit=crop&q=80&w=500",
    },
    {
        id: "mobile-app-landing",
        name: "App Showcase",
        description: "Vibrant layout to highlight mobile app features and downloads.",
        category: "Mobile",
        icon: Smartphone,
        image: "https://images.unsplash.com/photo-1551288049-bbdac8a28a1e?auto=format&fit=crop&q=80&w=500",
    },
    {
        id: "blog-modern",
        name: "Modern Content Hub",
        description: "Optimized for readability with powerful typography.",
        category: "Blog",
        icon: Layout,
        image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=500",
    },
]

export default function TemplatesPage() {
    const { t } = useLocale()
    const [search, setSearch] = useState("")

    const filtered = templates.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="flex h-screen bg-background">
            <AppSidebar />
            <div className="flex-1 overflow-auto p-8">
                <div className="mx-auto max-w-6xl">
                    <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Elite Templates</h1>
                            <p className="text-muted-foreground">Start from a professional blueprint and customize to perfection.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search templates..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="h-10 rounded-lg border border-border bg-card pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
                                />
                            </div>
                            <Button variant="outline" size="icon">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </div>
                    </header>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {filtered.map((template, i) => (
                            <motion.div
                                key={template.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                whileHover={{ y: -5 }}
                                className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
                            >
                                <div className="relative aspect-video overflow-hidden">
                                    <img
                                        src={template.image}
                                        alt={template.name}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                        <Link href={`/builder?template=${template.id}`}>
                                            <Button className="gap-2">
                                                Use Template
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                                <div className="p-5">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
                                            {template.category}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold">{template.name}</h3>
                                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                                        {template.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {filtered.length === 0 && (
                        <div className="py-20 text-center">
                            <p className="text-muted-foreground">No templates found matching your search.</p>
                            <Button variant="link" onClick={() => setSearch("")}>Clear filters</Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
