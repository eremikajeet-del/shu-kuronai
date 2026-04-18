"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  PlusCircle,
  BookOpen,
  Trash2,
  Pencil,
  Calendar,
  CheckCircle2,
  X,
  Save,
  Search,
  Sparkles,
  ChevronDown,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { useAppStore } from "@/lib/store"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { format } from "date-fns"

interface Topic {
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
  revisions: RevisionSchedule[]
  _count?: { flashcards: number; quizResults: number }
}

interface RevisionSchedule {
  id: string
  revisionDate: string
  revisionNumber: number
  status: string
  nextRevision: string | null
}

export function AddTopic() {
  const { userId } = useAppStore()

  // Form state
  const [subject, setSubject] = useState("")
  const [topicName, setTopicName] = useState("")
  const [description, setDescription] = useState("")
  const [examDate, setExamDate] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Topics list state
  const [topics, setTopics] = useState<Topic[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Subject autocomplete
  const [subjectSuggestions, setSubjectSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [allSubjects, setAllSubjects] = useState<string[]>([])

  // Edit modal
  const [editTopic, setEditTopic] = useState<Topic | null>(null)
  const [editSubject, setEditSubject] = useState("")
  const [editTopicName, setEditTopicName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editExamDate, setEditExamDate] = useState("")
  const [editStatus, setEditStatus] = useState("")
  const [isEditSaving, setIsEditSaving] = useState(false)

  // Delete confirmation
  const [deleteTopicId, setDeleteTopicId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Search/filter
  const [searchQuery, setSearchQuery] = useState("")

  const fetchTopics = useCallback(async () => {
    if (!userId) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/topics?userId=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setTopics(data)
        // Extract unique subjects
        const subjects = [...new Set(data.map((t: Topic) => t.subject))] as string[]
        setAllSubjects(subjects)
      }
    } catch {
      toast.error("Failed to fetch topics")
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchTopics()
  }, [fetchTopics])

  // Subject autocomplete logic
  useEffect(() => {
    if (subject.length > 0) {
      const filtered = allSubjects.filter(
        (s) => s.toLowerCase().includes(subject.toLowerCase()) && s.toLowerCase() !== subject.toLowerCase()
      )
      setSubjectSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }, [subject, allSubjects])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !subject.trim() || !topicName.trim()) {
      toast.error("Subject and Topic Name are required")
      return
    }
    setIsSubmitting(true)

    try {
      // Create topic
      const topicRes = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          subject: subject.trim(),
          topicName: topicName.trim(),
          description: description.trim() || undefined,
          examDate: examDate || undefined,
        }),
      })

      if (!topicRes.ok) {
        const err = await topicRes.json()
        throw new Error(err.error || "Failed to create topic")
      }

      const newTopic = await topicRes.json()

      // Auto-generate revision schedule
      const revisionRes = await fetch("/api/revisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, topicId: newTopic.id }),
      })

      if (!revisionRes.ok) {
        toast.warning("Topic created but revision schedule generation failed")
      }

      toast.success("Topic created with spaced-repetition schedule!")
      setSubject("")
      setTopicName("")
      setDescription("")
      setExamDate("")
      fetchTopics()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create topic")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTopicId) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/topics/${deleteTopicId}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Topic deleted")
        fetchTopics()
      } else {
        toast.error("Failed to delete topic")
      }
    } catch {
      toast.error("Failed to delete topic")
    } finally {
      setIsDeleting(false)
      setDeleteTopicId(null)
    }
  }

  const handleEdit = (topic: Topic) => {
    setEditTopic(topic)
    setEditSubject(topic.subject)
    setEditTopicName(topic.topicName)
    setEditDescription(topic.description || "")
    setEditExamDate(topic.examDate ? format(new Date(topic.examDate), "yyyy-MM-dd") : "")
    setEditStatus(topic.status)
  }

  const handleEditSave = async () => {
    if (!editTopic) return
    setIsEditSaving(true)
    try {
      const res = await fetch(`/api/topics/${editTopic.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: editSubject.trim(),
          topicName: editTopicName.trim(),
          description: editDescription.trim() || null,
          examDate: editExamDate || null,
          status: editStatus,
        }),
      })
      if (res.ok) {
        toast.success("Topic updated")
        setEditTopic(null)
        fetchTopics()
      } else {
        toast.error("Failed to update topic")
      }
    } catch {
      toast.error("Failed to update topic")
    } finally {
      setIsEditSaving(false)
    }
  }

  const getNextRevisionDate = (topic: Topic): string | null => {
    const pending = topic.revisions
      ?.filter((r) => r.status === "PENDING")
      .sort((a, b) => new Date(a.revisionDate).getTime() - new Date(b.revisionDate).getTime())
    return pending?.[0]?.revisionDate || null
  }

  const getMasteryColor = (mastery: number) => {
    if (mastery >= 80) return "text-emerald-400"
    if (mastery >= 50) return "text-amber-400"
    if (mastery >= 25) return "text-orange-400"
    return "text-red-400"
  }

  const getMasteryBarColor = (mastery: number) => {
    if (mastery >= 80) return "bg-emerald-500"
    if (mastery >= 50) return "bg-amber-500"
    if (mastery >= 25) return "bg-orange-500"
    return "bg-red-500"
  }

  const filteredTopics = topics.filter((t) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      t.subject.toLowerCase().includes(q) ||
      t.topicName.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q))
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
          <PlusCircle className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold neon-text">Add Topic</h1>
          <p className="text-sm text-muted-foreground">Create study topics with auto spaced-repetition scheduling</p>
        </div>
      </motion.div>

      {/* Add Topic Form */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-2 mb-5">
          <Sparkles className="h-4 w-4 text-purple-400" />
          <h2 className="text-lg font-semibold">New Topic</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Subject */}
            <div className="relative">
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Subject *</label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="e.g. Mathematics, Physics..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  onFocus={() => {
                    if (subjectSuggestions.length > 0) setShowSuggestions(true)
                  }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 outline-none transition-all text-sm placeholder:text-muted-foreground"
                  required
                />
                {showSuggestions && (
                  <div className="absolute z-20 w-full mt-1 glass-card p-1 max-h-32 overflow-y-auto">
                    {subjectSuggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onMouseDown={() => {
                          setSubject(s)
                          setShowSuggestions(false)
                        }}
                        className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-white/5 transition-colors flex items-center gap-2"
                      >
                        <ChevronDown className="h-3 w-3 text-muted-foreground rotate-[-90deg]" />
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Topic Name */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Topic Name *</label>
              <input
                type="text"
                placeholder="e.g. Quadratic Equations"
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 outline-none transition-all text-sm placeholder:text-muted-foreground"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Description (optional)</label>
            <textarea
              placeholder="Add notes about this topic..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 outline-none transition-all text-sm placeholder:text-muted-foreground resize-none"
            />
          </div>

          {/* Exam Date & Submit */}
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Exam Date (optional)</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 outline-none transition-all text-sm placeholder:text-muted-foreground"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PlusCircle className="h-4 w-4" />
              )}
              {isSubmitting ? "Creating..." : "Add Topic"}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Topics List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold neon-text">Your Topics</h2>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 outline-none transition-all text-sm placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="glass-card p-8 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
          </div>
        ) : filteredTopics.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {searchQuery ? "No topics match your search" : "No topics yet. Create your first topic above!"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredTopics.map((topic, index) => {
                const nextRev = getNextRevisionDate(topic)
                return (
                  <motion.div
                    key={topic.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.03 }}
                    className="glass-card p-4 hover:border-purple-500/20 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300">
                            {topic.subject}
                          </span>
                          {topic.status === "COMPLETED" && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Done
                            </span>
                          )}
                          {topic.examDate && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(topic.examDate), "MMM d, yyyy")}
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-sm truncate">{topic.topicName}</h3>
                        {topic.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{topic.description}</p>
                        )}

                        {/* Mastery & Next Revision */}
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Mastery</span>
                            <div className="w-24 h-1.5 rounded-full bg-white/5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${getMasteryBarColor(topic.mastery)}`}
                                style={{ width: `${topic.mastery}%` }}
                              />
                            </div>
                            <span className={`text-xs font-medium ${getMasteryColor(topic.mastery)}`}>
                              {topic.mastery}%
                            </span>
                          </div>
                          {nextRev && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Next revision: {format(new Date(nextRev), "MMM d")}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(topic)}
                          className="p-2 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground hover:text-purple-400"
                          title="Edit topic"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTopicId(topic.id)}
                          className="p-2 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground hover:text-red-400"
                          title="Delete topic"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Edit Dialog */}
      <Dialog open={!!editTopic} onOpenChange={(open) => !open && setEditTopic(null)}>
        <DialogContent className="glass-card border-white/10">
          <DialogHeader>
            <DialogTitle className="neon-text">Edit Topic</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Subject</label>
              <input
                type="text"
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 outline-none transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Topic Name</label>
              <input
                type="text"
                value={editTopicName}
                onChange={(e) => setEditTopicName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 outline-none transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Description</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 outline-none transition-all text-sm resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Exam Date</label>
                <input
                  type="date"
                  value={editExamDate}
                  onChange={(e) => setEditExamDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 outline-none transition-all text-sm"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="PAUSED">Paused</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <button
              onClick={() => setEditTopic(null)}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-colors flex items-center gap-2"
            >
              <X className="h-4 w-4" /> Cancel
            </button>
            <button
              onClick={handleEditSave}
              disabled={isEditSaving}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              {isEditSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTopicId} onOpenChange={(open) => !open && setDeleteTopicId(null)}>
        <DialogContent className="glass-card border-white/10 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-400">Delete Topic</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this topic? This will also remove all associated revision schedules. This action cannot be undone.
          </p>
          <DialogFooter className="mt-4 gap-2">
            <button
              onClick={() => setDeleteTopicId(null)}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
