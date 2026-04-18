import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    // Subject performance (accuracy per subject from quiz results)
    const quizResults = await db.quizResult.findMany({ where: { userId } })
    const subjectPerformanceMap = new Map<string, { totalQuestions: number; correctAnswers: number; count: number }>()

    for (const result of quizResults) {
      const existing = subjectPerformanceMap.get(result.subject) || { totalQuestions: 0, correctAnswers: 0, count: 0 }
      existing.totalQuestions += result.totalQuestions
      existing.correctAnswers += result.correctAnswers
      existing.count += 1
      subjectPerformanceMap.set(result.subject, existing)
    }

    const subjectPerformance = Array.from(subjectPerformanceMap.entries()).map(([subject, data]) => ({
      subject,
      accuracy: data.totalQuestions > 0 ? Math.round((data.correctAnswers / data.totalQuestions) * 100) : 0,
      totalQuestions: data.totalQuestions,
      correctAnswers: data.correctAnswers,
      quizCount: data.count,
    }))

    // Accuracy trends (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentQuizResults = await db.quizResult.findMany({
      where: { userId, createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: "asc" },
    })

    const accuracyTrends: { date: string; accuracy: number; score: number }[] = []
    const trendMap = new Map<string, { totalQ: number; correctQ: number; totalScore: number; count: number }>()

    for (const result of recentQuizResults) {
      const dateKey = new Date(result.createdAt).toISOString().split("T")[0]
      const existing = trendMap.get(dateKey) || { totalQ: 0, correctQ: 0, totalScore: 0, count: 0 }
      existing.totalQ += result.totalQuestions
      existing.correctQ += result.correctAnswers
      existing.totalScore += result.score
      existing.count += 1
      trendMap.set(dateKey, existing)
    }

    for (const [date, data] of trendMap.entries()) {
      accuracyTrends.push({
        date,
        accuracy: data.totalQ > 0 ? Math.round((data.correctQ / data.totalQ) * 100) : 0,
        score: Math.round(data.totalScore / data.count),
      })
    }

    accuracyTrends.sort((a, b) => a.date.localeCompare(b.date))

    // Study hours by subject
    const studyLogs = await db.studyLog.findMany({ where: { userId } })
    const studyHoursMap = new Map<string, number>()

    for (const log of studyLogs) {
      const current = studyHoursMap.get(log.subject) || 0
      studyHoursMap.set(log.subject, current + log.duration)
    }

    const studyHoursBySubject = Array.from(studyHoursMap.entries()).map(([subject, minutes]) => ({
      subject,
      totalMinutes: minutes,
      totalHours: Math.round((minutes / 60) * 10) / 10,
    }))

    // Weak areas (topics with low mastery + high mistake count)
    const topics = await db.topic.findMany({ where: { userId } })
    const mistakes = await db.mistake.findMany({ where: { userId, isResolved: false } })

    const mistakeCountMap = new Map<string, number>()
    for (const mistake of mistakes) {
      const key = `${mistake.subject}:${mistake.topic}`
      mistakeCountMap.set(key, (mistakeCountMap.get(key) || 0) + 1)
    }

    const weakAreas = topics
      .filter(t => t.mastery < 60)
      .map(t => {
        const key = `${t.subject}:${t.topicName}`
        const mistakeCount = mistakeCountMap.get(key) || 0
        return {
          topicId: t.id,
          topicName: t.topicName,
          subject: t.subject,
          mastery: t.mastery,
          mistakeCount,
          priority: (100 - t.mastery) + (mistakeCount * 10),
        }
      })
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 10)

    // Mock test performance over time
    const mockTests = await db.mockTest.findMany({
      where: { userId },
      orderBy: { date: "asc" },
    })

    const mockTestTrends = mockTests.map(mt => ({
      date: new Date(mt.date).toISOString().split("T")[0],
      subject: mt.subject,
      topic: mt.topic,
      percentage: mt.totalMarks > 0 ? Math.round((mt.obtainedMarks / mt.totalMarks) * 100) : 0,
    }))

    // Overall summary
    const totalStudyMinutes = studyLogs.reduce((sum, log) => sum + log.duration, 0)
    const totalQuizAttempts = quizResults.length
    const avgAccuracy = quizResults.length > 0
      ? Math.round(quizResults.reduce((sum, r) => sum + (r.correctAnswers / r.totalQuestions) * 100, 0) / quizResults.length)
      : 0

    return NextResponse.json({
      subjectPerformance,
      accuracyTrends,
      studyHoursBySubject,
      weakAreas,
      mockTestTrends,
      summary: {
        totalStudyHours: Math.round((totalStudyMinutes / 60) * 10) / 10,
        totalQuizAttempts,
        avgAccuracy,
        totalTopics: topics.length,
        totalMistakes: mistakes.length,
      },
    })
  } catch (error) {
    console.error("Analytics GET error:", error)
    return NextResponse.json({ error: "Failed to fetch analytics data" }, { status: 500 })
  }
}
