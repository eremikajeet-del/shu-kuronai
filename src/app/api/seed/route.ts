import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { db } from "@/lib/db"

export async function POST() {
  try {
    const existingAdmin = await db.user.findUnique({
      where: { email: "eremikajeet@gmail.com" },
    })

    if (existingAdmin) {
      return NextResponse.json({ message: "Admin already exists" }, { status: 200 })
    }

    const hashedPassword = await hash("Mr.Robot", 12)

    const admin = await db.user.create({
      data: {
        email: "eremikajeet@gmail.com",
        username: "Mr.ADHD",
        password: hashedPassword,
        name: "Mr.ADHD",
        role: "ADMIN",
        status: "APPROVED",
        xp: 0,
        level: 1,
        streak: 0,
      },
    })

    // Seed achievements
    const achievements = [
      { name: "First Step", description: "Complete your first study session", icon: "🎯", xpReward: 10, condition: "study_count_1" },
      { name: "Streak Starter", description: "Maintain a 3-day streak", icon: "🔥", xpReward: 25, condition: "streak_3" },
      { name: "Week Warrior", description: "Maintain a 7-day streak", icon: "⚔️", xpReward: 50, condition: "streak_7" },
      { name: "Month Master", description: "Maintain a 30-day streak", icon: "👑", xpReward: 200, condition: "streak_30" },
      { name: "Quiz Ace", description: "Score 100% on a quiz", icon: "💯", xpReward: 30, condition: "quiz_perfect" },
      { name: "Knowledge Seeker", description: "Create 50 flashcards", icon: "📚", xpReward: 40, condition: "flashcards_50" },
      { name: "Revision Pro", description: "Complete 100 revisions", icon: "🔄", xpReward: 75, condition: "revisions_100" },
      { name: "Focus Master", description: "Complete 10 Pomodoro sessions", icon: "⏰", xpReward: 35, condition: "pomodoro_10" },
      { name: "Goal Getter", description: "Complete 5 goals", icon: "🏆", xpReward: 50, condition: "goals_5" },
      { name: "Scholar", description: "Reach Level 10", icon: "🎓", xpReward: 100, condition: "level_10" },
    ]

    for (const achievement of achievements) {
      await db.achievement.upsert({
        where: { id: achievement.condition },
        update: achievement,
        create: { id: achievement.condition, ...achievement },
      })
    }

    return NextResponse.json({ message: "Admin created successfully", userId: admin.id }, { status: 201 })
  } catch (error) {
    console.error("Seed error:", error)
    return NextResponse.json({ error: "Failed to seed database" }, { status: 500 })
  }
}
