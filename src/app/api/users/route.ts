import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const requesterId = searchParams.get("userId")
    const statusFilter = searchParams.get("status")

    if (!requesterId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    // Admin only
    const requester = await db.user.findUnique({ where: { id: requesterId } })
    if (!requester || requester.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const where = statusFilter && statusFilter !== "ALL" ? { status: statusFilter } : {}

    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        status: true,
        avatar: true,
        xp: true,
        level: true,
        streak: true,
        longestStreak: true,
        lastStudyDate: true,
        autoApprove: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            topics: true,
            studyLogs: true,
            flashcards: true,
            quizResults: true,
            revisions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Get counts by status
    const statusCounts = {
      PENDING: await db.user.count({ where: { status: "PENDING", role: "STUDENT" } }),
      APPROVED: await db.user.count({ where: { status: "APPROVED", role: "STUDENT" } }),
      REJECTED: await db.user.count({ where: { status: "REJECTED", role: "STUDENT" } }),
      total: await db.user.count({ where: { role: "STUDENT" } }),
    }

    return NextResponse.json({ users, statusCounts })
  } catch (error) {
    console.error("Users GET error:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { requesterId, targetId, action } = body

    if (!requesterId || !targetId || !action) {
      return NextResponse.json({ error: "requesterId, targetId, and action are required" }, { status: 400 })
    }

    // Admin only
    const requester = await db.user.findUnique({ where: { id: requesterId } })
    if (!requester || requester.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const target = await db.user.findUnique({ where: { id: targetId } })
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Handle different actions
    switch (action) {
      case "APPROVE":
        await db.user.update({ where: { id: targetId }, data: { status: "APPROVED" } })
        return NextResponse.json({ message: "User approved successfully" })

      case "REJECT":
        await db.user.update({ where: { id: targetId }, data: { status: "REJECTED" } })
        return NextResponse.json({ message: "User rejected" })

      case "TOGGLE_AUTO_APPROVE":
        // Toggle auto-approve setting for the admin
        const updated = await db.user.update({
          where: { id: requesterId },
          data: { autoApprove: !requester.autoApprove },
        })
        return NextResponse.json({
          message: updated.autoApprove ? "Auto-approve enabled" : "Auto-approve disabled",
          autoApprove: updated.autoApprove,
        })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("User PUT error:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const requesterId = searchParams.get("userId")
    const targetId = searchParams.get("targetId")

    if (!requesterId || !targetId) {
      return NextResponse.json({ error: "userId and targetId are required" }, { status: 400 })
    }

    // Admin only
    const requester = await db.user.findUnique({ where: { id: requesterId } })
    if (!requester || requester.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const target = await db.user.findUnique({ where: { id: targetId } })
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Prevent self-deletion
    if (requesterId === targetId) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
    }

    await db.user.delete({ where: { id: targetId } })

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("User DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
