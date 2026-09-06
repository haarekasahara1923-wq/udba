import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireFeature, checkPlanLimit } from '@/app/api/middleware'

async function fetchFromGroq(systemContent: string, userContent: string) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "system", content: systemContent }, { role: "user", content: userContent }],
            response_format: { type: "json_object" }
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
            messages: [{ role: "system", content: systemContent }, { role: "user", content: userContent }],
            response_format: { type: "json_object" }
        })
    })
    if (!res.ok) throw new Error("OpenAI API error")
    return await res.json()
}

export async function POST(req: NextRequest) {
    const { error, user } = requireAuth(req)
    if (error) return error

    // Feature gate check: User needs Pro/Elite plan for AI tools
    const featureCheck = await requireFeature(req, 'aiTools')
    if (featureCheck.error) return featureCheck.error

    try {
        const body = await req.json()
        const { subject, topic, count = 5, difficulty = 'MEDIUM', type = 'MCQ' } = body

        if (!subject) {
            return NextResponse.json({ error: 'Subject is required' }, { status: 400 })
        }

        const systemContent = `You are an expert ${subject} teacher creating exams. You must output a JSON object containing a property 'questions' which is an array of ${count} objects. Each object must precisely match this format: { "subject": "${subject}", "topic": "${topic || subject}", "questionText": "Question here", "type": "${type}", "options": ["Option A", "Option B", "Option C", "Option D"], "correctAnswer": "Exact matching string from options array", "marks": ${difficulty === 'HARD' ? 4 : difficulty === 'EASY' ? 1 : 2}, "difficulty": "${difficulty}", "explanation": "Explanation for the answer" }. For DESCRIPTIVE type, you can leave options array empty and correctAnswer empty.`

        const userContent = `Generate ${count} ${difficulty} level ${type} questions for the subject ${subject} on the topic of ${topic || 'general awareness'}. Ensure the JSON output provides the exact structure requested.`

        let data;
        let provider = 'Groq';
        try {
            data = await fetchFromGroq(systemContent, userContent)
        } catch (err) {
            console.error('Groq generation failed, falling back to OpenAI:', err)
            provider = 'OpenAI';
            data = await fetchFromOpenAI(systemContent, userContent)
        }

        const rawContent = data.choices[0].message.content
        const parsedData = JSON.parse(rawContent)

        // Handle variations in AI output shapes
        const questions = parsedData.questions || parsedData.data || parsedData

        return NextResponse.json({
            success: true,
            data: Array.isArray(questions) ? questions : [parsedData],
            provider: provider,
            message: `Generated ${Array.isArray(questions) ? questions.length : 1} ${type} questions for ${subject} using ${provider}`,
        })
    } catch (error) {
        console.error('AI question generation error:', error)
        return NextResponse.json({ error: 'Failed to generate questions. Please check AI service limits or try again.' }, { status: 500 })
    }
}

