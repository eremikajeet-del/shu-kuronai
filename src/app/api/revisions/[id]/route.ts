import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { difficulty } = body

    if (!difficulty || !["EASY", "MEDIUM", "HARD"].includes(difficulty)) {
      return NextResponse.json(
        { error: "difficulty is required and must be EASY, MEDIUM, or HARD" },
        { status: 400 }
      )
    }

    const revision = await db.revisionSchedule.findUnique({
      where: { id },
      include: { topic: true },
    })

    if (!revision) {
      return NextResponse.json({ error: "Revision not found" }, { status: 404 })
    }

    if (revision.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Revision already completed" },
        { status: 400 }
      )
    }

    // Mark current revision as completed
    const updated = await db.revisionSchedule.update({
      where: { id },
      data: {
        status: "COMPLETED",
        difficulty,
        completedAt: new Date(),
      },
    })

    // Find the next pending revision for this topic
    const nextRevision = await db.revisionSchedule.findFirst({
      where: {
        topicId: revision.topicId,
        userId: revision.userId,
        status: "PENDING",
        revisionNumber: { gt: revision.revisionNumber },
      },
      orderBy: { revisionNumber: "asc" },
    })

    if (nextRevision) {
      const currentDate = new Date(nextRevision.revisionDate)

      if (difficulty === "MEDIUM") {
        // Move next revision 1 day sooner
        currentDate.setDate(currentDate.getDate() - 1)
        await db.revisionSchedule.update({
          where: { id: nextRevision.id },
          data: { revisionDate: currentDate },
        })
      } else if (difficulty === "HARD") {
        // Move next revision 2 days sooner
        currentDate.setDate(currentDate.getDate() - 2)
        await db.revisionSchedule.update({
          where: { id: nextRevision.id },
          data: { revisionDate: currentDate },
        })

        // Add an extra revision in 2 days from now
        const extraDate = new Date()
        extraDate.setDate(extraDate.getDate() + 2)

        // Calculate the revision number for the extra revision
        const maxRevision = await db.revisionSchedule.findFirst({
          where: { topicId: revision.topicId, userId: revision.userId },
          orderBy: { revisionNumber: "desc" },
          select: { revisionNumber: true },
        })

        await db.revisionSchedule.create({
          data: {
            userId: revision.userId,
            topicId: revision.topicId,
            revisionDate: extraDate,
            revisionNumber: (maxRevision?.revisionNumber ?? revision.revisionNumber) + 1,
            status: "PENDING",
            nextRevision: null,
          },
        })
      }
      // EASY: no adjustment needed
    }

    // Update user streak and XP
    const user = await db.user.findUnique({ where: { id: revision.userId } })
    if (user) {
      const today = new Date().toISOString().split("T")[0]
      const lastStudy = user.lastStudyDate

      let newStreak = user.streak
      if (lastStudy !== today) {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split("T")[0]

        if (lastStudy === yesterdayStr) {
          newStreak += 1
        } else {
          newStreak = 1
        }
      }

      const xpGain = difficulty === "EASY" ? 5 : difficulty === "MEDIUM" ? 8 : 10
      const newXP = user.xp + xpGain
      const newLevel = Math.floor(newXP / 100) + 1

      await db.user.update({
        where: { id: revision.userId },
        data: {
          streak: newStreak,
          longestStreak: Math.max(newStreak, user.longestStreak),
          lastStudyDate: today,
          xp: newXP,
          level: newLevel,
        },
      })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Revision PUT error:", error)
    return NextResponse.json({ error: "Failed to update revision" }, { status: 500 })
  }
}
