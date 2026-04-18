"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Target,
  Plus,
  Check,
  Trash2,
  Minus,
  Loader2,
  Trophy,
  Flame,
  Sparkles,
  Calendar,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react"
import { useAppStore } from "@/lib/store"
import { toast } from "sonner"

interface Goal {
  id: string
  userId: string
  title: string
  description: string | null
  type: string
  target: number
  current: number
  deadline: string | null
  isCompleted: boolean
  createdAt: string
  updatedAt: string
}

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; gradient: string }> = {
  DAILY: {
    label: "Daily",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    gradient: "from-blue-500 to-blue-600",
  },
  WEEKLY: {
    label: "Weekly",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    gradient: "from-purple-500 to-purple-600",
  },
  MONTHLY: {
    label: "Monthly",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/20",
    gradient: "from-pink-500 to-pink-600",
  },
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

export function Goals() {
  const { userId } = useAppStore()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [completedExpanded, setCompletedExpanded] = useState(true)

  // Form state
  const [formTitle, setFormTitle] = useState("")
  const [formDesc, setFormDesc] = useState("")
  const [formType, setFormType] = useState("DAILY")
  const [formTarget, setFormTarget] = useState("")
  const [formDeadline, setFormDeadline] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const formRef = useRef<HTMLDivElement>(null)

  const fetchGoals = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/goals?userId=${userId}`)
      if (!res.ok) throw new Error("Failed to fetch goals")
      const json = await res.json()
      setGoals(json)
    } catch {
      toast.error("Failed to load goals")
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchGoals()
  }, [fetchGoals])

  const activeGoals = goals.filter((g) => !g.isCompleted)
  const completedGoals = goals.filter((g) => g.isCompleted)

  const completionRate = goals.length > 0
    ? Math.round((completedGoals.length / goals.length) * 100)
    : 0

  // Calculate streak: consecutive days with at least one completed goal
  const streak = (() => {
    const completedDates = completedGoals
      .map((g) => g.updatedAt?.split("T")[0])
      .filter(Boolean)
      .sort()
      .reverse()
    const uniqueDates = [...new Set(completedDates)]
    if (uniqueDates.length === 0) return 0
    let count = 0
    const today = new Date().toISOString().split("T")[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]
    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) return 0
    let checkDate = new Date(uniqueDates[0])
    for (const d of uniqueDates) {
      const expected = checkDate.toISOString().split("T")[0]
      if (d === expected) {
        count++
        checkDate = new Date(checkDate.getTime() - 86400000)
      } else {
        break
      }
    }
    return count
  })()

  const xpFromGoals = completedGoals.length * 25

  const handleAddGoal = async () => {
    if (!formTitle.trim()) {
      toast.error("Title is required")
      return
    }
    if (!formTarget || Number(formTarget) <= 0) {
      toast.error("Target must be a positive number")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          title: formTitle.trim(),
          description: formDesc.trim() || null,
          type: formType,
          target: Number(formTarget),
          deadline: formDeadline || null,
        }),
      })
      if (!res.ok) throw new Error("Failed to create goal")
      toast.success("Goal created!")
      setFormTitle("")
      setFormDesc("")
      setFormType("DAILY")
      setFormTarget("")
      setFormDeadline("")
      setShowForm(false)
      fetchGoals()
    } catch {
      toast.error("Failed to create goal")
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateProgress = async (goalId: string, newCurrent: number) => {
    try {
      const res = await fetch("/api/goals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: goalId, current: newCurrent }),
      })
      if (!res.ok) throw new Error("Failed to update goal")
      setGoals((prev) =>
        prev.map((g) => (g.id === goalId ? { ...g, current: newCurrent } : g))
      )
    } catch {
      toast.error("Failed to update progress")
    }
  }

  const handleComplete = async (goalId: string) => {
    try {
      const goal = goals.find((g) => g.id === goalId)
      const res = await fetch("/api/goals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: goalId, isCompleted: true, current: goal?.target || 0 }),
      })
      if (!res.ok) throw new Error("Failed to complete goal")
      toast.success("Goal completed! +25 XP 🎉")
      fetchGoals()
    } catch {
      toast.error("Failed to complete goal")
    }
  }

  const handleDelete = async (goalId: string) => {
    try {
      const res = await fetch(`/api/goals/${goalId}?userId=${userId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete goal")
      toast.success("Goal deleted")
      setGoals((prev) => prev.filter((g) => g.id !== goalId))
    } catch {
      toast.error("Failed to delete goal")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold neon-text flex items-center gap-3">
            <Target className="h-8 w-8" />
            Goals
          </h1>
          <p className="text-muted-foreground mt-1">Set targets and track your progress</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white text-sm font-medium shadow-lg shadow-purple-500/20"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Cancel" : "Add Goal"}
        </motion.button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4 text-center">
          <Trophy className="h-6 w-6 text-amber-400 mx-auto mb-2" />
          <p className="text-2xl font-bold">{completionRate}%</p>
          <p className="text-xs text-muted-foreground">Completion Rate</p>
        </div>
        <div className="glass-card p-4 text-center">
          <Flame className="h-6 w-6 text-orange-400 mx-auto mb-2" />
          <p className="text-2xl font-bold">{streak}</p>
          <p className="text-xs text-muted-foreground">Day Streak</p>
        </div>
        <div className="glass-card p-4 text-center">
          <Sparkles className="h-6 w-6 text-purple-400 mx-auto mb-2" />
          <p className="text-2xl font-bold">{xpFromGoals}</p>
          <p className="text-xs text-muted-foreground">XP Earned</p>
        </div>
      </motion.div>

      {/* Add Goal Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            ref={formRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-lg font-semibold neon-text">New Goal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Title *</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Study 2 hours daily"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder:text-muted-foreground/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Type *</label>
                  <div className="flex gap-2">
                    {(["DAILY", "WEEKLY", "MONTHLY"] as const).map((t) => {
                      const cfg = TYPE_CONFIG[t]
                      return (
                        <button
                          key={t}
                          onClick={() => setFormType(t)}
                          className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                            formType === t
                              ? `${cfg.bg} ${cfg.color} ${cfg.border} border`
                              : "bg-white/5 text-muted-foreground hover:bg-white/10 border border-transparent"
                          }`}
                        >
                          {cfg.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Target *</label>
                  <input
                    type="number"
                    value={formTarget}
                    onChange={(e) => setFormTarget(e.target.value)}
                    placeholder="e.g. 120 (minutes)"
                    min="1"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder:text-muted-foreground/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Deadline</label>
                  <input
                    type="date"
                    value={formDeadline}
                    onChange={(e) => setFormDeadline(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-foreground [color-scheme:dark]"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-muted-foreground mb-1.5 block">Description</label>
                  <input
                    type="text"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Optional description"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder:text-muted-foreground/50"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddGoal}
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white text-sm font-medium shadow-lg shadow-purple-500/20 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Create Goal
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Goals */}
      <motion.div variants={item}>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Target className="h-5 w-5 text-purple-400" />
          Active Goals
          <span className="text-sm text-muted-foreground">({activeGoals.length})</span>
        </h2>
        {activeGoals.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <Target className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No active goals. Create one to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {activeGoals.map((goal) => {
                const cfg = TYPE_CONFIG[goal.type] || TYPE_CONFIG.DAILY
                const progress = goal.target > 0 ? Math.min(Math.round((goal.current / goal.target) * 100), 100) : 0
                const isNearDeadline = goal.deadline
                  ? new Date(goal.deadline).getTime() - Date.now() < 3 * 86400000
                  : false

                return (
                  <motion.div
                    key={goal.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`glass-card p-5 space-y-3 border ${cfg.border} ${
                      isNearDeadline ? "ring-1 ring-amber-500/30" : ""
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{goal.title}</h3>
                        {goal.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{goal.description}</p>
                        )}
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} ${cfg.border} border flex-shrink-0`}>
                        {cfg.label}
                      </span>
                    </div>

                    {/* Progress */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">
                          {goal.current} / {goal.target}
                        </span>
                        <span className={`font-bold ${cfg.color}`}>{progress}%</span>
                      </div>
                      <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className={`h-full bg-gradient-to-r ${cfg.gradient} rounded-full relative`}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
                        </motion.div>
                      </div>
                    </div>

                    {/* Progress controls */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 flex-1">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleUpdateProgress(goal.id, Math.max(0, goal.current - 1))}
                          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </motion.button>
                        <input
                          type="number"
                          value={goal.current}
                          onChange={(e) => {
                            const v = parseInt(e.target.value)
                            if (!isNaN(v) && v >= 0) handleUpdateProgress(goal.id, v)
                          }}
                          className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                        />
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleUpdateProgress(goal.id, goal.current + 1)}
                          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </motion.button>
                      </div>

                      {/* Actions */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleComplete(goal.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 text-green-400 rounded-lg text-xs font-medium hover:bg-green-500/20 transition-colors border border-green-500/20"
                      >
                        <Check className="h-3 w-3" />
                        Done
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDelete(goal.id)}
                        className="w-7 h-7 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </motion.button>
                    </div>

                    {/* Deadline */}
                    {goal.deadline && (
                      <div className={`flex items-center gap-1.5 text-xs ${
                        isNearDeadline ? "text-amber-400" : "text-muted-foreground"
                      }`}>
                        <Calendar className="h-3 w-3" />
                        <span>
                          Due {new Date(goal.deadline).toLocaleDateString("en", { month: "short", day: "numeric" })}
                        </span>
                        {isNearDeadline && <span className="text-amber-400 font-medium ml-1">(Soon!)</span>}
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <motion.div variants={item}>
          <button
            onClick={() => setCompletedExpanded(!completedExpanded)}
            className="flex items-center gap-2 mb-3 text-lg font-semibold w-full"
          >
            <Check className="h-5 w-5 text-green-400" />
            Completed Goals
            <span className="text-sm text-muted-foreground">({completedGoals.length})</span>
            <span className="ml-auto">
              {completedExpanded ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </span>
          </button>
          <AnimatePresence>
            {completedExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {completedGoals.map((goal) => {
                    const cfg = TYPE_CONFIG[goal.type] || TYPE_CONFIG.DAILY
                    return (
                      <motion.div
                        key={goal.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] group"
                      >
                        <div className="w-7 h-7 rounded-full bg-green-500/15 flex items-center justify-center flex-shrink-0">
                          <Check className="h-3.5 w-3.5 text-green-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate line-through opacity-60">{goal.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {cfg.label} &middot; {goal.target} target
                          </p>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        <button
                          onClick={() => handleDelete(goal.id)}
                          className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-all"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  )
}
