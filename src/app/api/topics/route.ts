import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const subject = searchParams.get("subject")
    const status = searchParams.get("status")

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const where: Record<string, unknown> = { userId }
    if (subject) where.subject = subject
    if (status) where.status = status

    const topics = await db.topic.findMany({
      where,
      include: {
        revisions: { orderBy: { revisionDate: "asc" } },
        _count: { select: { flashcards: true, quizResults: true } },
      },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json(topics)
  } catch (error) {
    console.error("Topics GET error:", error)
    return NextResponse.json({ error: "Failed to fetch topics" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, subject, topicName, description, examDate } = body

    if (!userId || !subject || !topicName) {
      return NextResponse.json(
        { error: "userId, subject, and topicName are required" },
        { status: 400 }
      )
    }

    const topic = await db.topic.create({
      data: {
        userId,
        subject,
        topicName,
        description: description || null,
        examDate: examDate ? new Date(examDate) : null,
      },
    })

    return NextResponse.json(topic, { status: 201 })
  } catch (error) {
    console.error("Topics POST error:", error)
    return NextResponse.json({ error: "Failed to create topic" }, { status: 500 })
  }
}
