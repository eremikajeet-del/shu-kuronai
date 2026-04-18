"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  FlaskConical,
  Search,
  CheckCircle2,
  BookOpen,
  Plus,
  Trash2,
  X,
  ChevronDown,
  Filter,
  GraduationCap,
  Tag,
} from "lucide-react"
import { useAppStore } from "@/lib/store"
import { toast } from "sonner"

interface Formula {
  id: string
  subject: string
  title: string
  content: string
  category: string | null
  isLearned: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

type FilterMode = "all" | "learned" | "not-learned"

export function FormulaHub() {
  const { userId, userRole } = useAppStore()
  const [formulas, setFormulas] = useState<Formula[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSubject, setActiveSubject] = useState<string>("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterMode, setFilterMode] = useState<FilterMode>("all")
  const [showAdminForm, setShowAdminForm] = useState(false)
  const [adminForm, setAdminForm] = useState({
    subject: "",
    title: "",
    content: "",
    category: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchFormulas = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/formulas")
      if (res.ok) {
        const data = await res.json()
        setFormulas(data)
      } else {
        toast.error("Failed to fetch formulas")
      }
    } catch {
      toast.error("Network error fetching formulas")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFormulas()
  }, [fetchFormulas])

  const subjects = useMemo(() => {
    const set = new Set(formulas.map((f) => f.subject))
    return ["All", ...Array.from(set).sort()]
  }, [formulas])

  const filteredFormulas = useMemo(() => {
    return formulas.filter((f) => {
      if (activeSubject !== "All" && f.subject !== activeSubject) return false
      if (filterMode === "learned" && !f.isLearned) return false
      if (filterMode === "not-learned" && f.isLearned) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          f.title.toLowerCase().includes(q) ||
          f.content.toLowerCase().includes(q) ||
          (f.category && f.category.toLowerCase().includes(q))
        )
      }
      return true
    })
  }, [formulas, activeSubject, filterMode, searchQuery])

  const statsBySubject = useMemo(() => {
    const map: Record<string, { total: number; learned: number }> = {}
    formulas.forEach((f) => {
      if (!map[f.subject]) map[f.subject] = { total: 0, learned: 0 }
      map[f.subject].total++
      if (f.isLearned) map[f.subject].learned++
    })
    return map
  }, [formulas])

  const overallStats = useMemo(() => {
    const total = formulas.length
    const learned = formulas.filter((f) => f.isLearned).length
    return { total, learned }
  }, [formulas])

