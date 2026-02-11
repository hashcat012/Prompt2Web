"use client"

import Link from "next/link"
import { Zap } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground">
                <Zap className="h-3.5 w-3.5 text-background" />
              </div>
              <span className="font-bold">Prompt2Web</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Build production-ready websites with AI. From prompt to deployment in seconds.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Product</h4>
            <div className="flex flex-col gap-2">
              <Link href="/builder" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Builder</Link>
              <Link href="/pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Pricing</Link>
              <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Docs</Link>
              <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Changelog</Link>
            </div>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Company</h4>
            <div className="flex flex-col gap-2">
              <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground">About</Link>
              <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Blog</Link>
              <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Careers</Link>
              <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Contact</Link>
            </div>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Legal</h4>
            <div className="flex flex-col gap-2">
              <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Privacy</Link>
              <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Terms</Link>
              <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Security</Link>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          2024 Prompt2Web. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
