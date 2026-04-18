"use client"

import { useEffect, useState, useMemo, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  HelpCircle,
  Play,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  ArrowLeft,
  Plus,
  X,
  Trophy,
  Target,
  Zap,
  BookOpen,
  Tag,
  Trash2,
} from "lucide-react"
import { useAppStore } from "@/lib/store"
import { toast } from "sonner"

interface QuizQuestion {
  id: string
  subject: string
  topic: string
  question: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: string
  explanation: string | null
  difficulty: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

type QuizScreen = "selection" | "taking" | "results"

interface QuizAnswer {
  questionId: string
  selectedAnswer: string | null
  isCorrect: boolean
  timeSpent: number
}

export function QuizSystem() {
  const { userId, userRole } = useAppStore()

  // Screen state
  const [screen, setScreen] = useState<QuizScreen>("selection")

  // Selection state
  const [allQuestions, setAllQuestions] = useState<QuizQuestion[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState(true)
  const [selectedSubject, setSelectedSubject] = useState<string>("")
  const [selectedTopic, setSelectedTopic] = useState<string>("")
  const [questionCount, setQuestionCount] = useState<number>(10)

  // Quiz taking state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const [timer, setTimer] = useState(30)
  const [timerActive, setTimerActive] = useState(false)
  const [quizStartTime, setQuizStartTime] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Results state
  const [submittingResults, setSubmittingResults] = useState(false)

  // Admin state
  const [showAdminForm, setShowAdminForm] = useState(false)
  const [adminForm, setAdminForm] = useState({
    subject: "",
    topic: "",
    question: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: "A",
    explanation: "",
    difficulty: "MEDIUM",
  })
  const [submittingQuestion, setSubmittingQuestion] = useState(false)
  const [adminQuestions, setAdminQuestions] = useState<QuizQuestion[]>([])
  const [loadingAdmin, setLoadingAdmin] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Fetch all quiz questions for selection screen
  const fetchAllQuestions = useCallback(async () => {
    try {
      setLoadingQuestions(true)
      const res = await fetch("/api/quiz-questions")
      if (res.ok) {
        const data = await res.json()
        setAllQuestions(data)
      } else {
        toast.error("Failed to fetch quiz questions")
      }
    } catch {
      toast.error("Network error fetching questions")
    } finally {
      setLoadingQuestions(false)
    }
  }, [])

  useEffect(() => {
    fetchAllQuestions()
  }, [fetchAllQuestions])

  // Derive subjects and topics from all questions
  const subjects = useMemo(() => {
    const set = new Set(allQuestions.map((q) => q.subject))
    return Array.from(set).sort()
  }, [allQuestions])

  const topicsForSubject = useMemo(() => {
    if (!selectedSubject) return []
    const set = new Set(
      allQuestions
        .filter((q) => q.subject === selectedSubject)
        .map((q) => q.topic)
    )
    return Array.from(set).sort()
  }, [allQuestions, selectedSubject])

  const availableQuestionCount = useMemo(() => {
    if (!selectedSubject || !selectedTopic) return 0
    return allQuestions.filter(
      (q) => q.subject === selectedSubject && q.topic === selectedTopic
    ).length
  }, [allQuestions, selectedSubject, selectedTopic])

  // Reset topic when subject changes
  useEffect(() => {
    setSelectedTopic("")
  }, [selectedSubject])

  // Timer logic
  useEffect(() => {
    if (timerActive && timer > 0) {
      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            // Time's up — auto-move
            handleTimeUp()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => {
        if (timerRef.current) clearInterval(timerRef.current)
      }
    }
  }, [timerActive, currentIndex])

  const handleTimeUp = useCallback(() => {
    setTimerActive(false)
    if (timerRef.current) clearInterval(timerRef.current)

    // Mark current as unanswered if not yet answered
    setAnswers((prev) => {
      const current = quizQuestions[currentIndex]
      if (!current) return prev
      const existing = prev.find((a) => a.questionId === current.id)
      if (!existing) {
        return [
          ...prev,
          {
            questionId: current.id,
            selectedAnswer: null,
            isCorrect: false,
            timeSpent: 30,
          },
        ]
      }
      return prev
    })

    toast.error("Time's up!")
  }, [quizQuestions, currentIndex])

  // Start quiz
  const startQuiz = async () => {
    if (!selectedSubject || !selectedTopic) {
      toast.error("Please select a subject and topic")
      return
    }
    try {
      const res = await fetch(
        `/api/quiz-questions?subject=${encodeURIComponent(selectedSubject)}&topic=${encodeURIComponent(selectedTopic)}`
      )
      if (res.ok) {
        const data: QuizQuestion[] = await res.json()
        if (data.length === 0) {
          toast.error("No questions available for this topic")
          return
        }
        // Shuffle and limit
        const shuffled = [...data].sort(() => Math.random() - 0.5)
        const limited = shuffled.slice(0, Math.min(questionCount, shuffled.length))
        setQuizQuestions(limited)
        setAnswers([])
        setCurrentIndex(0)
        setTimer(30)
        setTimerActive(true)
        setQuizStartTime(Date.now())
        setScreen("taking")
      } else {
        toast.error("Failed to fetch questions")
      }
    } catch {
      toast.error("Network error")
    }
  }

  // Select answer
  const selectAnswer = (option: string) => {
    if (!timerActive) return
    const current = quizQuestions[currentIndex]
    if (!current) return

    setTimerActive(false)
    if (timerRef.current) clearInterval(timerRef.current)

    const isCorrect = option === current.correctAnswer
    setAnswers((prev) => {
      const filtered = prev.filter((a) => a.questionId !== current.id)
      return [
        ...filtered,
        {
          questionId: current.id,
          selectedAnswer: option,
          isCorrect,
          timeSpent: 30 - timer,
        },
      ]
    })
  }

  // Navigation
  const goToQuestion = (index: number) => {
    if (index < 0 || index >= quizQuestions.length) return
    setCurrentIndex(index)
    setTimer(30)
    setTimerActive(true)
  }

  const nextQuestion = () => {
    if (currentIndex < quizQuestions.length - 1) {
      goToQuestion(currentIndex + 1)
    }
  }

  const prevQuestion = () => {
    if (currentIndex > 0) {
      goToQuestion(currentIndex - 1)
    }
  }

  // Finish quiz
  const finishQuiz = async () => {
    setTimerActive(false)
    if (timerRef.current) clearInterval(timerRef.current)
    setScreen("results")

    // Submit results
    if (!userId) return
    const correctCount = answers.filter((a) => a.isCorrect).length
    const totalQ = quizQuestions.length
    const score = totalQ > 0 ? (correctCount / totalQ) * 100 : 0
    const timeTaken = Math.round((Date.now() - quizStartTime) / 1000)

    setSubmittingResults(true)
    try {
      await fetch("/api/quiz-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          subject: selectedSubject,
          totalQuestions: totalQ,
          correctAnswers: correctCount,
          score,
          timeTaken,
        }),
      })
    } catch {
      // Silently fail — results are still shown
    } finally {
      setSubmittingResults(false)
    }
  }

  // Results computation
  const results = useMemo(() => {
    const correctCount = answers.filter((a) => a.isCorrect).length
    const totalQ = quizQuestions.length
    const score = totalQ > 0 ? (correctCount / totalQ) * 100 : 0
    const timeTaken = Math.round((Date.now() - quizStartTime) / 1000)
    return { correctCount, totalQ, score, timeTaken }
  }, [answers, quizQuestions, quizStartTime])

  // Weak topics detection
  const weakTopics = useMemo(() => {
    const topicStats: Record<string, { correct: number; total: number }> = {}
    quizQuestions.forEach((q) => {
      if (!topicStats[q.topic]) topicStats[q.topic] = { correct: 0, total: 0 }
      topicStats[q.topic].total++
      const answer = answers.find((a) => a.questionId === q.id)
      if (answer?.isCorrect) topicStats[q.topic].correct++
    })
    return Object.entries(topicStats)
      .filter(([, s]) => s.total > 0 && (s.correct / s.total) * 100 < 50)
      .map(([topic, s]) => ({
        topic,
        accuracy: Math.round((s.correct / s.total) * 100),
      }))
  }, [quizQuestions, answers])

  // Admin: fetch questions for management
  const fetchAdminQuestions = useCallback(async () => {
    if (userRole !== "ADMIN") return
    try {
      setLoadingAdmin(true)
      const res = await fetch("/api/quiz-questions")
      if (res.ok) {
        setAdminQuestions(await res.json())
      }
    } catch {
      toast.error("Failed to load admin questions")
    } finally {
      setLoadingAdmin(false)
    }
  }, [userRole])

  useEffect(() => {
    if (userRole === "ADMIN") fetchAdminQuestions()
  }, [userRole, fetchAdminQuestions])

  // Admin: submit new question
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    const f = adminForm
    if (!f.subject || !f.topic || !f.question || !f.optionA || !f.optionB || !f.optionC || !f.optionD || !f.correctAnswer) {
      toast.error("All required fields must be filled")
      return
    }
    setSubmittingQuestion(true)
    try {
      const res = await fetch("/api/quiz-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...f,
          explanation: f.explanation || null,
          createdBy: userId,
        }),
      })
      if (res.ok) {
        toast.success("Question added!")
        setAdminForm({
          subject: "",
          topic: "",
          question: "",
          optionA: "",
          optionB: "",
          optionC: "",
          optionD: "",
          correctAnswer: "A",
          explanation: "",
          difficulty: "MEDIUM",
        })
        fetchAdminQuestions()
        fetchAllQuestions()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to add question")
      }
    } catch {
      toast.error("Network error")
    } finally {
      setSubmittingQuestion(false)
    }
  }

  // Admin: delete question
  const deleteQuestion = async (id: string) => {
    if (!userId) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/quiz-questions?id=${id}&userId=${userId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        toast.success("Question deleted")
        setAdminQuestions((prev) => prev.filter((q) => q.id !== id))
        fetchAllQuestions()
      } else {
        toast.error("Failed to delete question")
      }
    } catch {
      toast.error("Network error")
    } finally {
      setDeletingId(null)
    }
  }

  const retakeQuiz = () => {
    setAnswers([])
    setCurrentIndex(0)
    setTimer(30)
    setTimerActive(true)
    setQuizStartTime(Date.now())
    // Re-shuffle
    const shuffled = [...quizQuestions].sort(() => Math.random() - 0.5)
    setQuizQuestions(shuffled)
    setScreen("taking")
  }

  const backToSelection = () => {
    setScreen("selection")
    setQuizQuestions([])
    setAnswers([])
    setCurrentIndex(0)
    setTimer(30)
    setTimerActive(false)
  }

  // ─────────────────────────── RENDER ───────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold neon-text flex items-center gap-3">
            <HelpCircle className="h-7 w-7" />
            Quiz System
          </h1>
          <p className="text-muted-foreground mt-1">
            Test your knowledge with topic-based MCQs
          </p>
        </div>
        {userRole === "ADMIN" && screen === "selection" && (
          <button
            onClick={() => setShowAdminForm(!showAdminForm)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors"
          >
            {showAdminForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showAdminForm ? "Cancel" : "Add Question"}
          </button>
        )}
      </motion.div>

      {/* Admin Form */}
      <AnimatePresence>
        {showAdminForm && userRole === "ADMIN" && screen === "selection" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleAdminSubmit} className="glass-card p-4 md:p-6 space-y-4">
              <h3 className="font-semibold text-lg neon-text">Add Quiz Question</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Subject *</label>
                  <input
                    type="text"
                    value={adminForm.subject}
                    onChange={(e) => setAdminForm((p) => ({ ...p, subject: e.target.value }))}
                    placeholder="e.g., Mathematics"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Topic *</label>
                  <input
                    type="text"
                    value={adminForm.topic}
                    onChange={(e) => setAdminForm((p) => ({ ...p, topic: e.target.value }))}
                    placeholder="e.g., Calculus"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Difficulty</label>
                  <select
                    value={adminForm.difficulty}
                    onChange={(e) => setAdminForm((p) => ({ ...p, difficulty: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-colors"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Question *</label>
                <textarea
                  value={adminForm.question}
                  onChange={(e) => setAdminForm((p) => ({ ...p, question: e.target.value }))}
                  placeholder="Enter your question..."
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-colors resize-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Option A *</label>
                  <input
                    type="text"
                    value={adminForm.optionA}
                    onChange={(e) => setAdminForm((p) => ({ ...p, optionA: e.target.value }))}
                    placeholder="Option A"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Option B *</label>
                  <input
                    type="text"
                    value={adminForm.optionB}
                    onChange={(e) => setAdminForm((p) => ({ ...p, optionB: e.target.value }))}
                    placeholder="Option B"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Option C *</label>
                  <input
                    type="text"
                    value={adminForm.optionC}
                    onChange={(e) => setAdminForm((p) => ({ ...p, optionC: e.target.value }))}
                    placeholder="Option C"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Option D *</label>
                  <input
                    type="text"
                    value={adminForm.optionD}
                    onChange={(e) => setAdminForm((p) => ({ ...p, optionD: e.target.value }))}
                    placeholder="Option D"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-colors"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Correct Answer *</label>
                  <select
                    value={adminForm.correctAnswer}
                    onChange={(e) => setAdminForm((p) => ({ ...p, correctAnswer: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-colors"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Explanation</label>
                  <input
                    type="text"
                    value={adminForm.explanation}
                    onChange={(e) => setAdminForm((p) => ({ ...p, explanation: e.target.value }))}
                    placeholder="Optional explanation"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-colors"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submittingQuestion}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium text-sm transition-colors"
              >
                {submittingQuestion ? "Adding..." : "Add Question"}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin: Manage Questions */}
      {userRole === "ADMIN" && screen === "selection" && adminQuestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-4 md:p-6"
        >
          <h3 className="font-semibold text-lg neon-text mb-4">Manage Questions</h3>
          {loadingAdmin ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-shimmer rounded-xl bg-white/5" />
              ))}
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-2">
              {adminQuestions.map((q) => (
                <div
                  key={q.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/8 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{q.question}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full">
                        {q.subject}
                      </span>
                      <span className="text-xs text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-full">
                        {q.topic}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Answer: {q.correctAnswer}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteQuestion(q.id)}
                    disabled={deletingId === q.id}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-all shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ─── SELECTION SCREEN ─── */}
      {screen === "selection" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 md:p-8"
        >
          <div className="max-w-lg mx-auto space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-xl font-bold">Start a Quiz</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Choose a subject and topic to begin
              </p>
            </div>

            {/* Subject */}
            <div>
              <label className="text-sm font-medium mb-2 block">Subject</label>
              {loadingQuestions ? (
                <div className="h-11 animate-shimmer rounded-xl" />
              ) : subjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">No subjects available yet</p>
              ) : (
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-colors"
                >
                  <option value="">Select a subject</option>
                  {subjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Topic */}
            <div>
              <label className="text-sm font-medium mb-2 block">Topic</label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                disabled={!selectedSubject}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-colors disabled:opacity-50"
              >
                <option value="">Select a topic</option>
                {topicsForSubject.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Number of questions */}
            <div>
              <label className="text-sm font-medium mb-2 block">Number of Questions</label>
              <div className="flex gap-2">
                {[5, 10, 15, 20].map((n) => (
                  <button
                    key={n}
                    onClick={() => setQuestionCount(n)}
                    disabled={availableQuestionCount > 0 && n > availableQuestionCount}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      questionCount === n
                        ? "bg-purple-600/20 text-purple-300 border border-purple-500/30"
                        : availableQuestionCount > 0 && n > availableQuestionCount
                          ? "bg-white/3 text-muted-foreground/50 cursor-not-allowed border border-transparent"
                          : "bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10 border border-transparent"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              {availableQuestionCount > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {availableQuestionCount} question{availableQuestionCount !== 1 ? "s" : ""} available
                </p>
              )}
            </div>

            {/* Start button */}
            <button
              onClick={startQuiz}
              disabled={!selectedSubject || !selectedTopic}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
            >
              <Play className="h-4 w-4" />
              Start Quiz
            </button>
          </div>
        </motion.div>
      )}

      {/* ─── QUIZ TAKING SCREEN ─── */}
      {screen === "taking" && quizQuestions.length > 0 && (
        <div className="space-y-4">
          {/* Progress bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Question {currentIndex + 1}/{quizQuestions.length}
              </span>
              <div className="flex items-center gap-2">
                <Clock className={`h-4 w-4 ${timer <= 10 ? "text-red-400" : "text-muted-foreground"}`} />
                <span
                  className={`text-sm font-mono font-bold ${
                    timer <= 10 ? "text-red-400" : timer <= 20 ? "text-yellow-400" : "text-green-400"
                  }`}
                >
                  {timer}s
                </span>
              </div>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full rounded-full progress-gradient"
                animate={{
                  width: `${((currentIndex + 1) / quizQuestions.length) * 100}%`,
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
            {/* Timer visual bar */}
            <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className={`h-full rounded-full transition-colors duration-300 ${
                  timer <= 10
                    ? "bg-red-500"
                    : timer <= 20
                      ? "bg-yellow-500"
                      : "bg-green-500"
                }`}
                animate={{ width: `${(timer / 30) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </motion.div>

          {/* Question card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.2 }}
              className="glass-card p-5 md:p-8"
            >
              {/* Question meta */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full">
                  {quizQuestions[currentIndex].subject}
                </span>
                <span className="text-xs text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-full">
                  {quizQuestions[currentIndex].topic}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    quizQuestions[currentIndex].difficulty === "EASY"
                      ? "text-green-300 bg-green-500/10"
                      : quizQuestions[currentIndex].difficulty === "HARD"
                        ? "text-red-300 bg-red-500/10"
                        : "text-yellow-300 bg-yellow-500/10"
                  }`}
                >
                  {quizQuestions[currentIndex].difficulty}
                </span>
              </div>

              {/* Question text */}
              <h2 className="text-lg md:text-xl font-semibold mb-6">
                {quizQuestions[currentIndex].question}
              </h2>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(
                  [
                    { key: "A", text: quizQuestions[currentIndex].optionA },
                    { key: "B", text: quizQuestions[currentIndex].optionB },
                    { key: "C", text: quizQuestions[currentIndex].optionC },
                    { key: "D", text: quizQuestions[currentIndex].optionD },
                  ] as const
                ).map((option) => {
                  const currentAnswer = answers.find(
                    (a) => a.questionId === quizQuestions[currentIndex].id
                  )
                  const isSelected = currentAnswer?.selectedAnswer === option.key
                  const isCorrectOption = quizQuestions[currentIndex].correctAnswer === option.key
                  const isAnswered = !!currentAnswer

                  let optionClass = "glass-card p-4 cursor-pointer transition-all hover:bg-white/8"
                  if (isAnswered) {
                    if (isSelected && isCorrectOption) {
                      optionClass = "p-4 rounded-2xl border-2 border-green-500/50 bg-green-500/10"
                    } else if (isSelected && !isCorrectOption) {
                      optionClass = "p-4 rounded-2xl border-2 border-red-500/50 bg-red-500/10"
                    } else if (isCorrectOption) {
                      optionClass = "p-4 rounded-2xl border-2 border-green-500/50 bg-green-500/10"
                    } else {
                      optionClass = "glass-card p-4 opacity-50"
                    }
                  } else if (isSelected) {
                    optionClass =
                      "p-4 rounded-2xl border-2 border-purple-500/50 bg-purple-500/15 neon-glow"
                  }

                  return (
                    <motion.button
                      key={option.key}
                      onClick={() => !isAnswered && selectAnswer(option.key)}
                      disabled={isAnswered}
                      className={`${optionClass} text-left flex items-center gap-3`}
                      whileHover={!isAnswered ? { scale: 1.01 } : {}}
                      whileTap={!isAnswered ? { scale: 0.99 } : {}}
                    >
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                          isAnswered && isCorrectOption
                            ? "bg-green-500/20 text-green-400"
                            : isAnswered && isSelected && !isCorrectOption
                              ? "bg-red-500/20 text-red-400"
                              : isSelected
                                ? "bg-purple-500/20 text-purple-400"
                                : "bg-white/10 text-muted-foreground"
                        }`}
                      >
                        {option.key}
                      </span>
                      <span className="text-sm">{option.text}</span>
                      {isAnswered && isCorrectOption && (
                        <CheckCircle2 className="h-4 w-4 text-green-400 ml-auto shrink-0" />
                      )}
                      {isAnswered && isSelected && !isCorrectOption && (
                        <XCircle className="h-4 w-4 text-red-400 ml-auto shrink-0" />
                      )}
                    </motion.button>
                  )
                })}
              </div>

              {/* Explanation (shown after answering) */}
              {answers.find((a) => a.questionId === quizQuestions[currentIndex].id) &&
                quizQuestions[currentIndex].explanation && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20"
                  >
                    <p className="text-sm text-blue-300">
                      <strong>Explanation:</strong> {quizQuestions[currentIndex].explanation}
                    </p>
                  </motion.div>
                )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={prevQuestion}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <div className="flex gap-1.5">
              {quizQuestions.map((_, i) => {
                const answered = answers.find((a) => a.questionId === quizQuestions[i].id)
                return (
                  <button
                    key={i}
                    onClick={() => goToQuestion(i)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors flex items-center justify-center ${
                      i === currentIndex
                        ? "bg-purple-600/30 text-purple-300 border border-purple-500/30"
                        : answered?.isCorrect
                          ? "bg-green-500/15 text-green-400"
                          : answered && !answered.isCorrect
                            ? "bg-red-500/15 text-red-400"
                            : "bg-white/5 text-muted-foreground hover:bg-white/10"
                    }`}
                  >
                    {i + 1}
                  </button>
                )
              })}
            </div>

            {currentIndex === quizQuestions.length - 1 ? (
              <button
                onClick={finishQuiz}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-medium transition-colors"
              >
                <Trophy className="h-4 w-4" />
                Finish Quiz
              </button>
            ) : (
              <button
                onClick={nextQuestion}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── RESULTS SCREEN ─── */}
      {screen === "results" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Score card */}
          <div className="glass-card p-6 md:p-8 text-center neon-glow">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"
            >
              <Trophy className="h-12 w-12 text-white" />
            </motion.div>
            <h2 className="text-3xl font-bold neon-text mb-2">Quiz Complete!</h2>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div>
                <p className="text-3xl font-bold text-green-400">
                  {results.correctCount}/{results.totalQ}
                </p>
                <p className="text-xs text-muted-foreground">Correct</p>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div>
                <p className="text-3xl font-bold text-purple-400">
                  {results.score.toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground">Accuracy</p>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div>
                <p className="text-3xl font-bold text-cyan-400">
                  {formatTime(results.timeTaken)}
                </p>
                <p className="text-xs text-muted-foreground">Time</p>
              </div>
            </div>
            {submittingResults && (
              <p className="text-xs text-muted-foreground mt-3">Saving results...</p>
            )}
          </div>

          {/* Weak topics */}
          {weakTopics.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-4 md:p-6 border-yellow-500/20"
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                <h3 className="font-semibold text-yellow-300">Weak Topics Detected</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {weakTopics.map((wt) => (
                  <span
                    key={wt.topic}
                    className="text-sm px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-300 border border-yellow-500/20"
                  >
                    {wt.topic} — {wt.accuracy}% accuracy
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Topics with less than 50% accuracy need more review
              </p>
            </motion.div>
          )}

          {/* Question review */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-4 md:p-6"
          >
            <h3 className="font-semibold text-lg neon-text mb-4">Question Review</h3>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {quizQuestions.map((q, i) => {
                const answer = answers.find((a) => a.questionId === q.id)
                const isCorrect = answer?.isCorrect ?? false
                const wasSkipped = !answer?.selectedAnswer

                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-xl border ${
                      isCorrect
                        ? "bg-green-500/5 border-green-500/20"
                        : "bg-red-500/5 border-red-500/20"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                          isCorrect
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{q.question}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <span className="text-muted-foreground">
                            Your answer:{" "}
                            <span
                              className={
                                isCorrect ? "text-green-400 font-semibold" : "text-red-400 font-semibold"
                              }
                            >
                              {wasSkipped ? "Skipped" : answer?.selectedAnswer}
                            </span>
                          </span>
                          {!isCorrect && (
                            <span className="text-muted-foreground">
                              Correct:{" "}
                              <span className="text-green-400 font-semibold">
                                {q.correctAnswer}
                              </span>
                            </span>
                          )}
                        </div>
                        {q.explanation && (
                          <p className="text-xs text-blue-300 mt-2 bg-blue-500/10 p-2 rounded-lg">
                            {q.explanation}
                          </p>
                        )}
                      </div>
                      {isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-400 shrink-0" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={retakeQuiz}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Retake Quiz
            </button>
            <button
              onClick={backToSelection}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-medium transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Selection
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// Helper
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}