  const toggleLearned = async (formula: Formula) => {
    const newLearned = !formula.isLearned
    const prevFormulas = [...formulas]
    setFormulas((prev) =>
      prev.map((f) => (f.id === formula.id ? { ...f, isLearned: newLearned } : f))
    )
    try {
      const res = await fetch("/api/formulas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: formula.id, isLearned: newLearned }),
      })
      if (!res.ok) {
        setFormulas(prevFormulas)
        toast.error("Failed to update formula")
      } else {
        toast.success(newLearned ? "Marked as learned!" : "Unmarked as learned")
      }
    } catch {
      setFormulas(prevFormulas)
      toast.error("Network error")
    }
  }

  const deleteFormula = async (id: string) => {
    if (!userId) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/formulas?id=${id}&userId=${userId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setFormulas((prev) => prev.filter((f) => f.id !== id))
        toast.success("Formula deleted")
      } else {
        toast.error("Failed to delete formula")
      }
    } catch {
      toast.error("Network error")
    } finally {
      setDeletingId(null)
    }
  }

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !adminForm.subject || !adminForm.title || !adminForm.content) {
      toast.error("Subject, title, and content are required")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/formulas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: adminForm.subject,
          title: adminForm.title,
          content: adminForm.content,
          category: adminForm.category || null,
          createdBy: userId,
        }),
      })
      if (res.ok) {
        toast.success("Formula added!")
        setAdminForm({ subject: "", title: "", content: "", category: "" })
        setShowAdminForm(false)
        fetchFormulas()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to add formula")
      }
    } catch {
      toast.error("Network error")
    } finally {
      setSubmitting(false)
    }
  }

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
            <FlaskConical className="h-7 w-7" />
            Formula Hub
          </h1>
          <p className="text-muted-foreground mt-1">
            Reference library for all your study formulas
          </p>
        </div>
        {userRole === "ADMIN" && (
          <button
            onClick={() => setShowAdminForm(!showAdminForm)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors"
          >
            {showAdminForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showAdminForm ? "Cancel" : "Add Formula"}
          </button>
        )}
      </motion.div>

      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-card p-4 md:p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-5 w-5 text-purple-400" />
            <span className="text-sm font-medium">
              {overallStats.learned}/{overallStats.total} formulas learned
            </span>
          </div>
          <div className="flex-1 max-w-xs">
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full rounded-full progress-gradient"
                initial={{ width: 0 }}
                animate={{
                  width: overallStats.total > 0
                    ? `${(overallStats.learned / overallStats.total) * 100}%`
                    : "0%",
                }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        {/* Per-subject progress */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(statsBySubject).map(([subject, stats]) => (
            <div key={subject} className="flex items-center gap-3 text-xs">
              <span className="text-muted-foreground min-w-[80px] truncate">{subject}</span>
              <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  className="h-full rounded-full progress-gradient"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(stats.learned / stats.total) * 100}%`,
                  }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
              <span className="text-muted-foreground whitespace-nowrap">
                {stats.learned}/{stats.total}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Admin Form */}
      <AnimatePresence>
        {showAdminForm && userRole === "ADMIN" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleAdminSubmit} className="glass-card p-4 md:p-6 space-y-4">
              <h3 className="font-semibold text-lg neon-text">Add New Formula</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Subject *</label>
                  <input
                    type="text"
                    value={adminForm.subject}
                    onChange={(e) => setAdminForm((p) => ({ ...p, subject: e.target.value }))}
                    placeholder="e.g., Physics"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Category</label>
                  <input
                    type="text"
                    value={adminForm.category}
                    onChange={(e) => setAdminForm((p) => ({ ...p, category: e.target.value }))}
                    placeholder="e.g., Mechanics"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Title *</label>
                <input
                  type="text"
                  value={adminForm.title}
                  onChange={(e) => setAdminForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g., Newton's Second Law"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-colors"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Content *</label>
                <textarea
                  value={adminForm.content}
                  onChange={(e) => setAdminForm((p) => ({ ...p, content: e.target.value }))}
                  placeholder="e.g., F = ma"
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-colors resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium text-sm transition-colors"
              >
                {submitting ? "Adding..." : "Add Formula"}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search formulas by title or content..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {(["all", "learned", "not-learned"] as FilterMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                filterMode === mode
                  ? "bg-purple-600/20 text-purple-300 border border-purple-500/30"
                  : "bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10 border border-transparent"
              }`}
            >
              {mode === "all" ? "All" : mode === "learned" ? "Learned" : "Not Learned"}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Subject Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-none"
      >
        {subjects.map((subject) => {
          const count = subject === "All"
            ? formulas.length
            : statsBySubject[subject]?.total || 0
          return (
            <button
              key={subject}
              onClick={() => setActiveSubject(subject)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeSubject === subject
                  ? "bg-purple-600/20 text-purple-300 border border-purple-500/30 neon-glow"
                  : "glass-card text-muted-foreground hover:text-foreground"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              {subject}
              <span className="text-xs opacity-60">({count})</span>
            </button>
          )
        })}
      </motion.div>

      {/* Formula Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-card p-5 animate-shimmer rounded-2xl h-40" />
          ))}
        </div>
      ) : filteredFormulas.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-12 text-center"
        >
          <FlaskConical className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No formulas found</h3>
          <p className="text-muted-foreground text-sm">
            {searchQuery
              ? "Try a different search term"
              : "Formulas will appear here once they are added"}
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredFormulas.map((formula, index) => (
              <motion.div
                key={formula.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.03 }}
                className={`glass-card p-5 group relative transition-all hover:neon-glow ${
                  formula.isLearned
                    ? "border-green-500/20"
                    : "border-yellow-500/10"
                }`}
              >
                {/* Learned badge */}
                {formula.isLearned && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                  </div>
                )}

                {/* Admin delete button */}
                {userRole === "ADMIN" && (
                  <button
                    onClick={() => deleteFormula(formula.id)}
                    disabled={deletingId === formula.id}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-all"
                    title="Delete formula"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}

                {/* Category badge */}
                {formula.category && (
                  <div className="flex items-center gap-1.5 mb-3">
                    <Tag className="h-3 w-3 text-purple-400" />
                    <span className="text-xs text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full">
                      {formula.category}
                    </span>
                  </div>
                )}

                {/* Title */}
                <h4 className="font-semibold text-sm mb-2 pr-8">{formula.title}</h4>

                {/* Content */}
                <div className="bg-white/5 rounded-lg p-3 mb-4">
                  <p className="text-sm font-mono text-cyan-300 whitespace-pre-wrap break-words">
                    {formula.content}
                  </p>
                </div>

                {/* Subject */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{formula.subject}</span>

                  {/* Learned toggle */}
                  <button
                    onClick={() => toggleLearned(formula)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      formula.isLearned
                        ? "bg-green-500/15 text-green-400 hover:bg-green-500/25"
                        : "bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20"
                    }`}
                  >
                    {formula.isLearned ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Learned
                      </>
                    ) : (
                      <>
                        <BookOpen className="h-3.5 w-3.5" />
                        Mark Learned
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
