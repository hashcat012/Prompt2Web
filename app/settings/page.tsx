"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useLocale } from "@/lib/locale-context"
import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { db, doc, updateDoc, deleteDoc, auth } from "@/lib/firebase"
import { updateProfile, deleteUser } from "firebase/auth"
import { motion } from "framer-motion"
import { User, Shield, CreditCard, Trash2, LogOut, Save, Camera } from "lucide-react"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
    const { user, userData, signOut } = useAuth()
    const { t } = useLocale()
    const router = useRouter()

    const [name, setName] = useState(user?.displayName || "")
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null)

    const handleUpdateProfile = async () => {
        if (!user) return
        setLoading(true)
        setMessage(null)
        try {
            // Update Firebase Auth profile
            await updateProfile(user, { displayName: name })

            // Update Firestore user document
            const userDocRef = doc(db, "users", user.uid)
            await updateDoc(userDocRef, { displayName: name })

            setMessage({ type: "success", text: "Profile updated successfully!" })
        } catch (err: any) {
            console.error(err)
            setMessage({ type: "error", text: "Failed to update profile." })
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteAccount = async () => {
        if (!user || !confirm("Are you sure you want to delete your account? This action is permanent.")) return
        setLoading(true)
        try {
            // Delete Firestore data
            await deleteDoc(doc(db, "users", user.uid))

            // Delete Firebase Auth user
            await deleteUser(user)

            router.push("/login")
        } catch (err: any) {
            console.error(err)
            alert("Please re-login to delete your account for security reasons.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex h-screen bg-background">
            <AppSidebar />
            <main className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="mx-auto max-w-4xl space-y-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
                    </div>

                    <Tabs defaultValue="profile" className="space-y-4">
                        <TabsList className="bg-card border border-border">
                            <TabsTrigger value="profile" className="gap-2">
                                <User className="h-4 w-4" /> Profile
                            </TabsTrigger>
                            <TabsTrigger value="billing" className="gap-2">
                                <CreditCard className="h-4 w-4" /> Billing
                            </TabsTrigger>
                            <TabsTrigger value="security" className="gap-2">
                                <Shield className="h-4 w-4" /> Security
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="profile" className="space-y-4">
                            <Card className="liquid-glass border-border/40">
                                <CardHeader>
                                    <CardTitle>Profile Information</CardTitle>
                                    <CardDescription>Update your personal details here.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center gap-6">
                                        <div className="relative group">
                                            <Avatar className="h-24 w-24 border-2 border-border group-hover:opacity-70 transition-opacity">
                                                <AvatarImage src={user?.photoURL || ""} />
                                                <AvatarFallback className="text-2xl">{user?.displayName?.charAt(0) || "U"}</AvatarFallback>
                                            </Avatar>
                                            <button className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Camera className="h-6 w-6 text-foreground" />
                                            </button>
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-lg font-medium">{user?.displayName || "User"}</h3>
                                            <p className="text-sm text-muted-foreground">{user?.email}</p>
                                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary uppercase">
                                                {userData?.plan || "Free"} Plan
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="name">Display Name</Label>
                                            <Input
                                                id="name"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="bg-background/50"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="email">Email Address</Label>
                                            <Input id="email" value={user?.email || ""} disabled className="bg-muted opacity-50" />
                                        </div>
                                    </div>

                                    {message && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`rounded-md p-3 text-sm ${message.type === "success" ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-destructive/10 text-destructive border border-destructive/20"}`}
                                        >
                                            {message.text}
                                        </motion.div>
                                    )}
                                </CardContent>
                                <CardFooter className="flex justify-between border-t border-border/40 pt-6">
                                    <Button variant="outline" className="gap-2" onClick={signOut}>
                                        <LogOut className="h-4 w-4" /> Sign Out
                                    </Button>
                                    <Button className="gap-2" onClick={handleUpdateProfile} disabled={loading}>
                                        {loading ? "Saving..." : <><Save className="h-4 w-4" /> Save Changes</>}
                                    </Button>
                                </CardFooter>
                            </Card>

                            <Card className="border-destructive/20 bg-destructive/5 shadow-none group transition-all hover:bg-destructive/10">
                                <CardHeader>
                                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                                    <CardDescription>Once you delete your account, there is no going back. Please be certain.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button variant="destructive" className="gap-2" onClick={handleDeleteAccount} disabled={loading}>
                                        <Trash2 className="h-4 w-4" /> Delete Account
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="billing">
                            <Card className="liquid-glass border-border/40">
                                <CardHeader>
                                    <CardTitle>Subscription Plan</CardTitle>
                                    <CardDescription>Manage your subscription and billing details.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between rounded-lg border border-border p-4 bg-muted/30">
                                        <div className="space-y-1">
                                            <p className="font-medium text-sm">Current Plan</p>
                                            <h4 className="text-xl font-bold uppercase">{userData?.plan || "Free"}</h4>
                                        </div>
                                        <Button onClick={() => router.push("/pricing")}>Upgrade Plan</Button>
                                    </div>
                                    <p className="text-sm text-muted-foreground italic text-center">Billing history and invoices will appear here once you upgrade.</p>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="security">
                            <Card className="liquid-glass border-border/40">
                                <CardHeader>
                                    <CardTitle>Security Preferences</CardTitle>
                                    <CardDescription>Keep your account secure.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label>Password</Label>
                                        <p className="text-sm text-muted-foreground">You are logged in with {user?.providerData[0]?.providerId === "google.com" ? "Google" : "Email"}.</p>
                                        {user?.providerData[0]?.providerId !== "google.com" && (
                                            <Button variant="outline" size="sm" className="w-fit">Change Password</Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
    )
}
