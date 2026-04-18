"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Clock,
  PlusCircle,
  BookOpen,
  Calendar,
  Filter,
  ChevronDown,
  ChevronUp,
  Loader2,
  Trash2,
  FileText,
  BarChart3,
  Timer,
} from "lucide-react"
import { toast } from "sonner"
import { useAppStore } from "@/lib/store"
import { format, subDays } from "date-fns"

interface StudyLogEntry {
  id: string
  userId: string
  subject: string
  topic: string
  duration: number
  notes: string | null
  date: string
  createdAt: string
  updatedAt: string
}

export function StudyLog() {
  const { userId } = useAppStore()

  // Form state
  const [subject, setSubject] = useState("")
  const [topic, setTopic] = useState("")
  const [duration, setDuration] = useState("")
  const [notes, setNotes] = useState("")
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(true)

  // Logs state
  const [logs, setLogs] = useState<StudyLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Filter state
  const [filterSubject, setFilterSubject] = useState("")
  const [filterDateFrom, setFilterDateFrom] = useState("")
  const [filterDateTo, setFilterDateTo] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchLogs = useCallback(async () => {
    if (!userId) return
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ userId })
      if (filterSubject) params.set("subject", filterSubject)
      if (filterDateFrom) params.set("startDate", filterDateFrom)
      if (filterDateTo) params.set("endDate", filterDateTo)

      const res = await fetch(`/api/study-logs?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data)
      }
    } catch {
      toast.error("Failed to fetch study logs")
    } finally {
      setIsLoading(false)
    }
  }, [userId, filterSubject, filterDateFrom, filterDateTo])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Get unique subjects from logs
  const subjects = useMemo(() => {
    return [...new Set(logs.map((l) => l.subject))].sort()
  }, [logs])

  // Stats
  const totalMinutes = useMemo(() => {
    return logs.reduce((sum, l) => sum + l.duration, 0)
  }, [logs])

  const totalHours = useMemo(() => {
    return (totalMinutes / 60).toFixed(1)
  }, [totalMinutes])

  // Weekly chart data (last 7 days)
  const weeklyChartData = useMemo(() => {
    const days: { label: string; minutes: number; date: string }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i)
      const dateStr = format(d, "yyyy-MM-dd")
      const dayLogs = logs.filter((l) => {
        const logDate = format(new Date(l.date), "yyyy-MM-dd")
        return logDate === dateStr
      })
      const mins = dayLogs.reduce((sum, l) => sum + l.duration, 0)
      days.push({
        label: format(d, "EEE"),
        minutes: mins,
        date: dateStr,
      })
    }
    return days
  }, [logs])

  // Subject breakdown for bar chart
  const subjectBreakdown = useMemo(() => {
    const map: Record<string, number> = {}
    logs.forEach((l) => {
      map[l.subject] = (map[l.subject] || 0) + l.duration
    })
    return Object.entries(map)
      .map(([subject, minutes]) => ({ subject, minutes }))
      .sort((a, b) => b.minutes - a.minutes)
  }, [logs])

  const maxWeeklyMinutes = Math.max(...weeklyChartData.map((d) => d.minutes), 1)
  const maxSubjectMinutes = Math.max(...subjectBreakdown.map((d) => d.minutes), 1)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !subject.trim() || !topic.trim() || !duration) {
      toast.error("Subject, topic, and duration are required")
      return
    }

    const durationNum = parseInt(duration)
    if (isNaN(durationNum) || durationNum <= 0) {
      toast.error("Duration must be a positive number")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/study-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          subject: subject.trim(),
          topic: topic.trim(),
          duration: durationNum,
          notes: notes.trim() || undefined,
          date: date || undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to log study session")
      }

      toast.success(`Study session logged! +${Math.min(Math.floor(durationNum / 5), 20)} XP earned`)
      setSubject("")
      setTopic("")
      setDuration("")
      setNotes("")
      setDate(format(new Date(), "yyyy-MM-dd"))
      fetchLogs()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to log study session")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/study-logs/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Study log deleted")
        fetchLogs()
      } else {
        toast.error("Failed to delete study log")
      }
    } catch {
      toast.error("Failed to delete study log")
    } finally {
      setDeletingId(null)
    }
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }

  const getSubjectColor = (subject: string) => {
    const colors = [
      "from-purple-500/20 to-purple-600/10 text-purple-300",
      "from-blue-500/20 to-blue-600/10 text-blue-300",
      "from-pink-500/20 to-pink-600/10 text-pink-300",
      "from-cyan-500/20 to-cyan-600/10 text-cyan-300",
      "from-amber-500/20 to-amber-600/10 text-amber-300",
      "from-emerald-500/20 to-emerald-600/10 text-emerald-300",
    ]
    let hash = 0
    for (let i = 0; i < subject.length; i++) {
      hash = subject.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
          <Clock className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold neon-text">Study Log</h1>
          <p className="text-sm text-muted-foreground">Track your study sessions and progress</p>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
            <Timer className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Hours</p>
            <p className="text-xl font-bold">{totalHours}<span className="text-sm font-normal text-muted-foreground ml-1">hrs</span></p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Sessions</p>
            <p className="text-xl font-bold">{logs.length}</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-500/15 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-pink-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Subjects</p>
            <p className="text-xl font-bold">{subjects.length}</p>
          </div>
        </div>
      </motion.div>

      {/* Weekly Study Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-4 w-4 text-purple-400" />
          <h2 className="text-sm font-semibold">Weekly Study Activity</h2>
        </div>
        <div className="flex items-end gap-2 h-32">
          {weeklyChartData.map((day) => (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-muted-foreground">
                {day.minutes > 0 ? formatDuration(day.minutes) : ""}
              </span>
              <div className="w-full relative" style={{ height: "80px" }}>
                <div
                  className="absolute bottom-0 w-full rounded-t-md bg-gradient-to-t from-purple-500/60 to-purple-500/20 transition-all duration-500"
                  style={{ height: `${Math.max((day.minutes / maxWeeklyMinutes) * 100, 2)}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{day.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Subject Breakdown Chart */}
      {subjectBreakdown.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-4 w-4 text-cyan-400" />
            <h2 className="text-sm font-semibold">Study Time by Subject</h2>
          </div>
          <div className="space-y-3">
            {subjectBreakdown.map((item) => (
              <div key={item.subject} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-28 truncate" title={item.subject}>
                  {item.subject}
                </span>
                <div className="flex-1 h-5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500/70 to-pink-500/50 transition-all duration-500"
                    style={{ width: `${(item.minutes / maxSubjectMinutes) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-16 text-right">
                  {formatDuration(item.minutes)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Add Study Session Form */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card overflow-hidden"
      >
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4 text-purple-400" />
            <h2 className="text-sm font-semibold">Log Study Session</h2>
          </div>
          {isFormOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        <AnimatePresence>
          {isFormOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1.5">Subject *</label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <input
                        type="text"
                        list="study-subjects-list"
                        placeholder="e.g. Mathematics"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 outline-none transition-all text-sm placeholder:text-muted-foreground"
                        required
                      />
                      <datalist id="study-subjects-list">
                        {subjects.map((s) => (
                          <option key={s} value={s} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  {/* Topic */}
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1.5">Topic *</label>
                    <input
                      type="text"
                      placeholder="e.g. Integration by Parts"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 outline-none transition-all text-sm placeholder:text-muted-foreground"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1.5">Duration (minutes) *</label>
                    <div className="relative">
                      <Timer className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <input
                        type="number"
                        placeholder="30"
                        min="1"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 outline-none transition-all text-sm placeholder:text-muted-foreground"
                        required
                      />
                    </div>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1.5">Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 outline-none transition-all text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">Notes (optional)</label>
                  <textarea
                    placeholder="What did you study? Key takeaways..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 outline-none transition-all text-sm placeholder:text-muted-foreground resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <PlusCircle className="h-4 w-4" />
                  )}
                  {isSubmitting ? "Logging..." : "Log Session"}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <Filter className="h-4 w-4" />
          {showFilters ? "Hide Filters" : "Show Filters"}
          {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="glass-card p-4 mb-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Subject</label>
                    <select
                      value={filterSubject}
                      onChange={(e) => setFilterSubject(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 outline-none transition-all text-sm appearance-none"
                    >
                      <option value="">All Subjects</option>
                      {subjects.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">From Date</label>
                    <input
                      type="date"
                      value={filterDateFrom}
                      onChange={(e) => setFilterDateFrom(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 outline-none transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">To Date</label>
                    <input
                      type="date"
                      value={filterDateTo}
                      onChange={(e) => setFilterDateTo(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 outline-none transition-all text-sm"
                    />
                  </div>
                </div>
                {(filterSubject || filterDateFrom || filterDateTo) && (
                  <button
                    onClick={() => {
                      setFilterSubject("")
                      setFilterDateFrom("")
                      setFilterDateTo("")
                    }}
                    className="mt-3 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Study Log List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold neon-text">Study History</h2>
          <span className="text-xs text-muted-foreground">
            {logs.length} session{logs.length !== 1 ? "s" : ""} &middot; {formatDuration(totalMinutes)} total
          </span>
        </div>

        {isLoading ? (
          <div className="glass-card p-8 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
          </div>
        ) : logs.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              No study sessions logged yet. Start tracking your study time above!
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            <AnimatePresence>
              {logs.map((log, index) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: index * 0.02 }}
                  className="glass-card p-4 hover:border-purple-500/20 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-gradient-to-r ${getSubjectColor(log.subject)}`}>
                          {log.subject}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(log.date), "MMM d, yyyy")}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Timer className="h-3 w-3" />
                          {formatDuration(log.duration)}
                        </span>
                      </div>
                      <h3 className="font-medium text-sm">{log.topic}</h3>
                      {log.notes && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 flex items-start gap-1">
                          <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          {log.notes}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(log.id)}
                      disabled={deletingId === log.id}
                      className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      title="Delete log"
                    >
                      {deletingId === log.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  )
}
