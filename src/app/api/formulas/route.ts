import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const subject = searchParams.get("subject")
    const category = searchParams.get("category")
    const isLearned = searchParams.get("isLearned")

    const where: Record<string, unknown> = {}
    if (subject) where.subject = subject
    if (category) where.category = category
    if (isLearned !== null && isLearned !== undefined) {
      where.isLearned = isLearned === "true"
    }

    const formulas = await db.formula.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(formulas)
  } catch (error) {
    console.error("Formulas GET error:", error)
    return NextResponse.json({ error: "Failed to fetch formulas" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { subject, title, content, category, createdBy } = body

    if (!subject || !title || !content || !createdBy) {
      return NextResponse.json(
        { error: "subject, title, content, and createdBy are required" },
        { status: 400 }
      )
    }

    // Admin only - verify user is admin
    const user = await db.user.findUnique({ where: { id: createdBy } })
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const formula = await db.formula.create({
      data: {
        subject,
        title,
        content,
        category: category || null,
        createdBy,
      },
    })

    return NextResponse.json(formula, { status: 201 })
  } catch (error) {
    console.error("Formula POST error:", error)
    return NextResponse.json({ error: "Failed to create formula" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, isLearned, title, content, category } = body

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const existing = await db.formula.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Formula not found" }, { status: 404 })
    }

    const formula = await db.formula.update({
      where: { id },
      data: {
        ...(isLearned !== undefined && { isLearned }),
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(category !== undefined && { category }),
      },
    })

    return NextResponse.json(formula)
  } catch (error) {
    console.error("Formula PUT error:", error)
    return NextResponse.json({ error: "Failed to update formula" }, { status: 500 })
  }
}

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

    const existing = await db.formula.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Formula not found" }, { status: 404 })
    }

    await db.formula.delete({ where: { id } })

    return NextResponse.json({ message: "Formula deleted successfully" })
  } catch (error) {
    console.error("Formula DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete formula" }, { status: 500 })
  }
}
