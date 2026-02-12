import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
    try {
        const { prompt, mode, model } = await req.json()

        // Key mapping based on model
        let rawKey = ""
        if (model === "openai/gpt-oss-120b:free" || model === "deepseek/deepseek-r1-0528:free") {
            rawKey = process.env.OPENROUTER_API_KEY || ""
        } else {
            rawKey = process.env.CHIMERA_API_KEY || ""
        }

        const apiKey = rawKey.trim().startsWith("Bearer ") ? rawKey.trim() : `Bearer ${rawKey.trim()}`

        if (!rawKey) {
            return NextResponse.json(
                { error: `API key for ${model} is not configured` },
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
   1️⃣ PROJECT OVERVIEW
   2️⃣ ROUTES / PAGES
   3️⃣ COMPONENT LIST
   4️⃣ ANIMATION PLAN
   5️⃣ FILE STRUCTURE
2. "steps": An array of technical engineering steps.
3. "files": A map where keys are file paths and values are code.
4. "indexFile": Path to the main entry file (usually "index.html").

Rules:
- Modular components only. No single index.html.
- "index.html" must be a container that loads the components for preview.

Respond ONLY with valid JSON.`
                : `You are an elite full-stack engineer. 
Build a production-ready, multi-file, animated web application using Next.js (simulated), Tailwind, and Framer Motion.
Respond with a JSON object containing a "files" map.
Ensure the design is elite (High-end SaaS look, dark mode, smooth transitions).
Respond ONLY with valid JSON.`

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: apiKey,
                "HTTP-Referer": "https://prompt2web.vercel.app", // Adjust if needed
                "X-Title": "Prompt2Web",
            },
            body: JSON.stringify({
                model: model || "openai/gpt-oss-120b:free",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: prompt },
                ],
                temperature: 0.7,
                max_tokens: 4000,
                stream: true,
            }),
        })

        if (!response.ok) {
            const errorText = await response.text()
            let errorDetails = errorText
            try {
                const parsedError = JSON.parse(errorText)
                errorDetails = parsedError.error?.message || errorText
            } catch { }
            return NextResponse.json(
                { error: "Chimera/OpenRouter API error", details: errorDetails },
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
                        if (!trimmed || !trimmed.startsWith("data: ")) continue
                        const data = trimmed.slice(6)
                        if (data === "[DONE]") {
                            controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"))
                            continue
                        }
                        try {
                            const parsed = JSON.parse(data)
                            const content = parsed.choices?.[0]?.delta?.content
                            if (content) {
                                controller.enqueue(
                                    new TextEncoder().encode(
                                        `data: ${JSON.stringify({ content })}\n\n`
                                    )
                                )
                            }
                        } catch { }
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
        console.error("Chimera Route Error:", error)
        return NextResponse.json(
            { error: "Internal server error", details: String(error) },
            { status: 500 }
        )
    }
}
