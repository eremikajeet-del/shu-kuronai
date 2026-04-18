import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const admin = searchParams.get("admin")

    // Admin can fetch all files
    if (admin === "true") {
      const requesterId = searchParams.get("requesterId")
      if (!requesterId) {
        return NextResponse.json({ error: "requesterId is required for admin access" }, { status: 400 })
      }
      const requester = await db.user.findUnique({ where: { id: requesterId } })
      if (!requester || requester.role !== "ADMIN") {
        return NextResponse.json({ error: "Admin access required" }, { status: 403 })
      }

      const files = await db.file.findMany({
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, username: true, email: true } } },
      })
      return NextResponse.json(files)
    }

    // Regular user - own files only
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const files = await db.file.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(files)
  } catch (error) {
    console.error("Files GET error:", error)
    return NextResponse.json({ error: "Failed to fetch files" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const userId = formData.get("userId") as string
    const name = formData.get("name") as string
    const subject = formData.get("subject") as string | null
    const file = formData.get("file") as File | null

    if (!userId || !name) {
      return NextResponse.json({ error: "userId and name are required" }, { status: 400 })
    }

    let url = ""
    let type = ""
    let size = 0

    if (file) {
      type = file.type || "application/octet-stream"
      size = file.size
      // In a real app, you'd upload to S3 or similar.
      // For this demo, we store a placeholder URL.
      const buffer = Buffer.from(await file.arrayBuffer())
      url = `data:${type};base64,${buffer.toString("base64")}`
    }

    const fileRecord = await db.file.create({
      data: {
        userId,
        name,
        url,
        type: type || "unknown",
        subject: subject || null,
        size,
      },
    })

    return NextResponse.json(fileRecord, { status: 201 })
  } catch (error) {
    console.error("File POST error:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
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

    const existing = await db.file.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Admin or owner can delete
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user || (user.role !== "ADMIN" && existing.userId !== userId)) {
      return NextResponse.json({ error: "Not authorized to delete this file" }, { status: 403 })
    }

    await db.file.delete({ where: { id } })

    return NextResponse.json({ message: "File deleted successfully" })
  } catch (error) {
    console.error("File DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 })
  }
}
