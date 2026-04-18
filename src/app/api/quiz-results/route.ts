import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const subject = searchParams.get("subject")

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const where: Record<string, unknown> = { userId }
    if (subject) where.subject = subject

    const results = await db.quizResult.findMany({
      where,
      include: { topic: { select: { id: true, topicName: true } } },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(results)
  } catch (error) {
    console.error("Quiz results GET error:", error)
    return NextResponse.json({ error: "Failed to fetch quiz results" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, topicId, subject, totalQuestions, correctAnswers, score, timeTaken } = body

    if (!userId || !subject || totalQuestions === undefined || correctAnswers === undefined || score === undefined) {
      return NextResponse.json(
        { error: "userId, subject, totalQuestions, correctAnswers, and score are required" },
        { status: 400 }
      )
    }

    const result = await db.quizResult.create({
      data: {
        userId,
        topicId: topicId || null,
        subject,
        totalQuestions,
        correctAnswers,
        score,
        timeTaken: timeTaken || null,
      },
    })

    // Award XP based on score
    const xpGain = Math.floor(score / 10) // 1 XP per 10% score
    const user = await db.user.findUnique({ where: { id: userId } })
    if (user) {
      const newXP = user.xp + xpGain
      const newLevel = Math.floor(newXP / 100) + 1
      await db.user.update({
        where: { id: userId },
        data: { xp: newXP, level: newLevel },
      })
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("Quiz result POST error:", error)
    return NextResponse.json({ error: "Failed to create quiz result" }, { status: 500 })
  }
}
