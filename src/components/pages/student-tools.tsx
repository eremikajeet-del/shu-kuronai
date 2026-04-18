"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Timer,
  Layers,
  AlertTriangle,
  FileCheck,
  HelpCircle,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Maximize,
  Minimize,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Check,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  Sparkles,
  TrendingUp,
  BarChart3,
  Calendar,
  Volume2,
  VolumeX,
} from "lucide-react"
import { useAppStore } from "@/lib/store"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"

// ─── Types ────────────────────────────────────────────────────────────────────

interface FlashcardData {
  id: string
  userId: string
  subject: string
  front: string
  back: string
  isLearned: boolean
  repeatCount: number
  createdAt: string
  updatedAt: string
}

interface MistakeData {
  id: string
  userId: string
  subject: string
  topic: string
  description: string
  mistakeType: "CONCEPT" | "CALCULATION" | "SILLY"
  correction: string | null
  isResolved: boolean
  createdAt: string
  updatedAt: string
}

interface MockTestData {
  id: string
  userId: string
  subject: string
  topic: string
  totalMarks: number
  obtainedMarks: number
  date: string
  analysis: string | null
  createdAt: string
  updatedAt: string
}

interface QuestionData {
  id: string
  userId: string
  subject: string
  title: string
  content: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
  _resolved?: boolean
}

