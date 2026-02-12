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
                ? `You are a World-Class Full-Stack Architect and UI/UX Designer.
The user wants a professional, multi-file web application.
Analyze the request and generate a sophisticated project structure.

You must respond with a JSON object containing:
1. "steps": At least 6 detailed engineering steps.
2. "files": An object where keys are file paths (e.g., "src/components/Hero.tsx") and values are the code.
3. "indexFile": The path to the main entry file (usually "index.html" for the preview).
4. "dependencies": A list of required libraries (Tailwind, Framer Motion, Lucide, etc.).

Design & Quality Rules:
- UI: Expert-level aesthetics, glassmorphism, fluid animations (Framer Motion).
- Structure: Modular components, clean separation of concerns.
- Delivery: Even though you provide multiple files, the "index.html" must be a special "Web Container" file that imports and executes the other "files" content correctly via script tags or a small internal loader, so it can be previewed in an iframe.
- Use Tailwind CSS and modern fonts.

Respond ONLY with valid JSON:
{"steps": [...], "files": {"path/to/file": "content"}, "indexFile": "index.html", "dependencies": [...]}`
                : `You are a Senior Full-Stack Developer.
Generate a professional-grade, multi-file web application.
Technical Stack: Tailwind CSS, Framer Motion, Lucide Icons.

Output Format:
Respond with a JSON object containing a "files" map.
The main "index.html" should be a master file that coordinates the local component "files".
Ensure the design is elite (High-end SaaS look, dark mode, smooth transitions).

Respond ONLY with valid JSON containing the "files" object.`

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
