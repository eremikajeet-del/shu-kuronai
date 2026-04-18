import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.studyLog.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Study log not found" }, { status: 404 })
    }

    await db.studyLog.delete({ where: { id } })

    return NextResponse.json({ message: "Study log deleted successfully" })
  } catch (error) {
    console.error("Study log DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete study log" }, { status: 500 })
  }
}
