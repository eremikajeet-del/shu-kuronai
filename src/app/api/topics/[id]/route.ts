import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const topic = await db.topic.findUnique({
      where: { id },
      include: {
        revisions: { orderBy: { revisionDate: "asc" } },
        flashcards: true,
        quizResults: true,
        user: { select: { id: true, name: true, username: true } },
      },
    })

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 })
    }

    return NextResponse.json(topic)
  } catch (error) {
    console.error("Topic GET error:", error)
    return NextResponse.json({ error: "Failed to fetch topic" }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { subject, topicName, description, status, mastery, examDate } = body

    const existing = await db.topic.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 })
    }

    const topic = await db.topic.update({
      where: { id },
      data: {
        ...(subject !== undefined && { subject }),
        ...(topicName !== undefined && { topicName }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(mastery !== undefined && { mastery }),
        ...(examDate !== undefined && { examDate: examDate ? new Date(examDate) : null }),
      },
    })

    return NextResponse.json(topic)
  } catch (error) {
    console.error("Topic PUT error:", error)
    return NextResponse.json({ error: "Failed to update topic" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.topic.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 })
    }

    await db.topic.delete({ where: { id } })

    return NextResponse.json({ message: "Topic deleted successfully" })
  } catch (error) {
    console.error("Topic DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete topic" }, { status: 500 })
  }
}
