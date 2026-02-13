import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
    try {
        const { prompt, mode, model } = await req.json()

        // All these models provided by the user (ending in :free) are hosted on OpenRouter.
        // We will strictly use the OpenRouter endpoint and key.
        // If the user provided a separate CHIMERA_API_KEY, we will fallback to it only if OPENROUTER_API_KEY is missing,
        // specifically for the "chimera" named model, but generally OpenRouter key is preferred for OpenRouter.

        // Initial key lookup
        const rawKey = process.env.OPENROUTER_API_KEY || process.env.CHIMERA_API_KEY || ""

        const apiUrl = "https://openrouter.ai/api/v1/chat/completions"

        const apiKey = rawKey.trim().startsWith("Bearer ") ? rawKey.trim() : `Bearer ${rawKey.trim()}`

        if (!rawKey) {
            return NextResponse.json(
                { error: `API key for ${model} is not configured` },
                { status: 500 }
            )
        }

        const systemPrompt = `You are an Advanced Agentic Development Platform powered by Google Antigravity.
You build fully functional, production-ready web applications with elite UI/UX and proper project architecture.

CORE WORKFLOW (Planning Mode ONLY):
1. Analyze: Break down the request into UI, logic, and architecture.
2. Plan: Create a technical roadmap with specific files and steps.
3. Execute: Generate a COMPLETE multi-file project structure.

CRITICAL OUTPUT REQUIREMENT:
You MUST respond with a single valid JSON object with this EXACT structure:
{
  "overview": "# Project Title\\n\\n## Architecture\\n- Detailed architecture explanation\\n- Tech stack\\n- File structure\\n\\n## Features\\n- Feature list\\n\\n## Components\\n- Component breakdown",
  "steps": [
    { "title": "Setup Project Structure", "description": "Create base HTML and folder structure", "status": "pending" },
    { "title": "Build Components", "description": "Create reusable UI components", "status": "pending" },
    { "title": "Add Styling", "description": "Implement CSS with animations", "status": "pending" },
    { "title": "Implement Logic", "description": "Add JavaScript functionality", "status": "pending" },
    { "title": "Final Polish", "description": "Optimize and refine", "status": "pending" }
  ],
  "files": {
    "index.html": "<!DOCTYPE html>... (Main HTML with proper structure, imports all CSS/JS)",
    "styles/main.css": "/* Global styles, variables, resets */",
    "styles/components.css": "/* Component-specific styles */",
    "styles/animations.css": "/* Keyframes and transitions */",
    "scripts/app.js": "// Main application logic",
    "scripts/components/Navbar.js": "// Navbar component",
    "scripts/components/Hero.js": "// Hero section component",
    "scripts/utils/helpers.js": "// Utility functions",
    "scripts/config.js": "// Configuration and constants"
  },
  "indexFile": "index.html"
}

MANDATORY PROJECT STRUCTURE RULES:
1. **ALWAYS create multiple files** - NEVER put everything in index.html
2. **Separate concerns properly**:
   - HTML files: Structure only (index.html, pages if needed)
   - CSS files in styles/: main.css, components.css, animations.css
   - JS files in scripts/: app.js, components/, utils/
3. **Component Architecture**:
   - Each major UI component gets its own JS file in scripts/components/
   - Each component should be a class or function
   - Components should be modular and reusable
4. **Styling Architecture**:
   - styles/main.css: CSS variables, resets, global styles
   - styles/components.css: Component-specific styles
   - styles/animations.css: All @keyframes and transitions
5. **JavaScript Architecture**:
   - scripts/app.js: Main entry point, initializes everything
   - scripts/components/: UI components (Navbar, Hero, Card, etc.)
   - scripts/utils/: Helper functions, API calls, utilities
   - scripts/config.js: Constants, API keys (placeholder), settings

AESTHETIC REQUIREMENTS:
- Modern, premium design (glassmorphism, gradients, shadows)
- Smooth animations (fade-in, slide-up, hover effects)
- Dark mode by default with proper color scheme
- Responsive design (mobile-first approach)
- Professional typography (use Google Fonts)

TECHNICAL REQUIREMENTS:
- Use vanilla JavaScript (ES6+) or React via CDN
- Tailwind CSS via CDN or custom CSS
- Framer Motion for animations (if using React)
- Lucide icons via CDN
- All code must be production-ready, no placeholders
- Proper error handling and edge cases

EXAMPLE FILE STRUCTURE:
For a "Portfolio Website" you should generate:
- index.html (structure, imports)
- styles/main.css (variables, resets, global)
- styles/components.css (navbar, hero, projects, footer)
- styles/animations.css (fade-in, slide-up, hover effects)
- scripts/app.js (initialization, routing if needed)
- scripts/components/Navbar.js (navigation component)
- scripts/components/Hero.js (hero section)
- scripts/components/Projects.js (projects grid)
- scripts/components/Contact.js (contact form)
- scripts/utils/validation.js (form validation)
- scripts/utils/animations.js (scroll animations)
- scripts/config.js (site config, social links)

RESPONSE FORMAT:
- Respond ONLY with the JSON object
- Do NOT wrap in markdown code blocks
- Ensure all file paths use forward slashes
- Each file must have complete, working code
- No TODO comments or placeholders`


        // DYNAMIC MODEL SELECTION (AUTO-PILOT)
        // Analyze the prompt to pick the best model from available free options:
        // - UI/Frontend -> GLM-4.5 Air or Qwen
        // - Backend/Logic -> DeepSeek R1 / Qwen
        // - General/Planning -> GPT-OSS 120B

        // Since we are receiving "model: auto" from frontend, we decide here.
        let selectedModel = model;
        if (model === "auto" || !model) {
            const lowerPrompt = prompt.toLowerCase();
            if (lowerPrompt.includes("design") || lowerPrompt.includes("ui") || lowerPrompt.includes("css") || lowerPrompt.includes("animation")) {
                selectedModel = "z-ai/glm-4.5-air:free"; // Great for frontend/creative
            } else if (lowerPrompt.includes("backend") || lowerPrompt.includes("api") || lowerPrompt.includes("database") || lowerPrompt.includes("logic")) {
                selectedModel = "deepseek/deepseek-r1-0528:free"; // Strong logic
            } else {
                selectedModel = "openai/gpt-oss-120b:free"; // Balanced planner
            }
        }

        // Construct messages array
        const messages = [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
        ]

        const chosenModel = selectedModel; // Alias for clarity

        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: apiKey,
                "HTTP-Referer": "https://prompt2web.vercel.app",
                "X-Title": "Prompt2Web",
            },
            body: JSON.stringify({
                model: chosenModel,
                messages: messages,
                temperature: 0.7,
                max_tokens: 4000,
                stream: true,
                // Add specific provider preferences if needed
                // provider: { allow_fallbacks: false } 
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
                { error: "OpenRouter API error", details: errorDetails },
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
                            // Check for standard content
                            const content = parsed.choices?.[0]?.delta?.content

                            // Check for error in the stream
                            if (parsed.error) {
                                const errorMessage = parsed.error.message || "Unknown stream error"
                                controller.enqueue(
                                    new TextEncoder().encode(
                                        `data: ${JSON.stringify({ content: `\n\n[Error: ${errorMessage}]` })}\n\n`
                                    )
                                )
                            } else if (content) {
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
        console.error("Chimera/OpenRouter Route Error:", error)
        return NextResponse.json(
            { error: "Internal server error", details: String(error) },
            { status: 500 }
        )
    }
}
