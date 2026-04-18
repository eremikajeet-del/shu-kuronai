"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import {
  BarChart3,
  TrendingUp,
  Clock,
  AlertTriangle,
  Brain,
  BookOpen,
  Target,
  Zap,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react"
import { useAppStore } from "@/lib/store"
import { toast } from "sonner"

interface SubjectPerformance {
  subject: string
  accuracy: number
  totalQuestions: number
  correctAnswers: number
  quizCount: number
}

interface AccuracyTrend {
  date: string
  accuracy: number
  score: number
}

interface StudyHoursSubject {
  subject: string
  totalMinutes: number
  totalHours: number
}

interface WeakArea {
  topicId: string
  topicName: string
  subject: string
  mastery: number
  mistakeCount: number
  priority: number
}

interface MockTestTrend {
  date: string
  subject: string
  topic: string
  percentage: number
}

interface AnalyticsData {
  subjectPerformance: SubjectPerformance[]
  accuracyTrends: AccuracyTrend[]
  studyHoursBySubject: StudyHoursSubject[]
  weakAreas: WeakArea[]
  mockTestTrends: MockTestTrend[]
  summary: {
    totalStudyHours: number
    totalQuizAttempts: number
    avgAccuracy: number
    totalTopics: number
    totalMistakes: number
  }
}

