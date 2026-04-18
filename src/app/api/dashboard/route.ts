import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Total topics
    const totalTopics = await db.topic.count({ where: { userId } })

    // Completed revisions
    const completedRevisions = await db.revisionSchedule.count({
      where: { userId, status: "COMPLETED" },
    })

    // Total revisions
    const totalRevisions = await db.revisionSchedule.count({ where: { userId } })

    // Pending revisions today (timezone-safe: use start of day UTC)
    const todayStart = new Date()
    todayStart.setUTCHours(0, 0, 0, 0)
    const tomorrowStart = new Date(todayStart)
    tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1)

    const pendingToday = await db.revisionSchedule.count({
      where: {
        userId,
        status: "PENDING",
        revisionDate: { gte: todayStart, lt: tomorrowStart },
      },
    })

    // Overdue revisions (before start of today UTC)
    const overdue = await db.revisionSchedule.count({
      where: {
        userId,
        status: "PENDING",
        revisionDate: { lt: todayStart },
      },
    })

    // Efficiency score
    const efficiencyScore = totalRevisions > 0
      ? Math.round((completedRevisions / totalRevisions) * 100)
      : 0

    // Subject mastery breakdown
    const topics = await db.topic.findMany({ where: { userId } })
    const subjectMap = new Map<string, { total: number; totalMastery: number; topics: string[] }>()
    for (const topic of topics) {
      const existing = subjectMap.get(topic.subject) || { total: 0, totalMastery: 0, topics: [] }
      existing.total += 1
      existing.totalMastery += topic.mastery
      existing.topics.push(topic.topicName)
      subjectMap.set(topic.subject, existing)
    }
    const subjectMastery = Array.from(subjectMap.entries()).map(([subject, data]) => ({
      subject,
      averageMastery: Math.round(data.totalMastery / data.total),
      topicCount: data.total,
      topics: data.topics,
    }))

    // Activity heatmap data (last 90 days)
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const studyLogs = await db.studyLog.findMany({
      where: { userId, date: { gte: ninetyDaysAgo } },
      select: { date: true, duration: true },
    })

    const heatmapData: Record<string, { date: string; duration: number; count: number }> = {}
    for (const log of studyLogs) {
      const dateKey = new Date(log.date).toISOString().split("T")[0]
      if (!heatmapData[dateKey]) {
        heatmapData[dateKey] = { date: dateKey, duration: 0, count: 0 }
      }
      heatmapData[dateKey].duration += log.duration
      heatmapData[dateKey].count += 1
    }

    // Include revision activity in heatmap
    const completedRevisionsList = await db.revisionSchedule.findMany({
      where: { userId, status: "COMPLETED", completedAt: { gte: ninetyDaysAgo } },
      select: { completedAt: true },
    })

    for (const rev of completedRevisionsList) {
      if (rev.completedAt) {
        const dateKey = new Date(rev.completedAt).toISOString().split("T")[0]
        if (!heatmapData[dateKey]) {
          heatmapData[dateKey] = { date: dateKey, duration: 0, count: 0 }
        }
        heatmapData[dateKey].count += 1
      }
    }

    const activityHeatmap = Object.values(heatmapData).sort((a, b) => a.date.localeCompare(b.date))

    // Upcoming exams (topics with examDate in the future)
    const upcomingExams = await db.topic.findMany({
      where: {
        userId,
        examDate: { gte: new Date() },
        status: "ACTIVE",
      },
      orderBy: { examDate: "asc" },
      take: 5,
    })

    // Smart recommendations
    const recommendations: string[] = []

    // Weak areas (topics with mastery < 40)
    const weakTopics = topics.filter(t => t.mastery < 40)
    if (weakTopics.length > 0) {
      recommendations.push(
        `Focus on weak topics: ${weakTopics.slice(0, 3).map(t => t.topicName).join(", ")}`
      )
    }

    // Missed revisions
    if (overdue > 0) {
      recommendations.push(`You have ${overdue} overdue revision${overdue > 1 ? "s" : ""}. Complete them to maintain your streak!`)
    }

    // Unresolved mistakes
    const unresolvedMistakes = await db.mistake.count({
      where: { userId, isResolved: false },
    })
    if (unresolvedMistakes > 0) {
      recommendations.push(`Review ${unresolvedMistakes} unresolved mistake${unresolvedMistakes > 1 ? "s" : ""} to avoid repeating them.`)
    }

    // Active goals approaching deadline
    const approachingGoals = await db.goal.findMany({
      where: {
        userId,
        isCompleted: false,
        deadline: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      },
    })
    if (approachingGoals.length > 0) {
      recommendations.push(`${approachingGoals.length} goal${approachingGoals.length > 1 ? "s" : ""} approaching deadline. Stay on track!`)
    }

    // Streak encouragement
    if (user.streak === 0) {
      recommendations.push("Start your study streak today! Even 10 minutes counts.")
    } else if (user.streak < 3) {
      recommendations.push(`You're on a ${user.streak}-day streak! Keep it going!`)
    }

    // Recent study stats
    const thisWeekStart = new Date()
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay())
    const weekLogs = await db.studyLog.findMany({
      where: { userId, date: { gte: thisWeekStart } },
    })
    const totalWeekMinutes = weekLogs.reduce((sum, log) => sum + log.duration, 0)

    // Flashcard stats
    const totalFlashcards = await db.flashcard.count({ where: { userId } })
    const learnedFlashcards = await db.flashcard.count({ where: { userId, isLearned: true } })

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        longestStreak: user.longestStreak,
      },
      stats: {
        totalTopics,
        completedRevisions,
        totalRevisions,
        pendingToday,
        overdue,
        efficiencyScore,
        totalWeekMinutes,
        totalFlashcards,
        learnedFlashcards,
      },
      subjectMastery,
      activityHeatmap,
      upcomingExams: upcomingExams.map(t => ({
        id: t.id,
        topicName: t.topicName,
        subject: t.subject,
        examDate: t.examDate,
        mastery: t.mastery,
      })),
      recommendations,
    })
  } catch (error) {
    console.error("Dashboard GET error:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 })
  }
}
