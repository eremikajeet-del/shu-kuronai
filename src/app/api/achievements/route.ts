import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    // Get all achievements
    const achievements = await db.achievement.findMany({
      orderBy: { xpReward: "asc" },
    })

    // If userId provided, include user's earned status
    if (userId) {
      const userAchievements = await db.userAchievement.findMany({
        where: { userId },
      })

      const earnedMap = new Map(userAchievements.map(ua => [ua.achievementId, ua]))

      const result = achievements.map(a => ({
        ...a,
        earned: earnedMap.has(a.id),
        earnedAt: earnedMap.get(a.id)?.earnedAt || null,
      }))

      return NextResponse.json({
        achievements: result,
        totalEarned: userAchievements.length,
        totalXpEarned: userAchievements.reduce((sum, ua) => {
          const ach = achievements.find(a => a.id === ua.achievementId)
          return sum + (ach?.xpReward || 0)
        }, 0),
      })
    }

    return NextResponse.json({ achievements, totalEarned: 0, totalXpEarned: 0 })
  } catch (error) {
    console.error("Achievements GET error:", error)
    return NextResponse.json({ error: "Failed to fetch achievements" }, { status: 500 })
  }
}
