"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import {
  Flame,
  Target,
  Zap,
  BookOpen,
  Clock,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Brain,
  Award,
  PlusCircle,
  Timer,
  Layers,
  Sparkles,
  Rocket,
  ArrowRight,
  Lightbulb,
  Trophy,
} from "lucide-react"
import { useAppStore } from "@/lib/store"

// ── Types ───────────────────────────────────────────────────────────────────

interface DashboardUser {
  id: string
  name: string
  username: string
  xp: number
  level: number
  streak: number
  longestStreak: number
}

interface DashboardStats {
  totalTopics: number
  completedRevisions: number
  totalRevisions: number
  pendingToday: number
  overdue: number
  efficiencyScore: number
  totalWeekMinutes: number
  totalFlashcards: number
  learnedFlashcards: number
}

interface SubjectMastery {
  subject: string
  averageMastery: number
  topicCount: number
  topics: string[]
}

interface HeatmapEntry {
  date: string
  duration: number
  count: number
}

interface UpcomingExam {
  id: string
  topicName: string
  subject: string
  examDate: string
  mastery: number
}

interface DashboardData {
  user: DashboardUser
  stats: DashboardStats
  subjectMastery: SubjectMastery[]
  activityHeatmap: HeatmapEntry[]
  upcomingExams: UpcomingExam[]
  recommendations: string[]
}

// ── Circular Progress ───────────────────────────────────────────────────────

function CircularProgress({ value, size = 80, strokeWidth = 6 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="url(#progressGradient)" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute text-lg font-bold neon-text">{value}%</span>
    </div>
  )
}

// ── Activity Heatmap ────────────────────────────────────────────────────────

