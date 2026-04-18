import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const type = searchParams.get("type")
    const isCompleted = searchParams.get("isCompleted")

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const where: Record<string, unknown> = { userId }
    if (type) where.type = type
    if (isCompleted !== null && isCompleted !== undefined) {
      where.isCompleted = isCompleted === "true"
    }

    const goals = await db.goal.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(goals)
  } catch (error) {
    console.error("Goals GET error:", error)
    return NextResponse.json({ error: "Failed to fetch goals" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, title, description, type, target, deadline } = body

    if (!userId || !title || !type || !target) {
      return NextResponse.json(
        { error: "userId, title, type, and target are required" },
        { status: 400 }
      )
    }

    const goal = await db.goal.create({
      data: {
        userId,
        title,
        description: description || null,
        type,
        target,
        deadline: deadline ? new Date(deadline) : null,
      },
    })

    return NextResponse.json(goal, { status: 201 })
  } catch (error) {
    console.error("Goal POST error:", error)
    return NextResponse.json({ error: "Failed to create goal" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, current, isCompleted, title, description, target, deadline } = body

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const existing = await db.goal.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 })
    }

    const goal = await db.goal.update({
      where: { id },
      data: {
        ...(current !== undefined && { current }),
        ...(isCompleted !== undefined && { isCompleted }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(target !== undefined && { target }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
      },
    })

    // Award XP on goal completion
    if (isCompleted && !existing.isCompleted) {
      const xpGain = 25
      const user = await db.user.findUnique({ where: { id: existing.userId } })
      if (user) {
        const newXP = user.xp + xpGain
        const newLevel = Math.floor(newXP / 100) + 1
        await db.user.update({
          where: { id: existing.userId },
          data: { xp: newXP, level: newLevel },
        })
      }
    }

    return NextResponse.json(goal)
  } catch (error) {
    console.error("Goal PUT error:", error)
    return NextResponse.json({ error: "Failed to update goal" }, { status: 500 })
  }
}
