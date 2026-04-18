import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { front, back, subject, isLearned } = body

    const existing = await db.flashcard.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Flashcard not found" }, { status: 404 })
    }

    const flashcard = await db.flashcard.update({
      where: { id },
      data: {
        ...(front !== undefined && { front }),
        ...(back !== undefined && { back }),
        ...(subject !== undefined && { subject }),
        ...(isLearned !== undefined && { isLearned }),
      },
    })

    return NextResponse.json(flashcard)
  } catch (error) {
    console.error("Flashcard PUT error:", error)
    return NextResponse.json({ error: "Failed to update flashcard" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.flashcard.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Flashcard not found" }, { status: 404 })
    }

    await db.flashcard.delete({ where: { id } })
    return NextResponse.json({ message: "Flashcard deleted successfully" })
  } catch (error) {
    console.error("Flashcard DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete flashcard" }, { status: 500 })
  }
}
