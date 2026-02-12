import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
    try {
        const { prompt, mode, model } = await req.json()

        const rawKey = process.env.GEMINI_API_KEY || ""
        if (!rawKey) {
            return NextResponse.json(
                { error: "Gemini API key is not configured" },
                { status: 500 }
            )
        }

        const systemPrompt =
            mode === "planning"
                ? `You are an elite full-stack product engineer, UI/UX designer, and frontend architect. 
You do NOT generate single-file websites. You do NOT generate placeholder-only layouts.
You ALWAYS build production-ready, multi-page, animated, component-based web applications.

Design Philosophy:
- Sites must resemble elite platforms like emergent.sh, lovable.dev, v0.dev.
- Aesthetics: High-end SaaS look, dark mode, glassmorphism, fluid animations (Framer Motion).

Default Stack:
- Next.js (App Router), Tailwind CSS, Framer Motion, Lucide Icons.

You must respond with a JSON object containing:
1. "overview": A detailed markdown overview following this structure:
   1️⃣ PROJECT OVERVIEW (Site type, UX goals, Visual style)
   2️⃣ ROUTES / PAGES (/ , /about, /features, /pricing, etc)
   3️⃣ COMPONENT LIST (Navbar, Footer, Hero, FeatureCard, etc)
   4️⃣ ANIMATION PLAN (Transitions, Scroll, Hover)
   5️⃣ FILE STRUCTURE (app/, components/, styles/, lib/)
2. "steps": An array of technical engineering steps.
3. "files": A map where keys are file paths and values are code.
4. "indexFile": Path to the main entry file (usually "index.html").

Rules for "files":
- Prohibit single-file output. Use modular components.
- "index.html" must act as a 'Web Container' that correctly executes the local project structure for the preview.

Respond ONLY with valid JSON.`
                : `You are an elite full-stack product engineer. 
Build a production-ready, multi-file, animated web application using Next.js (simulated), Tailwind, and Framer Motion.
Respond with a JSON object containing a "files" map. Prohibit placeholder layouts.
Ensure the design is elite (High-end SaaS look, dark mode, smooth transitions).
Respond ONLY with valid JSON.`

        const geminiModel = model === "gemini-flash" ? "gemini-2.0-flash" : "gemini-2.0-pro-exp-02-05"
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:streamGenerateContent?key=${rawKey}`

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: "user",
                        parts: [{ text: `${systemPrompt}\n\nUser Request: ${prompt}` }],
                    },
                ],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 8000,
                },
            }),
        })

        if (!response.ok) {
            const errorText = await response.text()
            return NextResponse.json(
                { error: "Gemini API error", details: errorText },
                { status: response.status }
            )
        }

        const stream = new ReadableStream({
            async start(controller) {
                const reader = response.body?.getReader()
                if (!reader) {
                    controller.close()
                    return
                }
                const decoder = new TextDecoder()
                let buffer = ""

                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    buffer += decoder.decode(value, { stream: true })
                    const lines = buffer.split("\n")
                    buffer = lines.pop() || ""

                    for (const line of lines) {
                        const trimmed = line.trim()
                        if (!trimmed) continue

                        // Gemini stream formats: data is inside JSON chunks
                        try {
                            // Handle potential multiple JSON objects in one line or split across lines
                            // This is a simplified version for Gemini's specific stream format
                            if (trimmed.startsWith("[") || trimmed.startsWith(",")) continue
                            const cleanedLine = trimmed.replace(/^,/, "").trim()
                            if (!cleanedLine || cleanedLine === "]" || cleanedLine === "[") continue

                            const parsed = JSON.parse(cleanedLine)
                            const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text
                            if (content) {
                                controller.enqueue(
                                    new TextEncoder().encode(
                                        `data: ${JSON.stringify({ content })}\n\n`
                                    )
                                )
                            }
                        } catch {
                            // skip unparseable chunks
                        }
                    }
                }
                controller.close()
            },
        })

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
            },
        })
    } catch (error) {
        console.error("Gemini Route Error:", error)
        return NextResponse.json(
            { error: "Internal server error", details: String(error) },
            { status: 500 }
        )
    }
}
