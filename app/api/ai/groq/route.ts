import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const { prompt, mode } = await req.json()

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "Groq API key is not configured" },
        { status: 500 }
      )
    }

    const systemPrompt =
      mode === "planning"
        ? `You are an expert web developer AI. The user will describe a website they want built. 
You must analyze their request and respond with a JSON object containing:
1. "steps": An array of step objects, each with "title" (short step name) and "description" (what this step does)
2. "code": The complete HTML/CSS/JS code for the website

Think carefully about the design, layout, responsiveness, and user experience.
Respond ONLY with valid JSON in this exact format:
{"steps": [{"title": "...", "description": "..."}], "code": "<!DOCTYPE html>..."}`
        : `You are an expert web developer AI. The user will describe a website they want built.
Generate complete, production-ready HTML/CSS/JS code for the website.
Include modern design with responsive layout, smooth animations, and clean typography.
Respond ONLY with the complete HTML code, starting with <!DOCTYPE html>.
Do not include any explanation, just the code.`

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
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
