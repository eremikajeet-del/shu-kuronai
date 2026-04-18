"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Clock, AlertCircle, BookOpen, PlusCircle } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { toast } from "sonner"

interface RevisionWithTopic {
  id: string
  userId: string
  topicId: string
  revisionDate: string
  revisionNumber: number
  status: string
  difficulty: string | null
  completedAt: string | null
  nextRevision: string | null
  createdAt: string
  updatedAt: string
  topic: {
    id: string
    userId: string
    subject: string
    topicName: string
    description: string | null
    status: string
    mastery: number
    examDate: string | null
    createdAt: string
    updatedAt: string
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

// Timezone-safe date comparison: extract local date components from a UTC ISO string
function getDateParts(dateStr: string) {
  const d = new Date(dateStr)
  return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() }
}

function getTodayParts() {
  const d = new Date()
  return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() }
}

function isSameDay(dateStr: string, parts: { year: number; month: number; day: number }): boolean {
  const dp = getDateParts(dateStr)
  return dp.year === parts.year && dp.month === parts.month && dp.day === parts.day
}

function isToday(dateStr: string): boolean {
  return isSameDay(dateStr, getTodayParts())
}

function isPastOrToday(dateStr: string): boolean {
  const dp = getDateParts(dateStr)
  const tp = getTodayParts()
  // Compare as simple date tuples
  if (dp.year < tp.year) return true
  if (dp.year > tp.year) return false
  if (dp.month < tp.month) return true
  if (dp.month > tp.month) return false
  return dp.day <= tp.day
}

function isStrictlyPast(dateStr: string): boolean {
  return isPastOrToday(dateStr) && !isToday(dateStr)
}

// Difficulty button styles (static classes for Tailwind detection)
const DIFFICULTY_STYLES: Record<string, string> = {
  EASY: "bg-green-500/15 text-green-400 border-green-500/20 hover:bg-green-500/25",
  MEDIUM: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/25",
  HARD: "bg-red-500/15 text-red-400 border-red-500/20 hover:bg-red-500/25",
}

export function RevisionToday() {
  const { userId, setCurrentPage } = useAppStore()
  const [revisions, setRevisions] = useState<RevisionWithTopic[]>([])
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [hasAnyTopics, setHasAnyTopics] = useState<boolean | null>(null)

  const fetchRevisions = useCallback(async () => {
    if (!userId) return
    try {
      setLoading(true)
      const res = await fetch(`/api/revisions?userId=${userId}&status=PENDING`)
      if (!res.ok) throw new Error("Failed to fetch revisions")
      const data: RevisionWithTopic[] = await res.json()
      // Show revisions that are due today or overdue (past)
      const dueRevisions = data.filter((r) => isPastOrToday(r.revisionDate))
      // Sort: overdue first, then today
      dueRevisions.sort((a, b) => {
        const aOverdue = isStrictlyPast(a.revisionDate)
        const bOverdue = isStrictlyPast(b.revisionDate)
        if (aOverdue && !bOverdue) return -1
        if (!aOverdue && bOverdue) return 1
        return new Date(a.revisionDate).getTime() - new Date(b.revisionDate).getTime()
      })
      setRevisions(dueRevisions)

      // Check if user has any topics at all
      const topicsRes = await fetch(`/api/topics?userId=${userId}`)
      if (topicsRes.ok) {
        const topics = await topicsRes.json()
        setHasAnyTopics(topics.length > 0)
      }
    } catch {
      toast.error("Failed to load revisions")
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { fetchRevisions() }, [fetchRevisions])

  const handleComplete = async (revisionId: string, difficulty: "EASY" | "MEDIUM" | "HARD") => {
    if (!userId || completingId) return
    setCompletingId(revisionId)
    try {
      const res = await fetch(`/api/revisions/${revisionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED", difficulty }),
      })
      if (!res.ok) throw new Error("Failed to complete revision")
      setCompletedIds((prev) => new Set(prev).add(revisionId))
      const xpMap = { EASY: "+5 XP", MEDIUM: "+8 XP", HARD: "+10 XP" }
      toast.success(`Revision completed! ${xpMap[difficulty]}`, { icon: <Check className="h-4 w-4 text-green-400" /> })
      setTimeout(() => {
        fetchRevisions()
        setCompletedIds((prev) => { const next = new Set(prev); next.delete(revisionId); return next })
      }, 600)
    } catch {
      toast.error("Failed to complete revision")
    } finally {
      setCompletingId(null)
    }
  }

  const todayPending = revisions.filter((r) => isToday(r.revisionDate) && !completedIds.has(r.id)).length
  const overdueCount = revisions.filter((r) => isStrictlyPast(r.revisionDate) && !completedIds.has(r.id)).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold neon-text">Revision Today</h1>
        <p className="text-muted-foreground mt-1">Stay on top of your spaced repetition schedule</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { count: todayPending, label: "Pending Today", icon: <Clock className="h-5 w-5 text-purple-400" />, bg: "bg-purple-500/15" },
          { count: completedIds.size, label: "Completed Today", icon: <Check className="h-5 w-5 text-green-400" />, bg: "bg-green-500/15" },
          { count: overdueCount, label: "Overdue", icon: <AlertCircle className="h-5 w-5 text-red-400" />, bg: "bg-red-500/15" },
        ].map((card, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * (i + 1) }} className="glass-card p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>{card.icon}</div>
              <div>
                <p className="text-2xl font-bold">{card.count}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Revision List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Today&apos;s Revisions</h2>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
          </div>
        ) : revisions.length === 0 ? (
          /* Dynamic empty state */
          hasAnyTopics ? (
            /* Has topics but no revisions today → show "All Caught Up" */
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 rounded-2xl text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold mb-1">All Caught Up!</h3>
              <p className="text-sm text-muted-foreground">
                No revisions scheduled for today. Take a break or add new topics!
              </p>
            </motion.div>
          ) : (
            /* No topics at all → show "No revisions yet" with CTA */
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 rounded-2xl text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/10 flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No revisions yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add a topic to generate your revision schedule with spaced repetition.
              </p>
              <button
                onClick={() => setCurrentPage("add-topic")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <PlusCircle className="h-4 w-4" />
                Add Topic
              </button>
            </motion.div>
          )
        ) : (
          <AnimatePresence mode="popLayout">
            {revisions.map((revision, index) => {
              const isCompleted = completedIds.has(revision.id)
              const isOverdue = isStrictlyPast(revision.revisionDate)
              const isCompleting = completingId === revision.id

              return (
                <motion.div
                  key={revision.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: isCompleted ? 0 : 1, x: isCompleted ? 100 : 0, scale: isCompleted ? 0.9 : 1 }}
                  exit={{ opacity: 0, x: 100, scale: 0.9 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className={`glass-card p-4 rounded-2xl ${isOverdue ? "border-red-500/20" : ""}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300">{revision.topic.subject}</span>
                        {isOverdue && <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-red-500/15 text-red-300">Overdue</span>}
                      </div>
                      <h3 className="text-sm font-semibold mt-1.5 truncate">{revision.topic.topicName}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">Rev {revision.revisionNumber}/7</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(revision.revisionDate)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(["EASY", "MEDIUM", "HARD"] as const).map(diff => (
                        <button
                          key={diff}
                          onClick={() => handleComplete(revision.id, diff)}
                          disabled={isCompleting}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${DIFFICULTY_STYLES[diff]}`}
                        >
                          {diff.charAt(0) + diff.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
