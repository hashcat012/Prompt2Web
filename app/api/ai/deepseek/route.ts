import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const { prompt, mode } = await req.json()

    const rawKey = process.env.DEEPSEEK_API_KEY || ""
    const apiKey = rawKey.trim().startsWith("Bearer ") ? rawKey.trim() : `Bearer ${rawKey.trim()}`

    if (!rawKey) {
      return NextResponse.json(
        { error: "DeepSeek API key is not configured" },
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

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
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
      } catch {
        // use raw text
      }
      return NextResponse.json(
        { error: "DeepSeek API error", details: errorDetails },
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
    console.error("DeepSeek Route Error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    )
  }
}
