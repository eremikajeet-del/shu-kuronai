import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// Spaced repetition intervals in days: 1, 3, 7, 14, 30, 60, 90
const REPETITION_INTERVALS = [1, 3, 7, 14, 30, 60, 90]

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const date = searchParams.get("date")
    const status = searchParams.get("status")
    const topicId = searchParams.get("topicId")

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const where: Record<string, unknown> = { userId }
    if (status) where.status = status
    if (topicId) where.topicId = topicId
    if (date) {
      const targetDate = new Date(date)
      targetDate.setUTCHours(0, 0, 0, 0)
      const nextDay = new Date(targetDate)
      nextDay.setUTCDate(nextDay.getUTCDate() + 1)
      where.revisionDate = { gte: targetDate, lt: nextDay }
    }

    const revisions = await db.revisionSchedule.findMany({
      where,
      include: { topic: true },
      orderBy: { revisionDate: "asc" },
    })

    return NextResponse.json(revisions)
  } catch (error) {
    console.error("Revisions GET error:", error)
    return NextResponse.json({ error: "Failed to fetch revisions" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, topicId, startDate } = body

    if (!userId || !topicId) {
      return NextResponse.json(
        { error: "userId and topicId are required" },
        { status: 400 }
      )
    }

    const topic = await db.topic.findUnique({ where: { id: topicId } })
    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 })
    }

    // Normalize base date to midnight UTC for consistent date-only comparisons
    const baseDate = startDate ? new Date(startDate) : new Date()
    baseDate.setUTCHours(0, 0, 0, 0)

    // Generate all revision schedules based on spaced repetition
    const revisions = []
    for (let i = 0; i < REPETITION_INTERVALS.length; i++) {
      const revisionDate = new Date(baseDate)
      revisionDate.setUTCDate(revisionDate.getUTCDate() + REPETITION_INTERVALS[i])

      const nextRevisionDate = i < REPETITION_INTERVALS.length - 1
        ? new Date(baseDate)
        : null
      if (nextRevisionDate) {
        nextRevisionDate.setUTCDate(nextRevisionDate.getUTCDate() + REPETITION_INTERVALS[i + 1])
      }

      revisions.push({
        userId,
        topicId,
        revisionDate,
        revisionNumber: i + 1,
        status: "PENDING",
        nextRevision: nextRevisionDate,
      })
    }

    const created = await db.revisionSchedule.createMany({ data: revisions })

    // Fetch the created revisions
    const createdRevisions = await db.revisionSchedule.findMany({
      where: { userId, topicId },
      include: { topic: true },
      orderBy: { revisionNumber: "asc" },
    })

    return NextResponse.json({ count: created.count, revisions: createdRevisions }, { status: 201 })
  } catch (error) {
    console.error("Revisions POST error:", error)
    return NextResponse.json({ error: "Failed to create revision schedule" }, { status: 500 })
  }
}
