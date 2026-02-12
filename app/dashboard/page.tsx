"use client"

import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { useLocale } from "@/lib/locale-context"
import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import {
    Rocket,
    BarChart3,
    Clock,
    Zap,
    Plus,
    Layout,
    Settings,
    Shield
} from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
    const { user, userData } = useAuth()
    const { t } = useLocale()

    const stats = [
        { label: "Total Projects", value: "0", icon: Layout, color: "text-blue-500" },
        { label: "AI Generations", value: "0", icon: Zap, color: "text-amber-500" },
        { label: "Deployments", value: "0", icon: Rocket, color: "text-emerald-500" },
        { label: "Credits left", value: userData?.plan === "free" ? "10" : "Unlimited", icon: Shield, color: "text-purple-500" },
    ]

    return (
        <div className="flex h-screen bg-background">
            <AppSidebar />
            <div className="flex-1 overflow-auto p-8">
                <div className="mx-auto max-w-6xl">
                    <header className="mb-8 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Welcome back, {userData?.displayName || "Builder"}!</h1>
                            <p className="text-muted-foreground">Here's what's happening with your projects.</p>
                        </div>
                        <Link href="/builder">
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                New Project
                            </Button>
                        </Link>
                    </header>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {stats.map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="rounded-xl border border-border bg-card p-6 shadow-sm"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`rounded-lg bg-foreground/5 p-2 ${stat.color}`}>
                                        <stat.icon className="h-5 w-5" />
                                    </div>
                                    <span className="text-xs font-medium text-muted-foreground">Monthly</span>
                                </div>
                                <div className="text-2xl font-bold">{stat.value}</div>
                                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-12 grid gap-8 lg:grid-cols-3">
                        <div className="lg:col-span-2">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-xl font-semibold">Recent Projects</h2>
                                <Button variant="ghost" size="sm" className="text-xs">View All</Button>
                            </div>
                            <div className="rounded-xl border border-dashed border-border p-12 text-center bg-card/50">
                                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                    <Layout className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <h3 className="font-medium">No projects yet</h3>
                                <p className="text-sm text-muted-foreground mt-1">Start building your first elite web application today.</p>
                                <Link href="/builder">
                                    <Button variant="outline" className="mt-6" size="sm">Launch Builder</Button>
                                </Link>
                            </div>
                        </div>

                        <div>
                            <h2 className="mb-4 text-xl font-semibold">Current Plan</h2>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="rounded-xl border border-primary/20 bg-primary/5 p-6"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="rounded-full bg-primary/20 p-2 text-primary">
                                        <Zap className="h-5 w-5" />
                                    </div>
                                    <span className="text-lg font-bold uppercase tracking-wider">{userData?.plan || "free"}</span>
                                </div>
                                <p className="text-sm text-muted-foreground mb-6">
                                    {userData?.plan === "free"
                                        ? "You are currently exploring on the Free plan. Upgrade for elite tools."
                                        : `You have full access to ${userData?.plan} features.`}
                                </p>
                                <Link href="/pricing">
                                    <Button className="w-full" variant={userData?.plan === "free" ? "default" : "outline"}>
                                        {userData?.plan === "free" ? "Upgrade Now" : "Manage Subscription"}
                                    </Button>
                                </Link>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
