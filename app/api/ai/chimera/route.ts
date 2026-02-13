import { NextResponse } from "next/server"

export const runtime = "edge"

export async function POST(req: Request) {
    try {
        const { prompt, model } = await req.json()
        const apiKey = process.env.CHIMERA_API_KEY
        const apiUrl = "https://chimeragpt.adproqx.com/v1/chat/completions"

        if (!apiKey) {
            return NextResponse.json({ error: "API key is missing" }, { status: 500 })
        }

        const systemPrompt = `You are an Advanced Agentic Development Platform powered by Google Antigravity.
You build massive, production-ready web applications with elite UI/UX and proper project architecture.

CORE WORKFLOW:
1. Analyze: Break down the request into UI, logic, and architecture.
2. Plan: Create a technical roadmap with specific files and steps.
3. Execute: Generate a COMPLETE multi-file project structure.

CRITICAL OUTPUT REQUIREMENT:
You MUST respond with a single valid JSON object with this EXACT structure:
{
  "overview": "# Project Title\\n\\n## Architecture\\n- Detailed architecture explanation\\n- Tech stack\\n- File structure\\n\\n## Features\\n\\n## Components",
  "steps": [
    { "title": "Analyzing Request", "description": "...", "status": "pending" },
    { "title": "Building Core Structure", "description": "...", "status": "pending" }
  ],
  "files": {
    "index.html": "<!DOCTYPE html>...",
    "styles/main.css": "...",
    "styles/components.css": "...",
    "styles/animations.css": "...",
    "scripts/app.js": "...",
    "scripts/components/Navbar.js": "...",
    "scripts/components/Hero.js": "...",
    "scripts/utils/api.js": "..."
  },
  "indexFile": "index.html"
}

MANDATORY PROJECT STRUCTURE RULES:
1. **ALWAYS create multiple files** - NEVER put everything in index.html. A professional project MUST have at least 8-10 files.
2. **Separate concerns properly**:
   - HTML files: Minimal structure (index.html).
   - CSS files in styles/: main.css (tokens/reset), components.css (all UI styles), animations.css (keyframes).
   - JS files in scripts/: app.js (entry), config.js, components/, utils/.
3. **Component Architecture**:
   - Each major UI component (Navbar, Hero, Slider, Footer, etc.) gets its own JS file in scripts/components/.
   - Components MUST be detailed classes or functions with at least 100-200 lines of code each.
4. **NO PLACEHOLDERS**: Every file must contain complete, production-ready code. No "implement here" comments.
5. **AESTHETICS**: Use modern design (glassmorphism, gradients, heavy animations).

RESPONSE FORMAT:
- Respond ONLY with the JSON object.
- NO markdown code blocks.
- NO truncation. If you run out of space, ensure the JSON is still validly closed.
- Use Turkish for project descriptions and UI text if the user prompt is in Turkish.

CRITICAL: I want a MASSIVE amount of code. Don't be lazy. Use the full 8000 token limit.`

        let selectedModel = model
        if (model === "auto" || !model) {
            const lowerPrompt = prompt.toLowerCase()
            if (lowerPrompt.includes("design") || lowerPrompt.includes("ui") || lowerPrompt.includes("css") || lowerPrompt.includes("animation")) {
                selectedModel = "z-ai/glm-4.5-air:free"
            } else if (lowerPrompt.includes("backend") || lowerPrompt.includes("api") || lowerPrompt.includes("database") || lowerPrompt.includes("logic")) {
                selectedModel = "deepseek/deepseek-r1-0528:free"
            } else {
                selectedModel = "openai/gpt-oss-120b:free"
            }
        }

        const messages = [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
        ]

        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: selectedModel,
                messages: messages,
                temperature: 0.7,
                max_tokens: 8000,
                stream: true,
            }),
        })

        if (!response.ok) {
            const errorText = await response.text()
            return NextResponse.json({ error: "Chimera API error", details: errorText }, { status: response.status })
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
                                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`))
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
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
