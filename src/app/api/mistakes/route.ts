import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const mistakeType = searchParams.get("mistakeType")
    const isResolved = searchParams.get("isResolved")

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const where: Record<string, unknown> = { userId }
    if (mistakeType) where.mistakeType = mistakeType
    if (isResolved !== null && isResolved !== undefined) {
      where.isResolved = isResolved === "true"
    }

    const mistakes = await db.mistake.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(mistakes)
  } catch (error) {
    console.error("Mistakes GET error:", error)
    return NextResponse.json({ error: "Failed to fetch mistakes" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, subject, topic, description, mistakeType, correction } = body

    if (!userId || !subject || !topic || !description || !mistakeType) {
      return NextResponse.json(
        { error: "userId, subject, topic, description, and mistakeType are required" },
        { status: 400 }
      )
    }

    const mistake = await db.mistake.create({
      data: {
        userId,
        subject,
        topic,
        description,
        mistakeType,
        correction: correction || null,
      },
    })

    return NextResponse.json(mistake, { status: 201 })
  } catch (error) {
    console.error("Mistake POST error:", error)
    return NextResponse.json({ error: "Failed to create mistake" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, description, correction, isResolved, mistakeType } = body

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const existing = await db.mistake.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Mistake not found" }, { status: 404 })
    }

    const mistake = await db.mistake.update({
      where: { id },
      data: {
        ...(description !== undefined && { description }),
        ...(correction !== undefined && { correction }),
        ...(isResolved !== undefined && { isResolved }),
        ...(mistakeType !== undefined && { mistakeType }),
      },
    })

    return NextResponse.json(mistake)
  } catch (error) {
    console.error("Mistake PUT error:", error)
    return NextResponse.json({ error: "Failed to update mistake" }, { status: 500 })
  }
}
