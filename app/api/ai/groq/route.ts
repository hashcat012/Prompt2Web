import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const { prompt, mode } = await req.json()

    const rawKey = process.env.GROQ_API_KEY || ""
    const apiKey = rawKey.trim().startsWith("Bearer ") ? rawKey.trim() : `Bearer ${rawKey.trim()}`

    if (!rawKey) {
      return NextResponse.json(
        { error: "Groq API key is not configured" },
        { status: 500 }
      )
    }

    const systemPrompt = `You are an Advanced Agentic Development Platform powered by Google Antigravity.
You build fully functional, production-ready web applications with elite UI/UX (Tailwind, Framer Motion) and robust interactivity.

CORE WORKFLOW (Planning Mode ONLY):
1. Analyze: Break down the request into UI, logic, and architecture.
2. Plan: Create a technical roadmap with specific files and steps.
3. Execute: Generate the full codebase in a single pass.

CRITICAL OUTPUT REQUIREMENT:
You MUST respond with a single valid JSON object.
Structure:
{
  "overview": "Markdown summary of the project, architecture, and features.",
  "steps": [
    { "title": "Step Title", "description": "Detailed description", "status": "pending" }
  ],
  "files": {
    "index.html": "<!DOCTYPE html>... (Master container importing all scripts/styles)",
    "src/app.js": "... (Main logic)",
    "src/components/Navbar.js": "..."
  },
  "indexFile": "index.html"
}

RULES:
- NO placeholders. Real, working code only.
- index.html must use CDN links for Tailwind, React, ReactDOM, Lucide, Framer Motion.
- Ensure the app is self-contained in the provided files.
- Elite Aesthetics: Dark mode by default, glassmorphism, nice gradients.
- Respond ONLY with the JSON object. Do not add markdown code blocks around the JSON.`

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: apiKey,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 4000,
          stream: true,
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      let errorDetails = errorText
      try {
        const parsedError = JSON.parse(errorText)
        errorDetails = parsedError.error?.message || errorText
      } catch {
        // use raw text
      }
      return NextResponse.json(
        { error: "Groq API error", details: errorDetails },
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
    console.error("Groq Route Error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    )
  }
}
