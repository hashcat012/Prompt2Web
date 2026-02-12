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
