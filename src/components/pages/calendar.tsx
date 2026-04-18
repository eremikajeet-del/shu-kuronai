"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Clock, AlertCircle, X, BookOpen, GraduationCap } from "lucide-react"
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

interface TopicWithExam {
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

interface DayInfo {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  pendingRevisions: RevisionWithTopic[]
  completedRevisions: RevisionWithTopic[]
  missedRevisions: RevisionWithTopic[]
  exams: TopicWithExam[]
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function CalendarPage() {
  const { userId } = useAppStore()
  const [revisions, setRevisions] = useState<RevisionWithTopic[]>([])
  const [topics, setTopics] = useState<TopicWithExam[]>([])
  const [loading, setLoading] = useState(true)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [selectedDay, setSelectedDay] = useState<DayInfo | null>(null)

  const fetchData = useCallback(async () => {
    if (!userId) return
    try {
      setLoading(true)
      const [revRes, topicRes] = await Promise.all([
        fetch(`/api/revisions?userId=${userId}`),
        fetch(`/api/topics?userId=${userId}`),
      ])
      if (!revRes.ok) throw new Error("Failed to fetch revisions")
      if (!topicRes.ok) throw new Error("Failed to fetch topics")
      const revData: RevisionWithTopic[] = await revRes.json()
      const topicData: TopicWithExam[] = await topicRes.json()
      setRevisions(revData)
      setTopics(topicData)
    } catch {
      toast.error("Failed to load calendar data")
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
    setSelectedDay(null)
  }

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
    setSelectedDay(null)
  }

  const goToToday = () => {
    const now = new Date()
    setCurrentYear(now.getFullYear())
    setCurrentMonth(now.getMonth())
    setSelectedDay(null)
  }

  const calendarDays = useMemo<DayInfo[]>(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const daysInMonth = getDaysInMonth(currentYear, currentMonth)
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth)

    // Previous month days
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth)

    const days: DayInfo[] = []

    // Fill in previous month's trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
      const date = new Date(prevYear, prevMonth, daysInPrevMonth - i)
      days.push(buildDayInfo(date, false, today))
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(currentYear, currentMonth, d)
      days.push(buildDayInfo(date, true, today))
    }

    // Fill in next month's leading days
    const remaining = 42 - days.length // 6 rows of 7
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(nextYear, nextMonth, d)
      days.push(buildDayInfo(date, false, today))
    }

