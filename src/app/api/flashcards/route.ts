import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const subject = searchParams.get("subject")
    const isLearned = searchParams.get("isLearned")

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const where: Record<string, unknown> = { userId }
    if (subject) where.subject = subject
    if (isLearned !== null && isLearned !== undefined) {
      where.isLearned = isLearned === "true"
    }

    const flashcards = await db.flashcard.findMany({
      where,
      include: { topic: { select: { id: true, topicName: true } } },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(flashcards)
  } catch (error) {
    console.error("Flashcards GET error:", error)
    return NextResponse.json({ error: "Failed to fetch flashcards" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, topicId, subject, front, back } = body

    if (!userId || !subject || !front || !back) {
      return NextResponse.json(
        { error: "userId, subject, front, and back are required" },
        { status: 400 }
      )
    }

    const flashcard = await db.flashcard.create({
      data: {
        userId,
        topicId: topicId || null,
        subject,
        front,
        back,
      },
    })

    return NextResponse.json(flashcard, { status: 201 })
  } catch (error) {
    console.error("Flashcard POST error:", error)
    return NextResponse.json({ error: "Failed to create flashcard" }, { status: 500 })
  }
}