const NEON_COLORS = [
  { bg: "from-blue-500 to-blue-600", text: "text-blue-400", fill: "#3b82f6", light: "rgba(59,130,246,0.15)" },
  { bg: "from-purple-500 to-purple-600", text: "text-purple-400", fill: "#8b5cf6", light: "rgba(139,92,246,0.15)" },
  { bg: "from-pink-500 to-pink-600", text: "text-pink-400", fill: "#ec4899", light: "rgba(236,72,153,0.15)" },
  { bg: "from-cyan-500 to-cyan-600", text: "text-cyan-400", fill: "#06b6d4", light: "rgba(6,182,212,0.15)" },
  { bg: "from-amber-500 to-amber-600", text: "text-amber-400", fill: "#f59e0b", light: "rgba(245,158,11,0.15)" },
]

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export function Analytics() {
  const { userId } = useAppStore()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAnalytics = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/analytics?userId=${userId}`)
      if (!res.ok) throw new Error("Failed to fetch analytics")
      const json = await res.json()
      setData(json)
    } catch {
      toast.error("Failed to load analytics data")
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <BarChart3 className="h-16 w-16 text-muted-foreground" />
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    )
  }

  const totalStudyHours = data.summary.totalStudyHours
  const avgDailyHours = totalStudyHours > 0 ? (totalStudyHours / 30).toFixed(1) : "0"
  const bestSubject = data.subjectPerformance.length > 0
    ? [...data.subjectPerformance].sort((a, b) => b.accuracy - a.accuracy)[0]
    : null

  const studyHoursTotal = data.studyHoursBySubject.reduce((s, h) => s + h.totalHours, 0)

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item}>
        <h1 className="text-2xl md:text-3xl font-bold neon-text flex items-center gap-3">
          <BarChart3 className="h-8 w-8" />
          Analytics
        </h1>
        <p className="text-muted-foreground mt-1">Track your performance and study patterns</p>
      </motion.div>

      {/* Overall Stats */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Clock className="h-5 w-5 text-blue-400" />}
          label="Total Study Hours"
          value={`${totalStudyHours}h`}
          color="blue"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-purple-400" />}
          label="Avg Daily Hours"
          value={`${avgDailyHours}h`}
          color="purple"
        />
        <StatCard
          icon={<Award className="h-5 w-5 text-cyan-400" />}
          label="Best Subject"
          value={bestSubject?.subject || "N/A"}
          subValue={bestSubject ? `${bestSubject.accuracy}%` : undefined}
          color="cyan"
        />
        <StatCard
          icon={<Target className="h-5 w-5 text-pink-400" />}
          label="Avg Accuracy"
          value={`${data.summary.avgAccuracy}%`}
          color="pink"
        />
      </motion.div>

      {/* Subject Performance & Accuracy Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Performance - Bar Chart */}
        <motion.div variants={item} className="glass-card p-6">
          <h2 className="text-lg font-semibold neon-text flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5" />
            Subject Performance
          </h2>
          {data.subjectPerformance.length === 0 ? (
            <p className="text-muted-foreground text-sm">No quiz data yet</p>
          ) : (
            <div className="space-y-3">
              {data.subjectPerformance.map((sp, i) => {
                const color = NEON_COLORS[i % NEON_COLORS.length]
                return (
                  <div key={sp.subject}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{sp.subject}</span>
                      <span className={`text-sm font-bold ${color.text}`}>{sp.accuracy}%</span>
                    </div>
                    <div className="h-8 bg-white/5 rounded-lg overflow-hidden relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${sp.accuracy}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
                        className={`h-full bg-gradient-to-r ${color.bg} rounded-lg relative`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
                      </motion.div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {sp.correctAnswers}/{sp.totalQuestions} correct in {sp.quizCount} quiz{sp.quizCount !== 1 ? "zes" : ""}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* Accuracy Trends - Line Chart */}
        <motion.div variants={item} className="glass-card p-6">
          <h2 className="text-lg font-semibold neon-text flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5" />
            Accuracy Trends (Last 30 Days)
          </h2>
          {data.accuracyTrends.length === 0 ? (
            <p className="text-muted-foreground text-sm">No quiz attempts in the last 30 days</p>
          ) : (
            <div className="h-64 relative">
              <svg
                viewBox="0 0 600 240"
                className="w-full h-full"
                preserveAspectRatio="none"
              >
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map((pct) => (
                  <g key={pct}>
                    <line
                      x1="40"
                      y1={220 - (pct / 100) * 200}
                      x2="590"
                      y2={220 - (pct / 100) * 200}
                      stroke="rgba(148,163,184,0.08)"
                      strokeWidth="1"
                    />
                    <text
                      x="35"
                      y={224 - (pct / 100) * 200}
                      fill="rgba(148,163,184,0.5)"
                      fontSize="10"
                      textAnchor="end"
                    >
                      {pct}%
                    </text>
                  </g>
                ))}

                {/* Area fill */}
                {data.accuracyTrends.length > 1 && (
                  <motion.path
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.3 }}
                    d={(() => {
                      const points = data.accuracyTrends.map((t, i) => {
                        const x = 40 + (i / (data.accuracyTrends.length - 1)) * 550
                        const y = 220 - (t.accuracy / 100) * 200
                        return `${x},${y}`
                      })
                      const firstX = 40
                      const lastX = 40 + ((data.accuracyTrends.length - 1) / (data.accuracyTrends.length - 1)) * 550
                      return `M ${firstX},220 L ${points.join(" L ")} L ${lastX},220 Z`
                    })()}
                    fill="url(#areaGradient)"
                    stroke="none"
                  />
                )}

                {/* Line */}
                {data.accuracyTrends.length > 1 && (
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    d={(() => {
                      return data.accuracyTrends
                        .map((t, i) => {
                          const x = 40 + (i / (data.accuracyTrends.length - 1)) * 550
                          const y = 220 - (t.accuracy / 100) * 200
                          return `${i === 0 ? "M" : "L"} ${x},${y}`
                        })
                        .join(" ")
                    })()}
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Dots */}
                {data.accuracyTrends.map((t, i) => {
                  const x = 40 + (i / Math.max(data.accuracyTrends.length - 1, 1)) * 550
                  const y = 220 - (t.accuracy / 100) * 200
                  return (
                    <motion.circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="4"
                      fill="#8b5cf6"
                      stroke="#0b0f1a"
                      strokeWidth="2"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 + i * 0.05 }}
                    />
                  )
                })}

                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(139,92,246,0.3)" />
                    <stop offset="100%" stopColor="rgba(139,92,246,0)" />
                  </linearGradient>
                </defs>
              </svg>
              {/* X-axis dates */}
              <div className="flex justify-between mt-2 text-xs text-muted-foreground px-10">
                {data.accuracyTrends.length > 0 && (
                  <>
                    <span>{new Date(data.accuracyTrends[0].date).toLocaleDateString("en", { month: "short", day: "numeric" })}</span>
                    {data.accuracyTrends.length > 2 && (
                      <span>
                        {new Date(data.accuracyTrends[Math.floor(data.accuracyTrends.length / 2)].date).toLocaleDateString("en", { month: "short", day: "numeric" })}
                      </span>
                    )}
                    <span>
                      {new Date(data.accuracyTrends[data.accuracyTrends.length - 1].date).toLocaleDateString("en", { month: "short", day: "numeric" })}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Study Hours by Subject & Weak Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Study Hours by Subject - Pie-like display */}
        <motion.div variants={item} className="glass-card p-6">
          <h2 className="text-lg font-semibold neon-text flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5" />
            Study Hours by Subject
          </h2>
          {data.studyHoursBySubject.length === 0 ? (
            <p className="text-muted-foreground text-sm">No study logs yet</p>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Circular chart */}
              <div className="relative w-44 h-44 flex-shrink-0">
                <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
                  {(() => {
                    let cumulative = 0
                    return data.studyHoursBySubject.map((sh, i) => {
                      const color = NEON_COLORS[i % NEON_COLORS.length]
                      const percentage = studyHoursTotal > 0 ? sh.totalHours / studyHoursTotal : 0
                      const startAngle = cumulative * 360
                      cumulative += percentage
                      const endAngle = cumulative * 360
                      const startRad = (startAngle * Math.PI) / 180
                      const endRad = (endAngle * Math.PI) / 180
                      const largeArc = endAngle - startAngle > 180 ? 1 : 0
                      const r = 65
                      const cx = 80
                      const cy = 80

                      if (data.studyHoursBySubject.length === 1) {
                        return (
                          <motion.circle
                            key={i}
                            cx={cx}
                            cy={cy}
                            r={r}
                            fill="none"
                            stroke={color.fill}
                            strokeWidth="24"
                            initial={{ strokeDasharray: `0 ${2 * Math.PI * r}` }}
                            animate={{ strokeDasharray: `${2 * Math.PI * r} 0` }}
                            transition={{ duration: 1, delay: i * 0.1 }}
                          />
                        )
                      }

                      const x1 = cx + r * Math.cos(startRad)
                      const y1 = cy + r * Math.sin(startRad)
                      const x2 = cx + r * Math.cos(endRad)
                      const y2 = cy + r * Math.sin(endRad)

                      const d = [
                        `M ${x1} ${y1}`,
                        `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
                      ].join(" ")

                      return (
                        <motion.path
                          key={i}
                          d={d}
                          fill="none"
                          stroke={color.fill}
                          strokeWidth="24"
                          strokeLinecap="round"
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 1 }}
                          transition={{ duration: 0.8, delay: i * 0.15 }}
                        />
                      )
                    })
                  })()}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{studyHoursTotal.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">hours</p>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex-1 space-y-2 w-full">
                {data.studyHoursBySubject.map((sh, i) => {
                  const color = NEON_COLORS[i % NEON_COLORS.length]
                  const percentage = studyHoursTotal > 0 ? ((sh.totalHours / studyHoursTotal) * 100).toFixed(0) : "0"
                  return (
                    <motion.div
                      key={sh.subject}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: color.fill }}
                        />
                        <span className="text-sm">{sh.subject}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{sh.totalHours}h</span>
                        <span className={`text-sm font-semibold ${color.text}`}>{percentage}%</span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}
        </motion.div>

        {/* Weak Areas */}
        <motion.div variants={item} className="glass-card p-6">
          <h2 className="text-lg font-semibold neon-text flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5" />
            Weak Areas
          </h2>
          {data.weakAreas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Award className="h-12 w-12 text-green-400 mb-3" />
              <p className="text-sm text-muted-foreground">Great job! No weak areas detected</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {data.weakAreas.map((wa, i) => (
                <motion.div
                  key={wa.topicId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] transition-colors"
                >
                  <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    wa.mastery < 30
                      ? "bg-red-500/15 text-red-400"
                      : wa.mastery < 50
                        ? "bg-amber-500/15 text-amber-400"
                        : "bg-yellow-500/15 text-yellow-400"
                  }`}>
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">{wa.topicName}</p>
                      <span className={`text-xs font-bold ${
                        wa.mastery < 30 ? "text-red-400" : wa.mastery < 50 ? "text-amber-400" : "text-yellow-400"
                      }`}>
                        {wa.mastery}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{wa.subject}</p>
                    <div className="mt-1.5 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${wa.mastery}%` }}
                        transition={{ duration: 0.6, delay: 0.3 + i * 0.05 }}
                        className={`h-full rounded-full ${
                          wa.mastery < 30
                            ? "bg-red-500"
                            : wa.mastery < 50
                              ? "bg-amber-500"
                              : "bg-yellow-500"
                        }`}
                      />
                    </div>
                    {wa.mistakeCount > 0 && (
                      <p className="text-xs text-red-400/70 mt-1">{wa.mistakeCount} unresolved mistake{wa.mistakeCount !== 1 ? "s" : ""}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Study vs Results Correlation */}
      <motion.div variants={item} className="glass-card p-6">
        <h2 className="text-lg font-semibold neon-text flex items-center gap-2 mb-4">
          <Brain className="h-5 w-5" />
          Study Hours vs Quiz Accuracy
        </h2>
        {data.subjectPerformance.length === 0 || data.studyHoursBySubject.length === 0 ? (
          <p className="text-muted-foreground text-sm">Need both study logs and quiz data to show correlation</p>
        ) : (
          <div className="space-y-3">
            {(() => {
              const allSubjects = new Set([
                ...data.subjectPerformance.map((s) => s.subject),
                ...data.studyHoursBySubject.map((s) => s.subject),
              ])
              return Array.from(allSubjects).map((subject, i) => {
                const perf = data.subjectPerformance.find((s) => s.subject === subject)
                const hours = data.studyHoursBySubject.find((s) => s.subject === subject)
                const studyH = hours?.totalHours || 0
                const accuracy = perf?.accuracy || 0
                const color = NEON_COLORS[i % NEON_COLORS.length]

                return (
                  <motion.div
                    key={subject}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]"
                  >
                    <span className="text-sm font-medium w-28 truncate flex-shrink-0">{subject}</span>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-blue-400 flex-shrink-0" />
                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((studyH / Math.max(studyH, 1)) * 100, 100)}%` }}
                            transition={{ duration: 0.6, delay: i * 0.1 }}
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                          />
                        </div>
                        <span className="text-xs text-blue-400 w-12 text-right">{studyH}h</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="h-3 w-3 text-pink-400 flex-shrink-0" />
                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${accuracy}%` }}
                            transition={{ duration: 0.6, delay: i * 0.1 }}
                            className={`h-full bg-gradient-to-r ${color.bg} rounded-full`}
                          />
                        </div>
                        <span className={`text-xs w-12 text-right ${color.text}`}>{accuracy}%</span>
                      </div>
                    </div>
                    {accuracy >= 70 && studyH > 0 && (
                      <ArrowUpRight className="h-4 w-4 text-green-400 flex-shrink-0" />
                    )}
                    {accuracy < 50 && studyH > 0 && (
                      <ArrowDownRight className="h-4 w-4 text-red-400 flex-shrink-0" />
                    )}
                  </motion.div>
                )
              })
            })()}
          </div>
        )}
      </motion.div>

      {/* Additional Stats Row */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 text-center">
          <BookOpen className="h-6 w-6 text-purple-400 mx-auto mb-2" />
          <p className="text-2xl font-bold">{data.summary.totalTopics}</p>
          <p className="text-xs text-muted-foreground">Total Topics</p>
        </div>
        <div className="glass-card p-4 text-center">
          <Target className="h-6 w-6 text-cyan-400 mx-auto mb-2" />
          <p className="text-2xl font-bold">{data.summary.totalQuizAttempts}</p>
          <p className="text-xs text-muted-foreground">Quiz Attempts</p>
        </div>
        <div className="glass-card p-4 text-center col-span-2 md:col-span-1">
          <AlertTriangle className="h-6 w-6 text-amber-400 mx-auto mb-2" />
          <p className="text-2xl font-bold">{data.summary.totalMistakes}</p>
          <p className="text-xs text-muted-foreground">Unresolved Mistakes</p>
        </div>
      </motion.div>
    </motion.div>
  )
}

function StatCard({
  icon,
  label,
  value,
  subValue,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  subValue?: string
  color: "blue" | "purple" | "cyan" | "pink" | "amber"
}) {
  const colorMap = {
    blue: "from-blue-500/10 to-blue-500/5 border-blue-500/10",
    purple: "from-purple-500/10 to-purple-500/5 border-purple-500/10",
    cyan: "from-cyan-500/10 to-cyan-500/5 border-cyan-500/10",
    pink: "from-pink-500/10 to-pink-500/5 border-pink-500/10",
    amber: "from-amber-500/10 to-amber-500/5 border-amber-500/10",
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`glass-card p-4 bg-gradient-to-br ${colorMap[color]} border`}
    >
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-muted-foreground">{label}</span></div>
      <p className="text-xl font-bold truncate">{value}</p>
      {subValue && <p className="text-xs text-muted-foreground mt-0.5">{subValue}</p>}
    </motion.div>
  )
}