    return days
  }, [currentYear, currentMonth, revisions, topics])

  function buildDayInfo(date: Date, isCurrentMonth: boolean, today: Date): DayInfo {
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)

    const dayRevisions = revisions.filter((r) => {
      const rDate = new Date(r.revisionDate)
      rDate.setHours(0, 0, 0, 0)
      return rDate.getTime() === dayStart.getTime()
    })

    const pendingRevisions = dayRevisions.filter((r) => r.status === "PENDING")
    const completedRevisions = dayRevisions.filter((r) => r.status === "COMPLETED")

    // A revision is "missed" if its date is before today and it's still PENDING
    const missedRevisions = pendingRevisions.filter(() => dayStart < today)

    const exams = topics.filter((t) => {
      if (!t.examDate) return false
      const eDate = new Date(t.examDate)
      eDate.setHours(0, 0, 0, 0)
      return eDate.getTime() === dayStart.getTime()
    })

    return {
      date,
      isCurrentMonth,
      isToday: dayStart.getTime() === today.getTime(),
      pendingRevisions,
      completedRevisions,
      missedRevisions,
      exams,
    }
  }

  const handleDayClick = (day: DayInfo) => {
    if (day.pendingRevisions.length > 0 || day.completedRevisions.length > 0 || day.missedRevisions.length > 0 || day.exams.length > 0) {
      setSelectedDay(day)
    }
  }

  const closeDayDetail = () => setSelectedDay(null)

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold neon-text">Calendar</h1>
          <p className="text-muted-foreground mt-1">Your study schedule at a glance</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold neon-text">Calendar</h1>
          <p className="text-muted-foreground mt-1">Your study schedule at a glance</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 glass-card px-2 py-1 rounded-xl">
            <button
              onClick={goToPrevMonth}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold min-w-[160px] text-center px-2">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </span>
            <button
              onClick={goToNextMonth}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 rounded-xl text-xs font-medium glass-card hover:bg-white/10 transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
          Pending
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          Completed
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          Missed
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          Exam
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-[rgba(148,163,184,0.08)]">
          {DAY_LABELS.map((day) => (
            <div
              key={day}
              className="py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const hasContent =
              day.pendingRevisions.length > 0 ||
              day.completedRevisions.length > 0 ||
              day.missedRevisions.length > 0 ||
              day.exams.length > 0
            const isSelected = selectedDay && isSameDay(day.date, selectedDay.date)

            return (
              <motion.button
                key={index}
                onClick={() => handleDayClick(day)}
                disabled={!hasContent}
                className={`
                  relative min-h-[72px] md:min-h-[90px] p-1.5 md:p-2 border-b border-r border-[rgba(148,163,184,0.05)]
                  transition-colors duration-150 text-left
                  ${day.isCurrentMonth ? "text-foreground" : "text-muted-foreground/40"}
                  ${day.isToday ? "bg-purple-500/10" : ""}
                  ${isSelected ? "bg-purple-500/15 ring-1 ring-purple-500/30" : ""}
                  ${hasContent && day.isCurrentMonth ? "hover:bg-white/5 cursor-pointer" : "cursor-default"}
                `}
                whileHover={hasContent && day.isCurrentMonth ? { scale: 1.02 } : {}}
                whileTap={hasContent && day.isCurrentMonth ? { scale: 0.98 } : {}}
              >
                <div className="flex flex-col h-full">
                  <span
                    className={`
                      text-xs md:text-sm font-medium inline-flex items-center justify-center
                      ${day.isToday ? "w-6 h-6 md:w-7 md:h-7 rounded-full bg-purple-500 text-white" : ""}
                    `}
                  >
                    {day.date.getDate()}
                  </span>

                  {/* Dots */}
                  <div className="flex flex-wrap gap-0.5 mt-1">
                    {day.missedRevisions.length > 0 && (
                      <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-red-500" />
                    )}
                    {day.pendingRevisions.length > 0 && day.missedRevisions.length === 0 && (
                      <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-purple-500" />
                    )}
                    {day.completedRevisions.length > 0 && (
                      <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500" />
                    )}
                    {day.exams.length > 0 && (
                      <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-amber-500" />
                    )}
                  </div>

                  {/* Count badges on larger screens */}
                  <div className="hidden md:flex flex-wrap gap-1 mt-1">
                    {day.missedRevisions.length > 0 && (
                      <span className="text-[9px] px-1 rounded bg-red-500/15 text-red-400">
                        {day.missedRevisions.length}m
                      </span>
                    )}
                    {day.pendingRevisions.length > 0 && day.missedRevisions.length === 0 && (
                      <span className="text-[9px] px-1 rounded bg-purple-500/15 text-purple-400">
                        {day.pendingRevisions.length}p
                      </span>
                    )}
                    {day.completedRevisions.length > 0 && (
                      <span className="text-[9px] px-1 rounded bg-green-500/15 text-green-400">
                        {day.completedRevisions.length}c
                      </span>
                    )}
                    {day.exams.length > 0 && (
                      <span className="text-[9px] px-1 rounded bg-amber-500/15 text-amber-400">
                        {day.exams.length}e
                      </span>
                    )}
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Day Detail Modal */}
      <AnimatePresence>
        {selectedDay && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDayDetail}
              className="fixed inset-0 bg-black/50 z-40"
            />
            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full sm:w-[400px] z-50 glass-card rounded-l-2xl border-l border-[rgba(148,163,184,0.1)] overflow-y-auto"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold neon-text">
                      {formatDateShort(selectedDay.date)}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedDay.date.toLocaleDateString("en-US", { weekday: "long" })}
                    </p>
                  </div>
                  <button
                    onClick={closeDayDetail}
                    className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Exams */}
                {selectedDay.exams.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <GraduationCap className="h-4 w-4 text-amber-400" />
                      <h3 className="text-sm font-semibold text-amber-300">Exams</h3>
                    </div>
                    <div className="space-y-2">
                      {selectedDay.exams.map((exam) => (
                        <div
                          key={exam.id}
                          className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/15"
                        >
                          <p className="text-sm font-medium">{exam.topicName}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{exam.subject}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missed Revisions */}
                {selectedDay.missedRevisions.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <h3 className="text-sm font-semibold text-red-300">Missed Revisions</h3>
                    </div>
                    <div className="space-y-2">
                      {selectedDay.missedRevisions.map((rev) => (
                        <div
                          key={rev.id}
                          className="p-3 rounded-xl bg-red-500/10 border border-red-500/15"
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-red-500/15 text-red-300">
                              {rev.topic.subject}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Rev {rev.revisionNumber}/7
                            </span>
                          </div>
                          <p className="text-sm font-medium mt-1">{rev.topic.topicName}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending Revisions (not missed) */}
                {selectedDay.pendingRevisions.filter((r) => !selectedDay.missedRevisions.includes(r)).length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="h-4 w-4 text-purple-400" />
                      <h3 className="text-sm font-semibold text-purple-300">Pending Revisions</h3>
                    </div>
                    <div className="space-y-2">
                      {selectedDay.pendingRevisions
                        .filter((r) => !selectedDay.missedRevisions.includes(r))
                        .map((rev) => (
                          <div
                            key={rev.id}
                            className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/15"
                          >
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300">
                                {rev.topic.subject}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Rev {rev.revisionNumber}/7
                              </span>
                            </div>
                            <p className="text-sm font-medium mt-1">{rev.topic.topicName}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Completed Revisions */}
                {selectedDay.completedRevisions.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="h-4 w-4 text-green-400" />
                      <h3 className="text-sm font-semibold text-green-300">Completed Revisions</h3>
                    </div>
                    <div className="space-y-2">
                      {selectedDay.completedRevisions.map((rev) => (
                        <div
                          key={rev.id}
                          className="p-3 rounded-xl bg-green-500/10 border border-green-500/15"
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-green-500/15 text-green-300">
                              {rev.topic.subject}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Rev {rev.revisionNumber}/7
                            </span>
                            {rev.difficulty && (
                              <span
                                className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                                  rev.difficulty === "EASY"
                                    ? "bg-green-500/15 text-green-300"
                                    : rev.difficulty === "MEDIUM"
                                    ? "bg-yellow-500/15 text-yellow-300"
                                    : "bg-red-500/15 text-red-300"
                                }`}
                              >
                                {rev.difficulty}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium mt-1">{rev.topic.topicName}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No items note */}
                {selectedDay.exams.length === 0 &&
                  selectedDay.pendingRevisions.length === 0 &&
                  selectedDay.completedRevisions.length === 0 &&
                  selectedDay.missedRevisions.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">Nothing scheduled for this day</p>
                    </div>
                  )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
