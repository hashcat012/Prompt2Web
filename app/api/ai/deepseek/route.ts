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
        ? `You are a Senior Full-Stack Web Developer and UI/UX Designer.
The user wants a premium, high-end website. Analyze the request and plan a modern architecture.
You must respond with a JSON object containing:
1. "steps": An array of at least 5 detailed steps (title and description) focusing on UI/UX, state management, and responsiveness.
2. "code": The complete, production-ready code.

Design Requirements:
- Use Tailwind CSS for all styling.
- Use Framer Motion (via CDN: https://unpkg.com/framer-motion@11.0.8/dist/framer-motion.js) for premium animations.
- Use Lucide Icons (via CDN).
- Implement modern UI trends: Glassmorphism, smooth gradients, deep shadows, and professional typography (import Google Fonts).
- Ensure the site is fully responsive and looks like a boutique SaaS or a world-class portfolio.
- The code must be a single standalone HTML file but structured with modern component-based logic.

Respond ONLY with valid JSON:
{"steps": [...], "code": "<!DOCTYPE html>..."}`
        : `You are a Senior Full-Stack Web Developer and UI/UX Designer.
Generate a premium, state-of-the-art, high-end website based on the user's prompt.
Technical Stack:
- Tailwind CSS (CDN)
- Framer Motion (CDN) for micro-interactions and scroll animations.
- Lucide Icons (CDN).
- Google Fonts (Inter, Outfit, or Poppins).

UI/UX Standards:
- PREMIUM AESTHETICS: Use vibrant but professional colors, sleek dark modes, and glassmorphism.
- INTERACTIVE: Add hover effects, smooth transitions, and entry animations.
- RESPONSIVE: Mobile-first, perfectly aligned on all screens.
- Avoid "Basic HTML" looks. It must look like a high-budget Next.js landing page.

Respond ONLY with the complete HTML code starting with <!DOCTYPE html>. No explanations.`

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
