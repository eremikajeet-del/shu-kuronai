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

    const notes = await db.note.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json(notes)
  } catch (error) {
    console.error("Notes GET error:", error)
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, subject, title, content, isPublic } = body

    if (!userId || !subject || !title || !content) {
      return NextResponse.json(
        { error: "userId, subject, title, and content are required" },
        { status: 400 }
      )
    }

    const note = await db.note.create({
      data: {
        userId,
        subject,
        title,
        content,
        isPublic: isPublic ?? false,
      },
    })

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error("Note POST error:", error)
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, subject, title, content, isPublic } = body

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const existing = await db.note.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    const note = await db.note.update({
      where: { id },
      data: {
        ...(subject !== undefined && { subject }),
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(isPublic !== undefined && { isPublic }),
      },
    })

    return NextResponse.json(note)
  } catch (error) {
    console.error("Note PUT error:", error)
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const existing = await db.note.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    await db.note.delete({ where: { id } })

    return NextResponse.json({ message: "Note deleted successfully" })
  } catch (error) {
    console.error("Note DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 })
  }
}
