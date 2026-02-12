"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { useLocale } from "@/lib/locale-context"
import { useRouter } from "next/navigation"
import { db } from "@/lib/firebase"
import { collection, getDocs } from "firebase/firestore"
import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Users,
  DollarSign,
  FolderOpen,
  Activity,
  Settings,
  Search,
  MoreHorizontal,
  TrendingUp,
  Eye,
  Ban,
  Key,
  Save,
  Link2,
  BarChart3,
  Loader2,
  Shield,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface UserRecord {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  isAdmin: boolean
  plan: string
  createdAt: string
}

type AdminTab = "overview" | "users" | "analytics" | "settings"

export default function AdminPage() {
  const { userData, loading: authLoading } = useAuth()
  const { t } = useLocale()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<AdminTab>("overview")
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [lemonApiKey, setLemonApiKey] = useState("")
  const [lemonWebhook, setLemonWebhook] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!authLoading && (!userData || !userData.isAdmin)) {
      router.push("/")
    }
  }, [authLoading, userData, router])

  useEffect(() => {
    if (userData?.isAdmin) {
      loadUsers()
    }
  }, [userData])

  const loadUsers = async () => {
    setLoadingUsers(true)
    try {
      const querySnapshot = await getDocs(collection(db, "users"))
      const userList: UserRecord[] = []
      querySnapshot.forEach((docSnap) => {
        userList.push(docSnap.data() as UserRecord)
      })
      setUsers(userList)
    } catch {
      // Error loading users
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleUpdatePlan = async (uid: string, newPlan: string) => {
    try {
      const { doc, updateDoc } = await import("firebase/firestore")
      await updateDoc(doc(db, "users", uid), { plan: newPlan })
      loadUsers() // Refresh list
    } catch (err) {
      console.error("Error updating plan:", err)
    }
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    // In production, save these to Firestore admin settings
    await new Promise((r) => setTimeout(r, 1000))
    setSaving(false)
  }

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!userData?.isAdmin) return null

  const filteredUsers = users.filter(
    (u) =>
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stats = [
    {
      label: t.admin.totalUsers,
      value: users.length.toString(),
      icon: Users,
      change: "+12%",
    },
    {
      label: t.admin.revenue,
      value: `$${(users.filter((u) => u.plan !== "free").length * 14).toLocaleString()}`,
      icon: DollarSign,
      change: "+8%",
    },
    {
      label: t.admin.projects,
      value: (users.length * 3).toString(),
      icon: FolderOpen,
      change: "+24%",
    },
    {
      label: "Active Today",
      value: Math.max(1, Math.floor(users.length * 0.6)).toString(),
      icon: Activity,
      change: "+5%",
    },
  ]

  const tabs: { key: AdminTab; icon: typeof Users; label: string }[] = [
    { key: "overview", icon: BarChart3, label: "Overview" },
    { key: "users", icon: Users, label: t.admin.users },
    { key: "analytics", icon: Activity, label: t.admin.analytics },
    { key: "settings", icon: Settings, label: t.admin.settings },
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-border px-6">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5" />
            <h1 className="text-lg font-bold">{t.admin.title}</h1>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-0.5">
            {tabs.map((tab) => (
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
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Stats Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {stats.map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.1 }}
                      className="rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:border-foreground/10"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground/5">
                          <stat.icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          <TrendingUp className="h-3 w-3" />
                          {stat.change}
                        </span>
                      </div>
                      <div className="mt-3">
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Recent users */}
                <div className="mt-8">
                  <h2 className="mb-4 text-lg font-semibold">Recent Users</h2>
                  <div className="rounded-xl border border-border bg-card">
                    <div className="divide-y divide-border">
                      {users.slice(0, 5).map((user, i) => (
                        <motion.div
                          key={user.uid}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center justify-between px-5 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.photoURL || undefined} />
                              <AvatarFallback className="bg-foreground/5 text-xs">
                                {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{user.displayName || "User"}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-[10px] font-medium uppercase">
                              {user.plan || "free"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                      {users.length === 0 && (
                        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                          No users yet
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Users Tab */}
            {activeTab === "users" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{t.admin.userManagement}</h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder={t.admin.search}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-64 pl-9"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card">
                  {/* Table header */}
                  <div className="grid grid-cols-6 gap-4 border-b border-border px-5 py-3 text-xs font-medium text-muted-foreground">
                    <div className="col-span-2">User</div>
                    <div>{t.admin.role}</div>
                    <div>{t.admin.plan}</div>
                    <div>{t.admin.joined}</div>
                    <div className="text-right">{t.admin.actions}</div>
                  </div>

                  {/* Table rows */}
                  <div className="divide-y divide-border">
                    {loadingUsers ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                        {t.common.noResults}
                      </div>
                    ) : (
                      filteredUsers.map((user, i) => (
                        <motion.div
                          key={user.uid}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.03 }}
                          className="grid grid-cols-6 gap-4 px-5 py-3 transition-colors hover:bg-accent/50"
                        >
                          <div className="col-span-2 flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.photoURL || undefined} />
                              <AvatarFallback className="bg-foreground/5 text-xs">
                                {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {user.displayName || "User"}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {user.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${user.isAdmin
                                  ? "bg-foreground text-background"
                                  : "bg-muted text-muted-foreground"
                                }`}
                            >
                              {user.isAdmin ? "Admin" : "User"}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-[10px] font-medium uppercase">
                              {user.plan || "free"}
                            </span>
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground">
                            {user.createdAt
                              ? new Date(user.createdAt).toLocaleDateString()
                              : "N/A"}
                          </div>
                          <div className="flex items-center justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="liquid-glass">
                                <DropdownMenuItem className="cursor-pointer gap-2">
                                  <Eye className="h-3.5 w-3.5" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="cursor-pointer gap-2"
                                  onClick={() => handleUpdatePlan(user.uid, "free")}
                                >
                                  Set Free Plan
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="cursor-pointer gap-2"
                                  onClick={() => handleUpdatePlan(user.uid, "plus")}
                                >
                                  Set Plus Plan
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="cursor-pointer gap-2"
                                  onClick={() => handleUpdatePlan(user.uid, "pro")}
                                >
                                  Set Pro Plan
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer gap-2 text-destructive">
                                  <Ban className="h-3.5 w-3.5" />
                                  Suspend
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Analytics Tab */}
            {activeTab === "analytics" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="mb-6 text-lg font-semibold">{t.admin.analytics}</h2>
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Placeholder charts */}
                  <div className="rounded-xl border border-border bg-card p-6">
                    <h3 className="mb-4 text-sm font-semibold">Users Over Time</h3>
                    <div className="flex h-48 items-end gap-2">
                      {[40, 55, 35, 70, 60, 85, 75, 90, 80, 95, 88, 100].map((h, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ duration: 0.5, delay: i * 0.05 }}
                          className="flex-1 rounded-t-sm bg-foreground/10 transition-colors hover:bg-foreground/20"
                        />
                      ))}
                    </div>
                    <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                      <span>Jan</span>
                      <span>Mar</span>
                      <span>May</span>
                      <span>Jul</span>
                      <span>Sep</span>
                      <span>Dec</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-6">
                    <h3 className="mb-4 text-sm font-semibold">Plan Distribution</h3>
                    <div className="flex h-48 items-center justify-center gap-8">
                      {[
                        { label: "Free", pct: 60, color: "bg-muted-foreground/20" },
                        { label: "Plus", pct: 25, color: "bg-foreground/40" },
                        { label: "Pro", pct: 15, color: "bg-foreground" },
                      ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${item.pct * 1.5}px` }}
                            transition={{ duration: 0.6, delay: i * 0.1 }}
                            className={`w-16 rounded-t-lg ${item.color}`}
                          />
                          <span className="text-xs font-medium">{item.label}</span>
                          <span className="text-xs text-muted-foreground">{item.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
                    <h3 className="mb-4 text-sm font-semibold">Revenue Trend</h3>
                    <div className="flex h-32 items-end gap-1">
                      {[20, 35, 28, 45, 52, 40, 60, 55, 70, 65, 80, 75, 90, 85, 95, 88].map((h, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ duration: 0.5, delay: i * 0.03 }}
                          className="flex-1 rounded-t-sm bg-foreground/15 transition-colors hover:bg-foreground/25"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="max-w-2xl"
              >
                <h2 className="mb-6 text-lg font-semibold">{t.admin.settings}</h2>

                {/* Lemon Squeezy */}
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFC233]/10">
                      <DollarSign className="h-5 w-5 text-[#FFC233]" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{t.admin.lemonSqueezy}</h3>
                      <p className="text-xs text-muted-foreground">
                        Connect Lemon Squeezy to accept payments
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="lemon-api" className="text-sm">
                        {t.admin.lemonApiKey}
                      </Label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="lemon-api"
                          type="password"
                          placeholder="ls_live_..."
                          value={lemonApiKey}
                          onChange={(e) => setLemonApiKey(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="lemon-webhook" className="text-sm">
                        {t.admin.lemonWebhook}
                      </Label>
                      <div className="relative">
                        <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="lemon-webhook"
                          type="url"
                          placeholder="https://your-domain.com/api/webhooks/lemon"
                          value={lemonWebhook}
                          onChange={(e) => setLemonWebhook(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleSaveSettings}
                      disabled={saving}
                      className="w-fit gap-2"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {t.admin.save}
                    </Button>
                  </div>
                </div>

                {/* General Settings */}
                <div className="mt-6 rounded-xl border border-border bg-card p-6">
                  <h3 className="mb-4 font-semibold">General Settings</h3>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <Label className="text-sm">Site Name</Label>
                      <Input defaultValue="Prompt2Web" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label className="text-sm">Support Email</Label>
                      <Input defaultValue="support@prompt2web.app" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label className="text-sm">Max Free Projects</Label>
                      <Input type="number" defaultValue="3" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label className="text-sm">Max Free Generations/Month</Label>
                      <Input type="number" defaultValue="10" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
