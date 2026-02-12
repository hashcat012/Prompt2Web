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
                ? `You are an elite full-stack engineer and UI/UX designer.
You build production-ready, multi-file web applications.

CRITICAL PREVIEW REQUIREMENT:
- You must provide a master "index.html" in the "files" object.
- This "index.html" MUST be a self-contained Web Container.
- It must include all required CSS (Tailwind via CDN) and JS libraries (Framer Motion, Lucide via ESM).
- It must render the entire application by importing/loading the other files you generate.
- The preview depends ENTIRELY on this index.html being fully functional and styled.

Project Structure:
- Modular components in separate files.
- Elite aesthetics: High-end SaaS look, dark mode, glassmorphism, fluid animations.

Default Stack:
- Next.js (App Router style), Tailwind CSS, Framer Motion, Lucide Icons.

JSON Output:
1. "overview": Markdown summary (Project, Routes, Components, Animations, File Structure).
2. "steps": Technical roadmap.
3. "files": Map of file paths to FULL source code.
4. "indexFile": "index.html".

Respond ONLY with valid JSON.`
                : `You are an elite developer. Build a production-ready, multi-file web app.
Ensure "index.html" is a master file that renders everything with Tailwind and animations.
Respond ONLY with JSON containing the "files" map.`

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
