import { NextResponse } from "next/server"
import ZAI from "z-ai-web-dev-sdk"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { message, conversationHistory } = body

    if (!message) {
      return NextResponse.json({ error: "message is required" }, { status: 400 })
    }

    const zai = await ZAI.create()

    // Build conversation messages from history
    const conversationMessages: Array<{ role: "user" | "assistant"; content: string }> = []
    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory) {
        if (msg.role === "user" || msg.role === "assistant") {
          conversationMessages.push({
            role: msg.role,
            content: msg.content,
          })
        }
      }
    }

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "assistant",
          content:
            "You are a helpful AI study assistant for Mr.ADHD Study Tracker. Help students with their study questions, explain concepts, generate study notes, and provide study tips. Be concise but thorough. You can help with: explaining difficult concepts, suggesting study strategies, creating summaries, providing mnemonics, and giving motivation. Format your responses with clear structure using markdown when helpful.",
        },
        ...conversationMessages,
        { role: "user", content: message },
      ],
      thinking: { type: "disabled" },
    })

    const aiResponse = completion.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again."

    return NextResponse.json({ response: aiResponse })
  } catch (error) {
    console.error("AI Chat POST error:", error)
    return NextResponse.json({ error: "Failed to get AI response" }, { status: 500 })
  }
}
