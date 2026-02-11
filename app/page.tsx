"use client"

import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/landing/hero"
import { Features } from "@/components/landing/features"
import { CTASection } from "@/components/landing/cta-section"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