function ActivityHeatmap({ data }: { data: HeatmapEntry[] }) {
  const weeks = useMemo(() => {
    const now = new Date()
    const result: { date: string; count: number; dayOfWeek: number }[][] = []
    const dayMap = new Map<string, number>()
    for (const entry of data) dayMap.set(entry.date, entry.count)
    for (let w = 11; w >= 0; w--) {
      const week: { date: string; count: number; dayOfWeek: number }[] = []
      for (let d = 0; d < 7; d++) {
        const date = new Date(now)
        date.setDate(date.getDate() - (w * 7 + (6 - d)))
        const dateStr = date.toISOString().split("T")[0]
        week.push({ date: dateStr, count: dayMap.get(dateStr) || 0, dayOfWeek: d })
      }
      result.push(week)
    }
    return result
  }, [data])

  const getHeatClass = (count: number) => {
    if (count === 0) return "heat-0"
    if (count <= 1) return "heat-1"
    if (count <= 2) return "heat-2"
    if (count <= 4) return "heat-3"
    if (count <= 6) return "heat-4"
    return "heat-5"
  }

  const weekLabels = useMemo(() => {
    const now = new Date()
    const labels: string[] = []
    for (let w = 11; w >= 0; w--) {
      const date = new Date(now)
      date.setDate(date.getDate() - w * 7)
      const month = date.toLocaleString("default", { month: "short" })
      labels.push(w === 11 || date.getDate() <= 7 ? month : "")
    }
    return labels
  }, [])

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex flex-col gap-0.5 min-w-fit">
        <div className="flex gap-0.5">
          <div className="flex flex-col gap-0.5 mr-1 text-[10px] text-muted-foreground">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
              <span key={d} className="h-[14px] flex items-center">{d}</span>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {week.map((day, di) => (
                <div key={di} className={`w-[14px] h-[14px] rounded-sm ${getHeatClass(day.count)} transition-colors hover:ring-1 hover:ring-purple-500/50`} title={`${day.date}: ${day.count} activit${day.count === 1 ? "y" : "ies"}`} />
              ))}
            </div>
          ))}
        </div>
        <div className="flex gap-0.5 ml-[38px]">
          {weekLabels.map((label, i) => (
            <div key={i} className="w-[14px] text-[9px] text-muted-foreground text-center">{label}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Countdown Utility ───────────────────────────────────────────────────────

function getCountdown(targetDate: string): { text: string; urgent: boolean } {
  const diffMs = new Date(targetDate).getTime() - Date.now()
  if (diffMs <= 0) return { text: "Today!", urgent: true }
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  return days < 7 ? { text: `${days}d ${hours}h`, urgent: true } : { text: `${days} days`, urgent: false }
}

function getRecommendationIcon(text: string) {
  const lower = text.toLowerCase()
  if (lower.includes("weak") || lower.includes("focus")) return <Target className="h-4 w-4 text-purple-400 shrink-0" />
  if (lower.includes("overdue") || lower.includes("revision") || lower.includes("streak")) return <Flame className="h-4 w-4 text-orange-400 shrink-0" />
  if (lower.includes("mistake")) return <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0" />
  if (lower.includes("goal")) return <TrendingUp className="h-4 w-4 text-green-400 shrink-0" />
  if (lower.includes("start")) return <Zap className="h-4 w-4 text-cyan-400 shrink-0" />
  return <Brain className="h-4 w-4 text-blue-400 shrink-0" />
}

// ── Animation variants ──────────────────────────────────────────────────────

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } }

// ── Onboarding Dashboard (for new users) ────────────────────────────────────

function OnboardingDashboard() {
  const { setCurrentPage } = useAppStore()

  const steps = [
    { icon: <PlusCircle className="h-6 w-6" />, title: "Add Your First Topic", desc: "Start by adding a subject and topic you want to study", action: () => setCurrentPage("add-topic"), color: "from-blue-500/20 to-cyan-500/20", iconColor: "text-blue-400" },
    { icon: <Calendar className="h-6 w-6" />, title: "Plan Your Revision", desc: "We auto-generate a spaced repetition schedule for you", action: () => setCurrentPage("calendar"), color: "from-purple-500/20 to-blue-500/20", iconColor: "text-purple-400" },
    { icon: <Timer className="h-6 w-6" />, title: "Start Focus Session", desc: "Use the Pomodoro timer to power through your study sessions", action: () => setCurrentPage("student-tools"), color: "from-pink-500/20 to-purple-500/20", iconColor: "text-pink-400" },
  ]

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Welcome Header */}
      <motion.div variants={itemVariants} className="text-center py-4">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="inline-flex mb-4"
        >
          <span className="text-5xl">🚀</span>
        </motion.div>
        <h1 className="text-3xl md:text-4xl font-bold neon-text mb-2">Welcome to Study Tracker</h1>
        <p className="text-muted-foreground text-lg">Your personal AI study coach is ready</p>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-purple-400" />
          <h2 className="text-lg font-semibold neon-text">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "+ Add Topic", icon: <PlusCircle className="h-4 w-4" />, onClick: () => setCurrentPage("add-topic"), gradient: "from-blue-500 to-cyan-500" },
            { label: "⏱ Start Timer", icon: <Timer className="h-4 w-4" />, onClick: () => setCurrentPage("student-tools"), gradient: "from-purple-500 to-blue-500" },
            { label: "📘 Add Flashcard", icon: <Layers className="h-4 w-4" />, onClick: () => setCurrentPage("student-tools"), gradient: "from-pink-500 to-purple-500" },
          ].map((btn, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.03, boxShadow: "0 0 20px rgba(139,92,246,0.2)" }}
              whileTap={{ scale: 0.97 }}
              onClick={btn.onClick}
              className="glass-card p-4 rounded-2xl flex items-center gap-3 text-left transition-all hover:border-purple-500/20"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${btn.gradient} flex items-center justify-center text-white shrink-0`}>
                {btn.icon}
              </div>
              <span className="text-sm font-medium">{btn.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* 3-Step Onboarding */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-2 mb-4">
          <Rocket className="h-5 w-5 text-cyan-400" />
          <h2 className="text-lg font-semibold neon-text">Start Your Study Journey</h2>
        </div>
        <div className="space-y-4">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.01 }}
              className="glass-card p-5 rounded-2xl cursor-pointer group"
              onClick={step.action}
            >
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center ${step.iconColor} shrink-0 group-hover:scale-110 transition-transform`}>
                  {step.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-muted-foreground">STEP {i + 1}</span>
                  </div>
                  <h3 className="text-base font-semibold mb-0.5">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-purple-400 group-hover:translate-x-1 transition-all shrink-0" />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Smart Suggestions for new users */}
      <motion.div variants={itemVariants} className="glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="h-5 w-5 text-yellow-400" />
          <h2 className="text-lg font-semibold neon-text">Smart Suggestions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: "🎯", text: "Start with one subject today", sub: "Consistency beats intensity" },
            { icon: "🔥", text: "Build a daily study habit", sub: "Even 15 minutes counts" },
            { icon: "🧠", text: "Use spaced repetition", sub: "We handle the schedule for you" },
            { icon: "⏰", text: "Try the focus timer", sub: "25 min focus + 5 min break" },
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
              <span className="text-xl shrink-0">{tip.icon}</span>
              <div>
                <p className="text-sm font-medium">{tip.text}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{tip.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Early Achievements Preview */}
      <motion.div variants={itemVariants} className="glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-amber-400" />
          <h2 className="text-lg font-semibold neon-text">Achievements to Unlock</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: "🎯", name: "Beginner", desc: "First topic added", locked: true },
            { icon: "🔥", name: "Consistent", desc: "3-day streak", locked: true },
            { icon: "⏰", name: "Focus Master", desc: "10 pomodoros", locked: true },
            { icon: "📚", name: "Scholar", desc: "Reach Level 5", locked: true },
          ].map((badge, i) => (
            <div key={i} className={`p-3 rounded-xl text-center border ${badge.locked ? "bg-white/[0.02] border-white/[0.04] opacity-50" : "bg-purple-500/10 border-purple-500/20"}`}>
              <span className="text-2xl">{badge.icon}</span>
              <p className="text-xs font-semibold mt-1">{badge.name}</p>
              <p className="text-[10px] text-muted-foreground">{badge.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Main Dashboard Component ────────────────────────────────────────────────

export function Dashboard() {
  const { userId, setCurrentPage } = useAppStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/dashboard?userId=${userId}`)
      if (!res.ok) throw new Error("Failed to fetch dashboard data")
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  // ── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full" />
          <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="glass-card p-8 rounded-2xl text-center max-w-md">
          <Brain className="h-12 w-12 mx-auto text-purple-400 mb-4" />
          <h2 className="text-xl font-bold neon-text mb-2">Welcome to Mr.ADHD</h2>
          <p className="text-muted-foreground">Please sign in to view your study dashboard.</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="glass-card p-8 rounded-2xl text-center max-w-md">
          <AlertTriangle className="h-12 w-12 mx-auto text-yellow-400 mb-4" />
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-4">{error || "Failed to load dashboard data"}</p>
          <button onClick={fetchDashboard} className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white text-sm font-medium hover:opacity-90 transition-opacity">Retry</button>
        </div>
      </div>
    )
  }

  const { user, stats, subjectMastery, activityHeatmap, upcomingExams, recommendations } = data

  // ── Detect new user (onboarding) ──────────────────────────────────────────
  const isNewUser = stats.totalTopics === 0 && stats.totalRevisions === 0 && activityHeatmap.length === 0

  if (isNewUser) {
    return <OnboardingDashboard />
  }

  // ── Derived values ──────────────────────────────────────────────────────
  const xpForNextLevel = user.level * 100
  const xpProgress = xpForNextLevel > 0 ? Math.min((user.xp % xpForNextLevel) / xpForNextLevel * 100, 100) : 0

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl md:text-3xl font-bold neon-text">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back, {user.name || user.username || "Student"}!</p>
      </motion.div>

      {/* Quick Actions Bar */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-purple-400" />
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Quick Actions</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "+ Add Topic", icon: <PlusCircle className="h-3.5 w-3.5" />, onClick: () => setCurrentPage("add-topic") },
            { label: "⏱ Timer", icon: <Timer className="h-3.5 w-3.5" />, onClick: () => setCurrentPage("student-tools") },
            { label: "📘 Flashcard", icon: <Layers className="h-3.5 w-3.5" />, onClick: () => setCurrentPage("student-tools") },
            { label: "🧠 AI Help", icon: <Sparkles className="h-3.5 w-3.5" />, onClick: () => setCurrentPage("ai-assistant") },
          ].map((btn, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(139,92,246,0.15)" }}
              whileTap={{ scale: 0.95 }}
              onClick={btn.onClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-card text-xs font-medium hover:border-purple-500/20 transition-all"
            >
              {btn.icon}
              {btn.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Top Stats Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Efficiency Score */}
        <div className="glass-card p-4 rounded-2xl flex items-center gap-4">
          {stats.efficiencyScore > 0 ? (
            <CircularProgress value={stats.efficiencyScore} />
          ) : (
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center shrink-0">
              <div className="text-center">
                <Target className="h-5 w-5 text-muted-foreground/50 mx-auto" />
                <span className="text-[10px] text-muted-foreground block mt-1">0%</span>
              </div>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Efficiency</p>
            {stats.efficiencyScore > 0 ? (
              <p className="text-sm text-foreground mt-0.5">
                <span className="font-semibold">{stats.completedRevisions}</span>
                <span className="text-muted-foreground"> / {stats.totalRevisions} revisions</span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground mt-0.5">You haven&apos;t started yet</p>
            )}
          </div>
        </div>

        {/* Topics */}
        <div className="glass-card p-4 rounded-2xl flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center shrink-0">
            <BookOpen className="h-7 w-7 text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Topics</p>
            <p className="text-xl font-bold text-foreground">{stats.totalTopics}<span className="text-sm text-muted-foreground font-normal"> total</span></p>
            <p className="text-xs text-muted-foreground mt-0.5">{stats.pendingToday} pending today</p>
          </div>
        </div>

        {/* Streak */}
        <div className="glass-card p-4 rounded-2xl flex items-center gap-4 neon-glow">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center shrink-0">
            <Flame className="h-7 w-7 text-orange-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Streak</p>
            <p className="text-xl font-bold text-foreground">{user.streak}<span className="text-sm text-muted-foreground font-normal"> days</span></p>
            <p className="text-xs text-muted-foreground mt-0.5">Best: {user.longestStreak} days</p>
          </div>
        </div>

        {/* XP & Level */}
        <div className="glass-card p-4 rounded-2xl flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center shrink-0">
            <Award className="h-7 w-7 text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Level {user.level}</p>
            <p className="text-sm font-semibold text-foreground">{user.xp} XP</p>
            <div className="mt-1.5 h-2 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-700 ease-out" style={{ width: `${xpProgress}%` }} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{user.xp % xpForNextLevel} / {xpForNextLevel} XP to next level</p>
          </div>
        </div>
      </motion.div>

      {/* Activity Heatmap */}
      <motion.div variants={itemVariants} className="glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-purple-400" />
          <h2 className="text-lg font-semibold neon-text">Activity Heatmap</h2>
          <span className="text-xs text-muted-foreground ml-auto">Last 12 weeks</span>
        </div>
        <ActivityHeatmap data={activityHeatmap} />
        <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground">
          <span>Less</span>
          {["heat-0","heat-1","heat-2","heat-3","heat-4","heat-5"].map(c => <div key={c} className={`w-[14px] h-[14px] rounded-sm ${c}`} />)}
          <span>More</span>
        </div>
      </motion.div>

      {/* Subject Mastery + Exam Countdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div variants={itemVariants} className="glass-card p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-semibold neon-text">Subject Mastery</h2>
          </div>
          {subjectMastery.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No subjects yet. Add topics to see mastery!</p>
              <button onClick={() => setCurrentPage("add-topic")} className="mt-3 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white text-xs font-medium hover:opacity-90 transition-opacity">+ Add Topic</button>
            </div>
          ) : (
            <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
              {subjectMastery.map((subject) => {
                const isGood = subject.averageMastery >= 60
                return (
                  <div key={subject.subject}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{subject.subject}</span>
                        <span className="text-[10px] text-muted-foreground">({subject.topicCount} topic{subject.topicCount !== 1 ? "s" : ""})</span>
                      </div>
                      <span className={`text-sm font-semibold ${isGood ? "text-purple-400" : "text-orange-400"}`}>{subject.averageMastery}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ease-out ${isGood ? "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" : "bg-gradient-to-r from-orange-500 to-yellow-500"}`} style={{ width: `${subject.averageMastery}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-pink-400" />
            <h2 className="text-lg font-semibold neon-text">Exam Countdown</h2>
          </div>
          {upcomingExams.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No upcoming exams scheduled.</p>
              <p className="text-xs text-muted-foreground mt-1">Add an exam date when creating a topic.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {upcomingExams.map((exam) => {
                const countdown = getCountdown(exam.examDate)
                return (
                  <div key={exam.id} className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${countdown.urgent ? "bg-pink-500/10 border border-pink-500/20 neon-glow-pink" : "bg-white/[0.03] border border-white/[0.04]"}`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${countdown.urgent ? "bg-pink-500/20" : "bg-purple-500/10"}`}>
                      <Clock className={`h-5 w-5 ${countdown.urgent ? "text-pink-400" : "text-purple-400"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{exam.topicName}</p>
                      <p className="text-xs text-muted-foreground">{exam.subject}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold ${countdown.urgent ? "text-pink-400" : ""}`}>{countdown.text}</p>
                      {countdown.urgent && <p className="text-[10px] text-pink-400/70 uppercase tracking-wider font-medium">Urgent</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Smart Recommendations + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div variants={itemVariants} className="glass-card p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-semibold neon-text">Smart Recommendations</h2>
            <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground font-medium bg-white/5 px-2 py-0.5 rounded-full">AI-powered</span>
          </div>
          {recommendations.length === 0 ? (
            <div className="text-center py-6">
              <Lightbulb className="h-8 w-8 mx-auto text-yellow-400/30 mb-2" />
              <p className="text-sm text-muted-foreground">Start with one subject today</p>
              <p className="text-xs text-muted-foreground mt-1">Consistency beats intensity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04] hover:border-purple-500/20 transition-colors">
                  <div className="mt-0.5">{getRecommendationIcon(rec)}</div>
                  <p className="text-sm text-foreground/90 leading-relaxed">{rec}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-green-400" />
            <h2 className="text-lg font-semibold neon-text">Recent Activity</h2>
          </div>
          {activityHeatmap.length === 0 ? (
            <div className="text-center py-6">
              <Zap className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">Start your first session today</p>
              <p className="text-xs text-muted-foreground mt-1">Every minute counts towards your goals</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activityHeatmap.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5).map((entry, i) => {
                const date = new Date(entry.date)
                const isToday = entry.date === new Date().toISOString().split("T")[0]
                const dayLabel = isToday ? "Today" : date.toLocaleDateString("default", { weekday: "short", month: "short", day: "numeric" })
                return (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500/15 to-pink-500/10 flex items-center justify-center shrink-0">
                      <BookOpen className="h-4 w-4 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{entry.count} activit{entry.count !== 1 ? "ies" : "y"}</p>
                      <p className="text-xs text-muted-foreground">{entry.duration > 0 ? `${Math.round(entry.duration)} min studied` : "Revisions completed"}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{dayLabel}</span>
                  </div>
                )
              })}
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-white/[0.04] grid grid-cols-2 gap-3">
            <div className="text-center">
              <p className="text-lg font-bold">{Math.round(stats.totalWeekMinutes)}m</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">This Week</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">{stats.learnedFlashcards}/{stats.totalFlashcards}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Flashcards</p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
