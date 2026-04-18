import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const subject = searchParams.get("subject")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const where: Record<string, unknown> = { userId }
    if (subject) where.subject = subject

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {}
      if (startDate) dateFilter.gte = new Date(startDate)
      if (endDate) dateFilter.lte = new Date(endDate)
      where.date = dateFilter
    }

    const logs = await db.studyLog.findMany({
      where,
      orderBy: { date: "desc" },
    })

    return NextResponse.json(logs)
  } catch (error) {
    console.error("Study logs GET error:", error)
    return NextResponse.json({ error: "Failed to fetch study logs" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, subject, topic, duration, notes, date } = body

    if (!userId || !subject || !topic || !duration) {
      return NextResponse.json(
        { error: "userId, subject, topic, and duration are required" },
        { status: 400 }
      )
    }

    const log = await db.studyLog.create({
      data: {
        userId,
        subject,
        topic,
        duration,
        notes: notes || null,
        date: date ? new Date(date) : new Date(),
      },
    })

    // Update user streak and XP
    const user = await db.user.findUnique({ where: { id: userId } })
    if (user) {
      const today = new Date().toISOString().split("T")[0]
      const lastStudy = user.lastStudyDate

      let newStreak = user.streak
      if (lastStudy !== today) {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split("T")[0]

        if (lastStudy === yesterdayStr) {
          newStreak += 1
        } else {
          newStreak = 1
        }
      }

      const xpGain = Math.min(Math.floor(duration / 5), 20) // 1 XP per 5 min, max 20
      const newXP = user.xp + xpGain
      const newLevel = Math.floor(newXP / 100) + 1

      await db.user.update({
        where: { id: userId },
        data: {
          streak: newStreak,
          longestStreak: Math.max(newStreak, user.longestStreak),
          lastStudyDate: today,
          xp: newXP,
          level: newLevel,
        },
      })
    }

    return NextResponse.json(log, { status: 201 })
  } catch (error) {
    console.error("Study log POST error:", error)
    return NextResponse.json({ error: "Failed to create study log" }, { status: 500 })
  }
}
