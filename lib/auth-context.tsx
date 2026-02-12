"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import {
  auth,
  db,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  doc,
  getDoc,
  setDoc,
  type User,
} from "./firebase"

interface UserData {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  isAdmin: boolean
  plan: "free" | "plus" | "pro"
  createdAt: string
}

interface AuthContextType {
  user: User | null
  userData: UserData | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  signOut: async () => { },
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid)
          const userDoc = await getDoc(userDocRef)

          if (userDoc.exists()) {
            setUserData(userDoc.data() as UserData)
          } else {
            console.log("Creating new user document in Firestore...")
            const newUserData: UserData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
              photoURL: firebaseUser.photoURL || "",
              isAdmin: false,
              plan: "free",
              createdAt: new Date().toISOString(),
            }
            await setDoc(userDocRef, newUserData)
            setUserData(newUserData)
            console.log("User document created successfully.")
          }
        } catch (err) {
          console.error("Firestore sync error:", err)
        }
      } else {
        setUserData(null)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const signOut = async () => {
    await firebaseSignOut(auth)
    setUser(null)
    setUserData(null)
  }

  return (
    <AuthContext.Provider value={{ user, userData, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
