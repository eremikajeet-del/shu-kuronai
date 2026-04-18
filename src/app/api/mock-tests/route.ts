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

    const mockTests = await db.mockTest.findMany({
      where,
      orderBy: { date: "desc" },
    })

    return NextResponse.json(mockTests)
  } catch (error) {
    console.error("Mock tests GET error:", error)
    return NextResponse.json({ error: "Failed to fetch mock tests" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, subject, topic, totalMarks, obtainedMarks, analysis, date } = body

    if (!userId || !subject || !topic || totalMarks === undefined || obtainedMarks === undefined) {
      return NextResponse.json(
        { error: "userId, subject, topic, totalMarks, and obtainedMarks are required" },
        { status: 400 }
      )
    }

    const mockTest = await db.mockTest.create({
      data: {
        userId,
        subject,
        topic,
        totalMarks,
        obtainedMarks,
        analysis: analysis || null,
        date: date ? new Date(date) : new Date(),
      },
    })

    return NextResponse.json(mockTest, { status: 201 })
  } catch (error) {
    console.error("Mock test POST error:", error)
    return NextResponse.json({ error: "Failed to create mock test" }, { status: 500 })
  }
}
