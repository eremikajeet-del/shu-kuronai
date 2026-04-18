import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    const userId = searchParams.get("userId")

    if (!id || !userId) {
      return NextResponse.json({ error: "id and userId are required" }, { status: 400 })
    }

    // Admin only - verify user is admin
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const existing = await db.quizQuestion.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Quiz question not found" }, { status: 404 })
    }

    await db.quizQuestion.delete({ where: { id } })

    return NextResponse.json({ message: "Quiz question deleted successfully" })
  } catch (error) {
    console.error("Quiz question DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete quiz question" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const subject = searchParams.get("subject")
    const topic = searchParams.get("topic")
    const difficulty = searchParams.get("difficulty")
    const limit = searchParams.get("limit")

    const where: Record<string, unknown> = {}
    if (subject) where.subject = subject
    if (topic) where.topic = topic
    if (difficulty) where.difficulty = difficulty

    const questions = await db.quizQuestion.findMany({
      where,
      orderBy: { createdAt: "desc" },
      ...(limit ? { take: parseInt(limit) } : {}),
    })

    return NextResponse.json(questions)
  } catch (error) {
    console.error("Quiz questions GET error:", error)
    return NextResponse.json({ error: "Failed to fetch quiz questions" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { subject, topic, question, optionA, optionB, optionC, optionD, correctAnswer, explanation, difficulty, createdBy } = body

    if (!subject || !topic || !question || !optionA || !optionB || !optionC || !optionD || !correctAnswer || !createdBy) {
      return NextResponse.json(
        { error: "subject, topic, question, options A-D, correctAnswer, and createdBy are required" },
        { status: 400 }
      )
    }

    // Admin only - verify user is admin
    const user = await db.user.findUnique({ where: { id: createdBy } })
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const quizQuestion = await db.quizQuestion.create({
      data: {
        subject,
        topic,
        question,
        optionA,
        optionB,
        optionC,
        optionD,
        correctAnswer,
        explanation: explanation || null,
        difficulty: difficulty || "MEDIUM",
        createdBy,
      },
    })

    return NextResponse.json(quizQuestion, { status: 201 })
  } catch (error) {
    console.error("Quiz question POST error:", error)
    return NextResponse.json({ error: "Failed to create quiz question" }, { status: 500 })
  }
}
