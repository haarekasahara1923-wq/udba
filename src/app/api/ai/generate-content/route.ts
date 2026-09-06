import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/api/middleware'

async function fetchFromGroq(systemContent: string, userContent: string) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "system", content: systemContent }, { role: "user", content: userContent }]
        })
    })
    if (!res.ok) throw new Error("Groq API error")
    return await res.json()
}

async function fetchFromOpenAI(systemContent: string, userContent: string) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "system", content: systemContent }, { role: "user", content: userContent }]
        })
    })
    if (!res.ok) throw new Error("OpenAI API error")
    return await res.json()
}

export async function POST(req: NextRequest) {
    const { error, user } = requireAuth(req)
    if (error) return error

    // AI Generator is explicitly available for all plans including BASIC

    try {
        const body = await req.json()
        const { prompt, contentType } = body

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
        }

        const systemContent = `You are an expert AI Assistant for a coaching center. 
Your task is to generate high-quality educational content based on the user's request. 
The requested content type is: ${contentType}. 
You MUST format your ONLY response in pure, clean HTML code, ready to be rendered in a webpage without ANY markdown syntax or \`\`\`html wrapping.
Use proper HTML tags: <h1>, <h2>, <h3>, <p>, <ul>, <ol>, <li>, <table>, <tr>, <th>, <td>, <strong>, <em>, <br/>.
For Question Papers or any list-based items, group them nicely. For tabular data, always use standard HTML <table> structure.
DO NOT include <head>, <body>, or <html> tags. Just the internal HTML structure. Make the design aesthetically pleasing using inline CSS where extremely helpful, but mostly stick to semantic HTML.
Important: Never include \\\`\\\`\\\`html at the start or end of your response.`

        const userContent = prompt

        let data;
        let provider = 'Groq';
        try {
            data = await fetchFromGroq(systemContent, userContent)
        } catch (err) {
            console.error('Groq generation failed, falling back to OpenAI:', err)
            provider = 'OpenAI';
            data = await fetchFromOpenAI(systemContent, userContent)
        }

        let rawContent = data.choices[0].message.content

        // Remove markdown formatting if AI still decided to include it
        rawContent = rawContent.replace(/\`\`\`html/gi, "").replace(/\`\`\`/g, "").trim();

        return NextResponse.json({
            success: true,
            data: rawContent,
            provider: provider
        })
    } catch (error) {
        console.error('AI content generation error:', error)
        return NextResponse.json({ error: 'Failed to generate content. Please check AI service limits or try again.' }, { status: 500 })
    }
}