interface StudyLogData {
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

// ─── Tool Card Wrapper ────────────────────────────────────────────────────────

function ToolSection({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-card p-6 rounded-2xl"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/20">
          {icon}
        </div>
        <h2 className="text-lg font-semibold neon-text">{title}</h2>
      </div>
      {children}
    </motion.div>
  )
}

// ─── Focus Timer ──────────────────────────────────────────────────────────────

function FocusTimer() {
  const WORK_TIME = 25 * 60
  const BREAK_TIME = 5 * 60
  const LONG_BREAK_TIME = 15 * 60

  const [timeLeft, setTimeLeft] = useState(WORK_TIME)
  const [isRunning, setIsRunning] = useState(false)
  const [isBreak, setIsBreak] = useState(false)
  const [sessions, setSessions] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [flash, setFlash] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const totalTime = isBreak
    ? sessions % 4 === 0 && sessions > 0
      ? LONG_BREAK_TIME
      : BREAK_TIME
    : WORK_TIME

  const progress = ((totalTime - timeLeft) / totalTime) * 100

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  const suggestLongBreak = sessions > 0 && sessions % 4 === 0

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false)
            if (!isBreak) {
              const newSessions = sessions + 1
              setSessions(newSessions)
              setFlash(true)
              setTimeout(() => setFlash(false), 2000)
              toast.success(
                newSessions % 4 === 0
                  ? "Great work! Take a 15-minute break 🎉"
                  : "Pomodoro complete! Take a 5-minute break ⏰"
              )
              setIsBreak(true)
              setTimeLeft(
                newSessions % 4 === 0 ? LONG_BREAK_TIME : BREAK_TIME
              )
            } else {
              setFlash(true)
              setTimeout(() => setFlash(false), 2000)
              toast.success("Break over! Time to focus 💪")
              setIsBreak(false)
              setTimeLeft(WORK_TIME)
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, isBreak, sessions])

  const handleStart = () => setIsRunning(true)
  const handlePause = () => setIsRunning(false)
  const handleReset = () => {
    setIsRunning(false)
    setIsBreak(false)
    setTimeLeft(WORK_TIME)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", handler)
    return () => document.removeEventListener("fullscreenchange", handler)
  }, [])

  // SVG circle params
  const size = 220
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference

  return (
    <div
      ref={containerRef}
      className={`relative ${flash ? "animate-pulse" : ""}`}
      style={
        flash
          ? { boxShadow: "0 0 60px rgba(139,92,246,0.6)" }
          : undefined
      }
    >
      <div className="flex flex-col items-center gap-6">
        {/* Timer Circle */}
        <div className="relative">
          <svg width={size} height={size} className="transform -rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="rgba(148,163,184,0.1)"
              strokeWidth={strokeWidth}
              fill="none"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={
                isBreak
                  ? suggestLongBreak
                    ? "#06b6d4"
                    : "#3b82f6"
                  : "#8b5cf6"
              }
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold tabular-nums tracking-tight">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
            <span className="text-sm text-muted-foreground mt-1">
              {isBreak
                ? suggestLongBreak
                  ? "Long Break"
                  : "Short Break"
                : "Focus Time"}
            </span>
          </div>
        </div>

        {/* Session counter */}
        <div className="flex items-center gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all ${
                i < sessions % 4
                  ? "bg-purple-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]"
                  : "bg-white/10"
              }`}
            />
          ))}
          <span className="text-sm text-muted-foreground ml-2">
            {sessions} pomodoro{sessions !== 1 ? "s" : ""} completed
          </span>
        </div>

        {/* Suggest long break */}
        {suggestLongBreak && isBreak && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-sm text-cyan-400 bg-cyan-500/10 px-4 py-2 rounded-xl border border-cyan-500/20"
          >
            You&apos;ve completed 4 pomodoros! Enjoy a longer 15-minute break.
          </motion.div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-3">
          <Button
            onClick={isRunning ? handlePause : handleStart}
            className="rounded-xl px-6"
          >
            {isRunning ? (
              <>
                <Pause className="h-4 w-4" /> Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4" /> Start
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleReset} className="rounded-xl">
            <RotateCcw className="h-4 w-4" /> Reset
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="rounded-xl"
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="rounded-xl"
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Flashcard Tool ───────────────────────────────────────────────────────────

function FlashcardTool() {
  const { userId } = useAppStore()
  const [flashcards, setFlashcards] = useState<FlashcardData[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [subjectFilter, setSubjectFilter] = useState<string>("all")
  const [studyMode, setStudyMode] = useState(false)
  const [studyIndex, setStudyIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [studyQueue, setStudyQueue] = useState<FlashcardData[]>([])
  const [dontKnowQueue, setDontKnowQueue] = useState<FlashcardData[]>([])
  const [newCard, setNewCard] = useState({
    subject: "",
    front: "",
    back: "",
  })

  const fetchFlashcards = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/flashcards?userId=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setFlashcards(data)
      }
    } catch {
      toast.error("Failed to fetch flashcards")
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchFlashcards()
  }, [fetchFlashcards])

  const subjects = [...new Set(flashcards.map((f) => f.subject))]

  const filtered =
    subjectFilter === "all"
      ? flashcards
      : flashcards.filter((f) => f.subject === subjectFilter)

  const unlearned = filtered.filter((f) => !f.isLearned)

  const handleAddCard = async () => {
    if (!userId || !newCard.subject || !newCard.front || !newCard.back) {
      toast.error("Fill all fields")
      return
    }
    try {
      const res = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...newCard }),
      })
      if (res.ok) {
        toast.success("Flashcard added!")
        setNewCard({ subject: "", front: "", back: "" })
        setShowAddForm(false)
        fetchFlashcards()
      } else {
        toast.error("Failed to add flashcard")
      }
    } catch {
      toast.error("Failed to add flashcard")
    }
  }

  const handleDeleteCard = async (id: string) => {
    try {
      const res = await fetch(`/api/flashcards/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Flashcard deleted")
        fetchFlashcards()
      } else {
        toast.error("Failed to delete")
      }
    } catch {
      toast.error("Failed to delete")
    }
  }

  const startStudyMode = () => {
    if (unlearned.length === 0) {
      toast.info("No unlearned cards to study!")
      return
    }
    setStudyQueue([...unlearned])
    setDontKnowQueue([])
    setStudyIndex(0)
    setFlipped(false)
    setStudyMode(true)
  }

  const handleKnow = async () => {
    const card = studyQueue[studyIndex]
    if (card) {
      try {
        await fetch(`/api/flashcards/${card.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isLearned: true }),
        })
      } catch {
        /* silent */
      }
    }
    advanceStudy()
  }

  const handleDontKnow = () => {
    const card = studyQueue[studyIndex]
    if (card) {
      setDontKnowQueue((prev) => [...prev, card])
    }
    advanceStudy()
  }

  const advanceStudy = () => {
    setFlipped(false)
    if (studyIndex + 1 < studyQueue.length) {
      setStudyIndex(studyIndex + 1)
    } else if (dontKnowQueue.length > 0) {
      setStudyQueue([...dontKnowQueue])
      setDontKnowQueue([])
      setStudyIndex(0)
      toast.info("Repeating cards you didn't know...")
    } else {
      setStudyMode(false)
      toast.success("Study session complete! 🎉")
      fetchFlashcards()
    }
  }

  const studyProgress =
    studyQueue.length > 0
      ? Math.round((studyIndex / studyQueue.length) * 100)
      : 0

  // Study mode UI
  if (studyMode && studyQueue.length > 0) {
    const currentCard = studyQueue[studyIndex]
    return (
      <div className="flex flex-col items-center gap-6">
        <div className="w-full max-w-md">
          <Progress value={studyProgress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1 text-center">
            {studyIndex + 1} of {studyQueue.length}
          </p>
        </div>

        <motion.div
          className="w-full max-w-md glass-card p-6 rounded-2xl min-h-[220px] cursor-pointer"
          onClick={() => setFlipped(!flipped)}
          whileHover={{ scale: 1.01 }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.4 }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <div
            style={{
              backfaceVisibility: "hidden",
              transform: flipped ? "rotateY(180deg)" : "none",
            }}
          >
            <Badge variant="secondary" className="mb-3">
              {currentCard.subject}
            </Badge>
            <p className="text-lg font-medium">{currentCard.front}</p>
            <p className="text-xs text-muted-foreground mt-4">
              Click to flip
            </p>
          </div>
          <div
            className="absolute inset-0 p-6 flex flex-col justify-center"
            style={{
              backfaceVisibility: "hidden",
              transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
              display: flipped ? "flex" : "none",
            }}
          >
            <Badge variant="secondary" className="mb-3 w-fit">
              {currentCard.subject}
            </Badge>
            <p className="text-lg font-medium">{currentCard.back}</p>
          </div>
        </motion.div>

        <div className="flex gap-3">
          <Button
            onClick={handleDontKnow}
            variant="outline"
            className="rounded-xl gap-2 text-red-400 border-red-500/30 hover:bg-red-500/10"
          >
            <X className="h-4 w-4" /> Don&apos;t Know
          </Button>
          <Button
            onClick={handleKnow}
            className="rounded-xl gap-2 bg-green-600 hover:bg-green-700"
          >
            <Check className="h-4 w-4" /> Know
          </Button>
        </div>

        <Button
          variant="ghost"
          onClick={() => {
            setStudyMode(false)
            fetchFlashcards()
          }}
          className="text-muted-foreground"
        >
          Exit Study Mode
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-2 items-center">
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          size="sm"
          className="rounded-xl"
        >
          <Plus className="h-4 w-4" /> Add Card
        </Button>
        <Button
          onClick={startStudyMode}
          size="sm"
          variant="outline"
          className="rounded-xl"
          disabled={unlearned.length === 0}
        >
          <Sparkles className="h-4 w-4" /> Study ({unlearned.length})
        </Button>
        {subjects.length > 0 && (
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger className="w-[140px] rounded-xl">
              <Filter className="h-3 w-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card p-4 rounded-xl space-y-3">
              <Input
                placeholder="Subject"
                value={newCard.subject}
                onChange={(e) =>
                  setNewCard({ ...newCard, subject: e.target.value })
                }
                className="rounded-xl"
              />
              <Input
                placeholder="Front (Question)"
                value={newCard.front}
                onChange={(e) =>
                  setNewCard({ ...newCard, front: e.target.value })
                }
                className="rounded-xl"
              />
              <Textarea
                placeholder="Back (Answer)"
                value={newCard.back}
                onChange={(e) =>
                  setNewCard({ ...newCard, back: e.target.value })
                }
                className="rounded-xl min-h-[60px]"
              />
              <Button onClick={handleAddCard} size="sm" className="rounded-xl">
                Add Flashcard
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flashcard Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 rounded-xl animate-shimmer bg-white/5"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No flashcards yet. Add one to get started!
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
          {filtered.map((card) => (
            <motion.div
              key={card.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-4 rounded-xl group relative"
            >
              <div className="flex items-start justify-between mb-2">
                <Badge
                  variant="secondary"
                  className="text-xs"
                >
                  {card.subject}
                </Badge>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDeleteCard(card.id)}
                    className="p-1 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <p className="text-sm font-medium line-clamp-2">{card.front}</p>
              <div className="flex items-center gap-1 mt-2">
                {card.isLearned ? (
                  <Badge className="text-[10px] bg-green-600/20 text-green-400 border-green-500/30">
                    Learned
                  </Badge>
                ) : (
                  <Badge className="text-[10px] bg-yellow-600/20 text-yellow-400 border-yellow-500/30">
                    Learning
                  </Badge>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Mistake Log ──────────────────────────────────────────────────────────────

const MISTAKE_TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  CONCEPT: { bg: "bg-orange-500/15", text: "text-orange-400", border: "border-orange-500/30" },
  CALCULATION: { bg: "bg-blue-500/15", text: "text-blue-400", border: "border-blue-500/30" },
  SILLY: { bg: "bg-pink-500/15", text: "text-pink-400", border: "border-pink-500/30" },
}

function MistakeLog() {
  const { userId } = useAppStore()
  const [mistakes, setMistakes] = useState<MistakeData[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [resolvedFilter, setResolvedFilter] = useState<string>("all")
  const [newMistake, setNewMistake] = useState({
    subject: "",
    topic: "",
    description: "",
    mistakeType: "CONCEPT" as "CONCEPT" | "CALCULATION" | "SILLY",
    correction: "",
  })

  const fetchMistakes = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/mistakes?userId=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setMistakes(data)
      }
    } catch {
      toast.error("Failed to fetch mistakes")
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchMistakes()
  }, [fetchMistakes])

  const filtered = mistakes.filter((m) => {
    if (typeFilter !== "all" && m.mistakeType !== typeFilter) return false
    if (resolvedFilter === "resolved" && !m.isResolved) return false
    if (resolvedFilter === "unresolved" && m.isResolved) return false
    return true
  })

  // Statistics
  const conceptCount = mistakes.filter((m) => m.mistakeType === "CONCEPT").length
  const calcCount = mistakes.filter((m) => m.mistakeType === "CALCULATION").length
  const sillyCount = mistakes.filter((m) => m.mistakeType === "SILLY").length
  const resolvedCount = mistakes.filter((m) => m.isResolved).length
  const resolutionRate =
    mistakes.length > 0 ? Math.round((resolvedCount / mistakes.length) * 100) : 0

  const handleAddMistake = async () => {
    if (!userId || !newMistake.subject || !newMistake.topic || !newMistake.description) {
      toast.error("Fill required fields")
      return
    }
    try {
      const res = await fetch("/api/mistakes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          ...newMistake,
          correction: newMistake.correction || undefined,
        }),
      })
      if (res.ok) {
        toast.success("Mistake logged!")
        setNewMistake({
          subject: "",
          topic: "",
          description: "",
          mistakeType: "CONCEPT",
          correction: "",
        })
        setShowAddForm(false)
        fetchMistakes()
      } else {
        toast.error("Failed to log mistake")
      }
    } catch {
      toast.error("Failed to log mistake")
    }
  }

  const handleResolve = async (id: string) => {
    try {
      const res = await fetch("/api/mistakes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isResolved: true }),
      })
      if (res.ok) {
        toast.success("Marked as resolved!")
        fetchMistakes()
      }
    } catch {
      toast.error("Failed to update")
    }
  }

  return (
    <div className="space-y-4">
      {/* Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {[
          { label: "Concept", count: conceptCount, color: "text-orange-400" },
          { label: "Calculation", count: calcCount, color: "text-blue-400" },
          { label: "Silly", count: sillyCount, color: "text-pink-400" },
          { label: "Resolved", count: resolvedCount, color: "text-green-400" },
          { label: "Resolution", count: `${resolutionRate}%`, color: "text-purple-400" },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-3 rounded-xl text-center">
            <p className={`text-lg font-bold ${stat.color}`}>{stat.count}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 items-center">
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          size="sm"
          className="rounded-xl"
        >
          <Plus className="h-4 w-4" /> Log Mistake
        </Button>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[130px] rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="CONCEPT">Concept</SelectItem>
            <SelectItem value="CALCULATION">Calculation</SelectItem>
            <SelectItem value="SILLY">Silly</SelectItem>
          </SelectContent>
        </Select>
        <Select value={resolvedFilter} onValueChange={setResolvedFilter}>
          <SelectTrigger className="w-[130px] rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="unresolved">Unresolved</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card p-4 rounded-xl space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  placeholder="Subject *"
                  value={newMistake.subject}
                  onChange={(e) =>
                    setNewMistake({ ...newMistake, subject: e.target.value })
                  }
                  className="rounded-xl"
                />
                <Input
                  placeholder="Topic *"
                  value={newMistake.topic}
                  onChange={(e) =>
                    setNewMistake({ ...newMistake, topic: e.target.value })
                  }
                  className="rounded-xl"
                />
              </div>
              <Textarea
                placeholder="Description *"
                value={newMistake.description}
                onChange={(e) =>
                  setNewMistake({ ...newMistake, description: e.target.value })
                }
                className="rounded-xl min-h-[60px]"
              />
              <div className="flex gap-2">
                {(["CONCEPT", "CALCULATION", "SILLY"] as const).map((type) => {
                  const colors = MISTAKE_TYPE_COLORS[type]
                  return (
                    <button
                      key={type}
                      onClick={() =>
                        setNewMistake({ ...newMistake, mistakeType: type })
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        newMistake.mistakeType === type
                          ? `${colors.bg} ${colors.text} ${colors.border}`
                          : "bg-white/5 text-muted-foreground border-transparent hover:bg-white/10"
                      }`}
                    >
                      {type}
                    </button>
                  )
                })}
              </div>
              <Textarea
                placeholder="Correction (optional)"
                value={newMistake.correction}
                onChange={(e) =>
                  setNewMistake({ ...newMistake, correction: e.target.value })
                }
                className="rounded-xl min-h-[50px]"
              />
              <Button onClick={handleAddMistake} size="sm" className="rounded-xl">
                Log Mistake
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mistake Cards */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl animate-shimmer bg-white/5" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No mistakes logged yet. Keep learning!
        </p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filtered.map((mistake) => {
            const colors = MISTAKE_TYPE_COLORS[mistake.mistakeType] || MISTAKE_TYPE_COLORS.CONCEPT
            return (
              <motion.div
                key={mistake.id}
                layout
                className={`glass-card p-4 rounded-xl border-l-2 ${colors.border} ${
                  mistake.isResolved ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`text-[10px] ${colors.bg} ${colors.text} ${colors.border}`}>
                        {mistake.mistakeType}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {mistake.subject}
                      </Badge>
                      {mistake.isResolved && (
                        <Badge className="text-[10px] bg-green-600/20 text-green-400 border-green-500/30">
                          Resolved
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium">{mistake.description}</p>
                    {mistake.correction && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Fix: {mistake.correction}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {mistake.topic} •{" "}
                      {new Date(mistake.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {!mistake.isResolved && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleResolve(mistake.id)}
                      className="text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg shrink-0"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Mock Test Tracker ────────────────────────────────────────────────────────

function MockTestTracker() {
  const { userId } = useAppStore()
  const [tests, setTests] = useState<MockTestData[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [subjectFilter, setSubjectFilter] = useState<string>("all")
  const [newTest, setNewTest] = useState({
    subject: "",
    topic: "",
    totalMarks: "",
    obtainedMarks: "",
    analysis: "",
    date: new Date().toISOString().split("T")[0],
  })

  const fetchTests = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/mock-tests?userId=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setTests(data)
      }
    } catch {
      toast.error("Failed to fetch tests")
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchTests()
  }, [fetchTests])

  const subjects = [...new Set(tests.map((t) => t.subject))]

  const filtered =
    subjectFilter === "all"
      ? tests
      : tests.filter((t) => t.subject === subjectFilter)

  const handleAddTest = async () => {
    if (
      !userId ||
      !newTest.subject ||
      !newTest.topic ||
      !newTest.totalMarks ||
      !newTest.obtainedMarks
    ) {
      toast.error("Fill required fields")
      return
    }
    const total = parseInt(newTest.totalMarks)
    const obtained = parseInt(newTest.obtainedMarks)
    if (isNaN(total) || isNaN(obtained) || obtained > total) {
      toast.error("Invalid marks")
      return
    }
    try {
      const res = await fetch("/api/mock-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          subject: newTest.subject,
          topic: newTest.topic,
          totalMarks: total,
          obtainedMarks: obtained,
          analysis: newTest.analysis || undefined,
          date: newTest.date || undefined,
        }),
      })
      if (res.ok) {
        toast.success("Test result added!")
        setNewTest({
          subject: "",
          topic: "",
          totalMarks: "",
          obtainedMarks: "",
          analysis: "",
          date: new Date().toISOString().split("T")[0],
        })
        setShowAddForm(false)
        fetchTests()
      } else {
        toast.error("Failed to add test")
      }
    } catch {
      toast.error("Failed to add test")
    }
  }

  // Chart data - tests sorted by date
  const chartData = [...filtered]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((t) => ({
      name: new Date(t.date).toLocaleDateString("en", {
        month: "short",
        day: "numeric",
      }),
      score: Math.round((t.obtainedMarks / t.totalMarks) * 100),
      subject: t.subject,
    }))

  const getScoreColor = (pct: number) => {
    if (pct >= 80) return "text-green-400"
    if (pct >= 60) return "text-yellow-400"
    if (pct >= 40) return "text-orange-400"
    return "text-red-400"
  }

  const getBarColor = (pct: number) => {
    if (pct >= 80) return "#22c55e"
    if (pct >= 60) return "#eab308"
    if (pct >= 40) return "#f97316"
    return "#ef4444"
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-2 items-center">
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          size="sm"
          className="rounded-xl"
        >
          <Plus className="h-4 w-4" /> Add Test
        </Button>
        {subjects.length > 0 && (
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger className="w-[140px] rounded-xl">
              <Filter className="h-3 w-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card p-4 rounded-xl space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  placeholder="Subject *"
                  value={newTest.subject}
                  onChange={(e) =>
                    setNewTest({ ...newTest, subject: e.target.value })
                  }
                  className="rounded-xl"
                />
                <Input
                  placeholder="Topic *"
                  value={newTest.topic}
                  onChange={(e) =>
                    setNewTest({ ...newTest, topic: e.target.value })
                  }
                  className="rounded-xl"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  type="number"
                  placeholder="Total Marks *"
                  value={newTest.totalMarks}
                  onChange={(e) =>
                    setNewTest({ ...newTest, totalMarks: e.target.value })
                  }
                  className="rounded-xl"
                />
                <Input
                  type="number"
                  placeholder="Obtained Marks *"
                  value={newTest.obtainedMarks}
                  onChange={(e) =>
                    setNewTest({ ...newTest, obtainedMarks: e.target.value })
                  }
                  className="rounded-xl"
                />
                <Input
                  type="date"
                  value={newTest.date}
                  onChange={(e) =>
                    setNewTest({ ...newTest, date: e.target.value })
                  }
                  className="rounded-xl"
                />
              </div>
              <Textarea
                placeholder="Analysis (optional)"
                value={newTest.analysis}
                onChange={(e) =>
                  setNewTest({ ...newTest, analysis: e.target.value })
                }
                className="rounded-xl min-h-[50px]"
              />
              <Button onClick={handleAddTest} size="sm" className="rounded-xl">
                Add Test Result
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Performance Chart */}
      {chartData.length > 1 && (
        <div className="glass-card p-4 rounded-xl">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-purple-400" /> Performance Trend
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(15,23,42,0.9)",
                    border: "1px solid rgba(148,163,184,0.1)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => [`${value}%`, "Score"]}
                />
                <Bar
                  dataKey="score"
                  radius={[4, 4, 0, 0]}
                  fill="#8b5cf6"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Test List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 rounded-xl animate-shimmer bg-white/5" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No test results yet. Add one to track your progress!
        </p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filtered.map((test) => {
            const pct = Math.round((test.obtainedMarks / test.totalMarks) * 100)
            return (
              <motion.div
                key={test.id}
                layout
                className="glass-card p-4 rounded-xl"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium">{test.topic}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="secondary" className="text-[10px]">
                        {test.subject}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(test.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <span className={`text-2xl font-bold ${getScoreColor(pct)}`}>
                    {pct}%
                  </span>
                </div>
                {/* Score Bar */}
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="h-full rounded-full progress-gradient"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {test.obtainedMarks} / {test.totalMarks} marks
                </p>
                {test.analysis && (
                  <p className="text-xs text-muted-foreground mt-2 bg-white/5 p-2 rounded-lg">
                    {test.analysis}
                  </p>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Questions Tracker ────────────────────────────────────────────────────────

function QuestionsTracker() {
  const { userId } = useAppStore()
  const [questions, setQuestions] = useState<QuestionData[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [subjectFilter, setSubjectFilter] = useState<string>("all")
  const [resolvedFilter, setResolvedFilter] = useState<string>("all")
  const [newQuestion, setNewQuestion] = useState({
    subject: "",
    title: "",
  })

  const fetchQuestions = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/notes?userId=${userId}`)
      if (res.ok) {
        const allNotes = await res.json()
        // Filter notes that are questions (content starts with {"isQuestion":true)
        const qs: QuestionData[] = allNotes
          .filter(
            (n: { content: string }) =>
              n.content && n.content.startsWith('{"isQuestion":true')
          )
          .map((n: { id: string; userId: string; subject: string; title: string; content: string; isPublic: boolean; createdAt: string; updatedAt: string }) => {
            let parsed = { isQuestion: true, resolved: false }
            try {
              parsed = JSON.parse(n.content)
            } catch {
              /* keep default */
            }
            return { ...n, _resolved: parsed.resolved }
          })
        setQuestions(qs)
      }
    } catch {
      toast.error("Failed to fetch questions")
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  const subjects = [...new Set(questions.map((q) => q.subject))]

  const filtered = questions.filter((q) => {
    if (subjectFilter !== "all" && q.subject !== subjectFilter) return false
    if (resolvedFilter === "resolved" && !q._resolved) return false
    if (resolvedFilter === "unresolved" && q._resolved) return false
    return true
  })

  const handleAddQuestion = async () => {
    if (!userId || !newQuestion.subject || !newQuestion.title) {
      toast.error("Fill all fields")
      return
    }
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          subject: newQuestion.subject,
          title: newQuestion.title,
          content: JSON.stringify({ isQuestion: true, resolved: false }),
        }),
      })
      if (res.ok) {
        toast.success("Question added!")
        setNewQuestion({ subject: "", title: "" })
        setShowAddForm(false)
        fetchQuestions()
      } else {
        toast.error("Failed to add question")
      }
    } catch {
      toast.error("Failed to add question")
    }
  }

  const handleToggleResolved = async (q: QuestionData) => {
    try {
      const newResolved = !q._resolved
      const res = await fetch("/api/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: q.id,
          content: JSON.stringify({ isQuestion: true, resolved: newResolved }),
        }),
      })
      if (res.ok) {
        toast.success(newResolved ? "Marked as resolved!" : "Marked as unresolved")
        fetchQuestions()
      }
    } catch {
      toast.error("Failed to update")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/notes?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Question deleted")
        fetchQuestions()
      }
    } catch {
      toast.error("Failed to delete")
    }
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-2 items-center">
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          size="sm"
          className="rounded-xl"
        >
          <Plus className="h-4 w-4" /> Add Question
        </Button>
        {subjects.length > 0 && (
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger className="w-[140px] rounded-xl">
              <Filter className="h-3 w-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={resolvedFilter} onValueChange={setResolvedFilter}>
          <SelectTrigger className="w-[130px] rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="unresolved">Unresolved</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card p-4 rounded-xl space-y-3">
              <Input
                placeholder="Subject"
                value={newQuestion.subject}
                onChange={(e) =>
                  setNewQuestion({ ...newQuestion, subject: e.target.value })
                }
                className="rounded-xl"
              />
              <Input
                placeholder="Your question"
                value={newQuestion.title}
                onChange={(e) =>
                  setNewQuestion({ ...newQuestion, title: e.target.value })
                }
                className="rounded-xl"
              />
              <Button
                onClick={handleAddQuestion}
                size="sm"
                className="rounded-xl"
              >
                Add Question
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Questions List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-xl animate-shimmer bg-white/5" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No questions yet. Jot down anything you want to ask!
        </p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filtered.map((q) => (
            <motion.div
              key={q.id}
              layout
              className={`glass-card p-3 rounded-xl flex items-center gap-3 ${
                q._resolved ? "opacity-60" : ""
              }`}
            >
              <button
                onClick={() => handleToggleResolved(q)}
                className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                  q._resolved
                    ? "bg-green-600 border-green-600"
                    : "border-muted-foreground/30 hover:border-purple-500"
                }`}
              >
                {q._resolved && <Check className="h-3 w-3 text-white" />}
              </button>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm ${
                    q._resolved ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {q.title}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {q.subject}
                </p>
              </div>
              <button
                onClick={() => handleDelete(q.id)}
                className="p-1 rounded-lg hover:bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Study Time Tracker ───────────────────────────────────────────────────────

function StudyTimeTracker() {
  const { userId } = useAppStore()
  const [logs, setLogs] = useState<StudyLogData[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"daily" | "weekly" | "monthly">(
    "weekly"
  )

  const fetchLogs = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/study-logs?userId=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data)
      }
    } catch {
      toast.error("Failed to fetch study logs")
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Aggregate data based on view mode
  const aggregateData = useCallback(() => {
    const now = new Date()
    const aggregated: { label: string; minutes: number; date: string }[] = []

    if (viewMode === "daily") {
      // Last 14 days
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().split("T")[0]
        const totalMins = logs
          .filter((l) => new Date(l.date).toISOString().split("T")[0] === dateStr)
          .reduce((sum, l) => sum + l.duration, 0)
        aggregated.push({
          label: d.toLocaleDateString("en", { month: "short", day: "numeric" }),
          minutes: totalMins,
          date: dateStr,
        })
      }
    } else if (viewMode === "weekly") {
      // Last 8 weeks
      for (let i = 7; i >= 0; i--) {
        const weekEnd = new Date(now)
        weekEnd.setDate(weekEnd.getDate() - i * 7)
        const weekStart = new Date(weekEnd)
        weekStart.setDate(weekStart.getDate() - 6)
        const totalMins = logs
          .filter((l) => {
            const ld = new Date(l.date)
            return ld >= weekStart && ld <= weekEnd
          })
          .reduce((sum, l) => sum + l.duration, 0)
        aggregated.push({
          label: `W${8 - i}`,
          minutes: totalMins,
          date: weekStart.toISOString().split("T")[0],
        })
      }
    } else {
      // Monthly - last 6 months
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        const totalMins = logs
          .filter((l) => {
            const ld = new Date(l.date)
            const lStr = `${ld.getFullYear()}-${String(ld.getMonth() + 1).padStart(2, "0")}`
            return lStr === monthStr
          })
          .reduce((sum, l) => sum + l.duration, 0)
        aggregated.push({
          label: d.toLocaleDateString("en", { month: "short" }),
          minutes: totalMins,
          date: monthStr,
        })
      }
    }

    return aggregated
  }, [logs, viewMode])

  const chartData = aggregateData()

  // Stats
  const totalMinutes = logs.reduce((sum, l) => sum + l.duration, 0)
  const totalHours = (totalMinutes / 60).toFixed(1)
  const uniqueDays = new Set(
    logs.map((l) => new Date(l.date).toISOString().split("T")[0])
  ).size
  const avgPerDay = uniqueDays > 0 ? (totalMinutes / uniqueDays / 60).toFixed(1) : "0"

  // Best day
  const dayTotals: Record<string, number> = {}
  logs.forEach((l) => {
    const dateStr = new Date(l.date).toISOString().split("T")[0]
    dayTotals[dateStr] = (dayTotals[dateStr] || 0) + l.duration
  })
  const bestDayEntry = Object.entries(dayTotals).sort((a, b) => b[1] - a[1])[0]
  const bestDayHours = bestDayEntry ? (bestDayEntry[1] / 60).toFixed(1) : "0"
  const bestDayLabel = bestDayEntry
    ? new Date(bestDayEntry[0]).toLocaleDateString("en", {
        month: "short",
        day: "numeric",
      })
    : "N/A"

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Total Hours", value: totalHours, color: "text-purple-400" },
          { label: "Avg/Day", value: `${avgPerDay}h`, color: "text-blue-400" },
          { label: "Best Day", value: bestDayHours, sub: bestDayLabel, color: "text-pink-400" },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-3 rounded-xl text-center">
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            {stat.sub && (
              <p className="text-[10px] text-muted-foreground">{stat.sub}</p>
            )}
          </div>
        ))}
      </div>

      {/* View Toggle */}
      <div className="flex gap-1 bg-white/5 p-1 rounded-xl w-fit">
        {(["daily", "weekly", "monthly"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
              viewMode === mode
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Chart */}
      {loading ? (
        <div className="h-48 rounded-xl animate-shimmer bg-white/5" />
      ) : chartData.length === 0 || totalMinutes === 0 ? (
        <div className="h-48 glass-card rounded-xl flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            No study data yet. Start logging study sessions!
          </p>
        </div>
      ) : (
        <div className="glass-card p-4 rounded-xl">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-purple-400" /> Study Time (
            {viewMode})
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(148,163,184,0.1)"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  tickFormatter={(v: number) =>
                    v >= 60 ? `${(v / 60).toFixed(0)}h` : `${v}m`
                  }
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(15,23,42,0.9)",
                    border: "1px solid rgba(148,163,184,0.1)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => {
                    const h = Math.floor(value / 60)
                    const m = value % 60
                    return [h > 0 ? `${h}h ${m}m` : `${m}m`, "Study Time"]
                  }}
                />
                <Bar
                  dataKey="minutes"
                  radius={[4, 4, 0, 0]}
                  fill="#8b5cf6"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Student Tools Component ─────────────────────────────────────────────

const TOOLS = [
  { id: "focus-timer", label: "Focus Timer", icon: <Timer className="h-5 w-5 text-purple-400" /> },
  { id: "flashcards", label: "Flashcards", icon: <Layers className="h-5 w-5 text-blue-400" /> },
  { id: "mistake-log", label: "Mistake Log", icon: <AlertTriangle className="h-5 w-5 text-orange-400" /> },
  { id: "mock-test", label: "Mock Tests", icon: <FileCheck className="h-5 w-5 text-green-400" /> },
  { id: "questions", label: "Questions", icon: <HelpCircle className="h-5 w-5 text-cyan-400" /> },
  { id: "study-time", label: "Study Time", icon: <Clock className="h-5 w-5 text-pink-400" /> },
] as const

type ToolId = (typeof TOOLS)[number]["id"]

export function StudentTools() {
  const [activeTool, setActiveTool] = useState<ToolId>("focus-timer")

  const renderTool = () => {
    switch (activeTool) {
      case "focus-timer":
        return (
          <ToolSection title="Focus Timer" icon={<Timer className="h-5 w-5 text-purple-400" />}>
            <FocusTimer />
          </ToolSection>
        )
      case "flashcards":
        return (
          <ToolSection title="Flashcards" icon={<Layers className="h-5 w-5 text-blue-400" />}>
            <FlashcardTool />
          </ToolSection>
        )
      case "mistake-log":
        return (
          <ToolSection title="Mistake Log" icon={<AlertTriangle className="h-5 w-5 text-orange-400" />}>
            <MistakeLog />
          </ToolSection>
        )
      case "mock-test":
        return (
          <ToolSection title="Mock Test Tracker" icon={<FileCheck className="h-5 w-5 text-green-400" />}>
            <MockTestTracker />
          </ToolSection>
        )
      case "questions":
        return (
          <ToolSection title="Questions Tracker" icon={<HelpCircle className="h-5 w-5 text-cyan-400" />}>
            <QuestionsTracker />
          </ToolSection>
        )
      case "study-time":
        return (
          <ToolSection title="Study Time Tracker" icon={<Clock className="h-5 w-5 text-pink-400" />}>
            <StudyTimeTracker />
          </ToolSection>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold neon-text">Student Tools</h1>
        <p className="text-sm text-muted-foreground mt-1">
          All the tools you need to study smarter
        </p>
      </div>

      {/* Tool Selector Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {TOOLS.map((tool) => (
          <motion.button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${
              activeTool === tool.id
                ? "glass-card neon-glow border-purple-500/30"
                : "glass-card hover:border-purple-500/20"
            }`}
          >
            {tool.icon}
            <span
              className={`text-[10px] sm:text-xs font-medium ${
                activeTool === tool.id ? "text-purple-300" : "text-muted-foreground"
              }`}
            >
              {tool.label}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Active Tool Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTool}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {renderTool()}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
