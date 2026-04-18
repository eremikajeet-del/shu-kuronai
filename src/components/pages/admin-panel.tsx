"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Plus,
  Search,
  FileText,
  HelpCircle,
  Layers,
  FlaskConical,
  FolderOpen,
  ToggleLeft,
  ToggleRight,
  UserCheck,
  UserX,
  AlertTriangle,
} from "lucide-react"
import { useAppStore } from "@/lib/store"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// ─── Types ───────────────────────────────────────────────────────────────────

interface UserRow {
  id: string
  email: string
  username: string
  name: string | null
  role: string
  status: string
  avatar: string | null
  xp: number
  level: number
  streak: number
  autoApprove: boolean
  createdAt: string
  _count: { topics: number; studyLogs: number; flashcards: number; quizResults: number; revisions: number }
}

interface StatusCounts {
  PENDING: number
  APPROVED: number
  REJECTED: number
  total: number
}

interface NoteRow {
  id: string
  subject: string
  title: string
  content: string
  isPublic: boolean
  createdAt: string
}

interface QuizQuestionRow {
  id: string
  subject: string
  topic: string
  question: string
  correctAnswer: string
  difficulty: string
  createdAt: string
}

interface FlashcardRow {
  id: string
  subject: string
  front: string
  back: string
  isLearned: boolean
  createdAt: string
}

interface FormulaRow {
  id: string
  subject: string
  title: string
  content: string
  category: string | null
  isLearned: boolean
  createdAt: string
}

interface FileRow {
  id: string
  name: string
  url: string
  type: string
  subject: string | null
  size: number
  createdAt: string
  user?: { username: string }
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function AdminPanel() {
  const { userId, userRole } = useAppStore()

  if (userRole !== "ADMIN") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="glass-card p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold neon-text mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You need admin privileges to access this panel.</p>
        </div>
      </div>
    )
  }

  return <AdminPanelContent userId={userId!} />
}

// ─── Inner Content ──────────────────────────────────────────────────────────

function AdminPanelContent({ userId }: { userId: string }) {
  const [mainTab, setMainTab] = useState("users")

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold neon-text">Admin Panel</h1>
        <p className="text-muted-foreground mt-1">Manage users, content, and system data</p>
      </motion.div>

      {/* Main Tabs: User Management | Content Management */}
      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList className="bg-white/5 border border-white/10 w-full flex h-auto p-1 gap-1">
          <TabsTrigger
            value="users"
            className="flex items-center gap-2 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 data-[state=active]:shadow-none rounded-2xl px-4 py-2.5 text-sm font-medium flex-1"
          >
            <Users className="h-4 w-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger
            value="content"
            className="flex items-center gap-2 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 data-[state=active]:shadow-none rounded-2xl px-4 py-2.5 text-sm font-medium flex-1"
          >
            <Shield className="h-4 w-4" />
            Content Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UserManagementSection userId={userId} />
        </TabsContent>

        <TabsContent value="content">
          <ContentManagementSection userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER MANAGEMENT SECTION
// ═══════════════════════════════════════════════════════════════════════════════

function UserManagementSection({ userId }: { userId: string }) {
  const [users, setUsers] = useState<UserRow[]>([])
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({ PENDING: 0, APPROVED: 0, REJECTED: 0, total: 0 })
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [userSearch, setUserSearch] = useState("")
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [autoApprove, setAutoApprove] = useState(false)
  const [togglingAutoApprove, setTogglingAutoApprove] = useState(false)
  const [showUserDelete, setShowUserDelete] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchUsers = useCallback(async (filter?: string) => {
    setLoadingUsers(true)
    try {
      const currentFilter = filter || statusFilter
      const statusParam = currentFilter === "ALL" ? "" : `&status=${currentFilter}`
      const res = await fetch(`/api/users?userId=${userId}${statusParam}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
        if (data.statusCounts) {
          setStatusCounts(data.statusCounts)
        }
        // Check if the current user's autoApprove is on
        const currentUser = (data.users || []).find((u: UserRow) => u.id === userId)
        if (currentUser) {
          setAutoApprove(currentUser.autoApprove)
        }
      }
    } catch {
      toast.error("Failed to fetch users")
    } finally {
      setLoadingUsers(false)
    }
  }, [userId, statusFilter])

  // Fetch on mount
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Refetch when filter changes
  const handleFilterChange = (filter: string) => {
    setStatusFilter(filter)
    fetchUsers(filter)
  }

  const toggleAutoApprove = async () => {
    setTogglingAutoApprove(true)
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId: userId, targetId: userId, action: "TOGGLE_AUTO_APPROVE" }),
      })
      if (res.ok) {
        const data = await res.json()
        setAutoApprove(data.autoApprove)
        toast.success(data.autoApprove ? "Auto-approve enabled" : "Auto-approve disabled")
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to toggle auto-approve")
      }
    } catch {
      toast.error("Failed to toggle auto-approve")
    } finally {
      setTogglingAutoApprove(false)
    }
  }

  const approveUser = async (targetId: string) => {
    setActionLoading(targetId)
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId: userId, targetId, action: "APPROVE" }),
      })
      if (res.ok) {
        toast.success("User approved")
        fetchUsers()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to approve user")
      }
    } catch {
      toast.error("Failed to approve user")
    } finally {
      setActionLoading(null)
    }
  }

  const rejectUser = async (targetId: string) => {
    setActionLoading(targetId)
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId: userId, targetId, action: "REJECT" }),
      })
      if (res.ok) {
        toast.success("User rejected")
        fetchUsers()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to reject user")
      }
    } catch {
      toast.error("Failed to reject user")
    } finally {
      setActionLoading(null)
    }
  }

  const deleteUser = async (targetId: string) => {
    try {
      const res = await fetch(`/api/users?userId=${userId}&targetId=${targetId}`, { method: "DELETE" })
      const data = await res.json()
      if (res.ok) {
        toast.success("User deleted")
        setUsers((prev) => prev.filter((u) => u.id !== targetId))
        // Refresh counts
        fetchUsers()
      } else {
        toast.error(data.error || "Failed to delete user")
      }
    } catch {
      toast.error("Failed to delete user")
    }
    setShowUserDelete(null)
  }

  // Filter users by search
  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  )

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    } catch {
      return d
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge className="bg-yellow-500/15 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/20">
            🟡 Pending
          </Badge>
        )
      case "APPROVED":
        return (
          <Badge className="bg-green-500/15 text-green-400 border-green-500/30 hover:bg-green-500/20">
            🟢 Approved
          </Badge>
        )
      case "REJECTED":
        return (
          <Badge className="bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/20">
            🔴 Rejected
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const filterButtons = [
    { key: "ALL", label: "All", count: statusCounts.total },
    { key: "PENDING", label: "Pending", icon: "🟡", count: statusCounts.PENDING },
    { key: "APPROVED", label: "Approved", icon: "🟢", count: statusCounts.APPROVED },
    { key: "REJECTED", label: "Rejected", icon: "🔴", count: statusCounts.REJECTED },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Auto-Approve Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          {autoApprove ? (
            <ToggleRight className="h-6 w-6 text-green-400" />
          ) : (
            <ToggleLeft className="h-6 w-6 text-muted-foreground" />
          )}
          <div>
            <h3 className="font-semibold text-sm">Auto-approve new users</h3>
            <p className="text-xs text-muted-foreground">
              New registrations will be automatically approved
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            className={
              autoApprove
                ? "bg-green-500/15 text-green-400 border-green-500/30"
                : "bg-red-500/15 text-red-400 border-red-500/30"
            }
          >
            {autoApprove ? "ON" : "OFF"}
          </Badge>
          <Switch
            checked={autoApprove}
            onCheckedChange={toggleAutoApprove}
            disabled={togglingAutoApprove}
          />
        </div>
      </motion.div>

      {/* Status Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-card p-4"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            {filterButtons.map((btn) => (
              <Button
                key={btn.key}
                variant={statusFilter === btn.key ? "default" : "ghost"}
                size="sm"
                onClick={() => handleFilterChange(btn.key)}
                className={`rounded-2xl text-xs ${
                  statusFilter === btn.key
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "hover:bg-white/5"
                }`}
              >
                {btn.icon && <span className="mr-1">{btn.icon}</span>}
                {btn.label}
                <span className="ml-1.5 text-[10px] opacity-70">({btn.count})</span>
              </Button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 rounded-2xl"
            />
          </div>
        </div>
      </motion.div>

      {/* User Cards */}
      {loadingUsers ? (
        <LoadingSpinner />
      ) : filteredUsers.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No users found</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 max-h-[600px] overflow-y-auto pr-1">
          <AnimatePresence mode="popLayout">
            {filteredUsers.map((u, i) => (
              <motion.div
                key={u.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.03 }}
                className="glass-card p-5 space-y-4 hover:border-purple-500/20 transition-colors"
              >
                {/* Header: Username + Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm truncate">{u.username}</h3>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant={u.role === "ADMIN" ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {u.role === "ADMIN" ? "👑 ADMIN" : u.role}
                    </Badge>
                    {getStatusBadge(u.status)}
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white/5 rounded-xl p-2 text-center">
                    <p className="text-lg font-bold text-purple-400">{u.xp.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">XP</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-2 text-center">
                    <p className="text-lg font-bold text-cyan-400">{u.level}</p>
                    <p className="text-[10px] text-muted-foreground">Level</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-2 text-center">
                    <p className="text-lg font-bold text-orange-400">{u.streak}d</p>
                    <p className="text-[10px] text-muted-foreground">Streak</p>
                  </div>
                </div>

                {/* Study Counts */}
                <div className="flex items-center gap-2 flex-wrap text-[10px] text-muted-foreground">
                  <span className="bg-white/5 px-2 py-1 rounded-lg">{u._count.topics} topics</span>
                  <span className="bg-white/5 px-2 py-1 rounded-lg">{u._count.studyLogs} logs</span>
                  <span className="bg-white/5 px-2 py-1 rounded-lg">{u._count.flashcards} cards</span>
                  <span className="bg-white/5 px-2 py-1 rounded-lg">{u._count.quizResults} quizzes</span>
                </div>

                {/* Joined Date */}
                <p className="text-[10px] text-muted-foreground">
                  Joined {formatDate(u.createdAt)}
                </p>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-white/5">
                  {u.status === "PENDING" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => approveUser(u.id)}
                        disabled={actionLoading === u.id}
                        className="bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs h-8"
                      >
                        <UserCheck className="h-3.5 w-3.5 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => rejectUser(u.id)}
                        disabled={actionLoading === u.id}
                        className="bg-red-600/80 hover:bg-red-600 text-white rounded-xl text-xs h-8"
                      >
                        <UserX className="h-3.5 w-3.5 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                  {u.status === "APPROVED" && u.id !== userId && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => rejectUser(u.id)}
                      disabled={actionLoading === u.id}
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl text-xs h-8"
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Reject
                    </Button>
                  )}
                  {u.status === "REJECTED" && (
                    <Button
                      size="sm"
                      onClick={() => approveUser(u.id)}
                      disabled={actionLoading === u.id}
                      className="bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs h-8"
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      Approve
                    </Button>
                  )}
                  {u.id !== userId && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowUserDelete(u.id)}
                      disabled={actionLoading === u.id}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl text-xs h-8 ml-auto"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showUserDelete} onOpenChange={() => setShowUserDelete(null)}>
        <DialogContent className="bg-[#0f172a] border-white/10">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure? This will permanently delete the user and all their data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowUserDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => showUserDelete && deleteUser(showUserDelete)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTENT MANAGEMENT SECTION
// ═══════════════════════════════════════════════════════════════════════════════

function ContentManagementSection({ userId }: { userId: string }) {
  const [contentTab, setContentTab] = useState("notes")

  const contentTabItems = [
    { value: "notes", label: "Notes", icon: <FileText className="h-4 w-4" /> },
    { value: "quiz", label: "Quizzes", icon: <HelpCircle className="h-4 w-4" /> },
    { value: "flashcards", label: "Flashcards", icon: <Layers className="h-4 w-4" /> },
    { value: "formulas", label: "Formulas", icon: <FlaskConical className="h-4 w-4" /> },
    { value: "files", label: "Files", icon: <FolderOpen className="h-4 w-4" /> },
  ]

  return (
    <Tabs value={contentTab} onValueChange={setContentTab}>
      <div className="overflow-x-auto pb-2 -mx-2 px-2">
        <TabsList className="bg-white/5 border border-white/10 w-full flex h-auto p-1 gap-1">
          {contentTabItems.map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="flex items-center gap-1.5 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 data-[state=active]:shadow-none rounded-2xl px-3 py-2 text-xs sm:text-sm"
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <TabsContent value="notes">
        <NotesTab userId={userId} />
      </TabsContent>
      <TabsContent value="quiz">
        <QuizTab userId={userId} />
      </TabsContent>
      <TabsContent value="flashcards">
        <FlashcardsTab userId={userId} />
      </TabsContent>
      <TabsContent value="formulas">
        <FormulasTab userId={userId} />
      </TabsContent>
      <TabsContent value="files">
        <FilesTab userId={userId} />
      </TabsContent>
    </Tabs>
  )
}

// ─── Notes Tab ──────────────────────────────────────────────────────────────

function NotesTab({ userId }: { userId: string }) {
  const [notes, setNotes] = useState<NoteRow[]>([])
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [showDelete, setShowDelete] = useState<string | null>(null)
  const [subject, setSubject] = useState("")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchNotes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/notes?userId=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setNotes(Array.isArray(data) ? data : [])
      }
    } catch {
      toast.error("Failed to fetch notes")
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { fetchNotes() }, [fetchNotes])

  const handleAdd = async () => {
    if (!subject || !title || !content) {
      toast.error("Subject, title, and content are required")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, subject, title, content, isPublic }),
      })
      if (res.ok) {
        toast.success("Note created")
        fetchNotes()
        setShowAdd(false)
        setSubject(""); setTitle(""); setContent(""); setIsPublic(false)
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to create note")
      }
    } catch {
      toast.error("Failed to create note")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/notes?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Note deleted")
        setNotes((prev) => prev.filter((n) => n.id !== id))
      } else {
        toast.error("Failed to delete note")
      }
    } catch {
      toast.error("Failed to delete note")
    }
    setShowDelete(null)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-semibold neon-text">Notes</h2>
        <Button onClick={() => setShowAdd(true)} className="bg-purple-600 hover:bg-purple-700 rounded-2xl">
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>

      {loading ? <LoadingSpinner /> : notes.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">No notes found</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-h-[500px] overflow-y-auto">
          {notes.map((n) => (
            <div key={n.id} className="glass-card p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm truncate">{n.title}</h3>
                  <p className="text-xs text-muted-foreground">{n.subject}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowDelete(n.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{n.content}</p>
              <Badge variant={n.isPublic ? "default" : "secondary"} className="text-[10px]">
                {n.isPublic ? "Public" : "Private"}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* Add Note Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-[#0f172a] border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="neon-text">Add Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Physics" className="bg-white/5 border-white/10" />
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note title" className="bg-white/5 border-white/10" />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Note content..." className="bg-white/5 border-white/10 min-h-[100px]" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
              <Label>Public</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
              {saving ? "Saving..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!showDelete} onOpenChange={() => setShowDelete(null)}>
        <DialogContent className="bg-[#0f172a] border-white/10">
          <DialogHeader>
            <DialogTitle>Delete Note</DialogTitle>
            <DialogDescription>Are you sure you want to delete this note?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => showDelete && handleDelete(showDelete)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

// ─── Quiz Tab ───────────────────────────────────────────────────────────────

function QuizTab({ userId }: { userId: string }) {
  const [questions, setQuestions] = useState<QuizQuestionRow[]>([])
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [showDelete, setShowDelete] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [qSubject, setQSubject] = useState("")
  const [qTopic, setQTopic] = useState("")
  const [qQuestion, setQQuestion] = useState("")
  const [qA, setQA] = useState("")
  const [qB, setQB] = useState("")
  const [qC, setQC] = useState("")
  const [qD, setQD] = useState("")
  const [qAnswer, setQAnswer] = useState("A")
  const [qExplanation, setQExplanation] = useState("")
  const [qDifficulty, setQDifficulty] = useState("MEDIUM")

  const fetchQuestions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/quiz-questions")
      if (res.ok) {
        const data = await res.json()
        setQuestions(Array.isArray(data) ? data : [])
      }
    } catch {
      toast.error("Failed to fetch quiz questions")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchQuestions() }, [fetchQuestions])

  const handleAdd = async () => {
    if (!qSubject || !qTopic || !qQuestion || !qA || !qB || !qC || !qD) {
      toast.error("All fields except explanation are required")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/quiz-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: qSubject, topic: qTopic, question: qQuestion,
          optionA: qA, optionB: qB, optionC: qC, optionD: qD,
          correctAnswer: qAnswer, explanation: qExplanation || null,
          difficulty: qDifficulty, createdBy: userId,
        }),
      })
      if (res.ok) {
        toast.success("Quiz question created")
        fetchQuestions()
        setShowAdd(false)
        setQSubject(""); setQTopic(""); setQQuestion(""); setQA(""); setQB(""); setQC(""); setQD("")
        setQAnswer("A"); setQExplanation(""); setQDifficulty("MEDIUM")
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to create quiz question")
      }
    } catch {
      toast.error("Failed to create quiz question")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/quiz-questions?id=${id}&userId=${userId}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Quiz question deleted")
        setQuestions((prev) => prev.filter((q) => q.id !== id))
      } else {
        toast.error("Failed to delete quiz question")
      }
    } catch {
      toast.error("Failed to delete quiz question")
    }
    setShowDelete(null)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-semibold neon-text">Quiz Questions</h2>
        <Button onClick={() => setShowAdd(true)} className="bg-purple-600 hover:bg-purple-700 rounded-2xl">
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>

      {loading ? <LoadingSpinner /> : questions.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">No quiz questions found</div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {questions.map((q) => (
            <div key={q.id} className="glass-card p-4 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-[10px]">{q.subject}</Badge>
                  <Badge
                    variant={q.difficulty === "EASY" ? "secondary" : q.difficulty === "HARD" ? "destructive" : "default"}
                    className="text-[10px]"
                  >
                    {q.difficulty}
                  </Badge>
                </div>
                <p className="text-sm truncate">{q.question}</p>
                <p className="text-xs text-muted-foreground">Answer: {q.correctAnswer} • Topic: {q.topic}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowDelete(q.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add Quiz Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-[#0f172a] border-white/10 max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="neon-text">Add Quiz Question</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input value={qSubject} onChange={(e) => setQSubject(e.target.value)} placeholder="e.g. Physics" className="bg-white/5 border-white/10" />
              </div>
              <div className="space-y-2">
                <Label>Topic</Label>
                <Input value={qTopic} onChange={(e) => setQTopic(e.target.value)} placeholder="e.g. Mechanics" className="bg-white/5 border-white/10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Question</Label>
              <Textarea value={qQuestion} onChange={(e) => setQQuestion(e.target.value)} placeholder="Enter the question..." className="bg-white/5 border-white/10" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Option A</Label>
                <Input value={qA} onChange={(e) => setQA(e.target.value)} className="bg-white/5 border-white/10" />
              </div>
              <div className="space-y-2">
                <Label>Option B</Label>
                <Input value={qB} onChange={(e) => setQB(e.target.value)} className="bg-white/5 border-white/10" />
              </div>
              <div className="space-y-2">
                <Label>Option C</Label>
                <Input value={qC} onChange={(e) => setQC(e.target.value)} className="bg-white/5 border-white/10" />
              </div>
              <div className="space-y-2">
                <Label>Option D</Label>
                <Input value={qD} onChange={(e) => setQD(e.target.value)} className="bg-white/5 border-white/10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Correct Answer</Label>
                <Select value={qAnswer} onValueChange={setQAnswer}>
                  <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                    <SelectItem value="D">D</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={qDifficulty} onValueChange={setQDifficulty}>
                  <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EASY">Easy</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HARD">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Explanation (optional)</Label>
              <Textarea value={qExplanation} onChange={(e) => setQExplanation(e.target.value)} className="bg-white/5 border-white/10" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
              {saving ? "Saving..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!showDelete} onOpenChange={() => setShowDelete(null)}>
        <DialogContent className="bg-[#0f172a] border-white/10">
          <DialogHeader>
            <DialogTitle>Delete Quiz Question</DialogTitle>
            <DialogDescription>Are you sure you want to delete this quiz question?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => showDelete && handleDelete(showDelete)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

// ─── Flashcards Tab ─────────────────────────────────────────────────────────

function FlashcardsTab({ userId }: { userId: string }) {
  const [flashcards, setFlashcards] = useState<FlashcardRow[]>([])
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [showDelete, setShowDelete] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [fSubject, setFSubject] = useState("")
  const [fFront, setFFront] = useState("")
  const [fBack, setFBack] = useState("")

  const fetchFlashcards = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/flashcards?userId=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setFlashcards(Array.isArray(data) ? data : [])
      }
    } catch {
      toast.error("Failed to fetch flashcards")
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { fetchFlashcards() }, [fetchFlashcards])

  const handleAdd = async () => {
    if (!fSubject || !fFront || !fBack) {
      toast.error("Subject, front, and back are required")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, subject: fSubject, front: fFront, back: fBack }),
      })
      if (res.ok) {
        toast.success("Flashcard created")
        fetchFlashcards()
        setShowAdd(false)
        setFSubject(""); setFFront(""); setFBack("")
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to create flashcard")
      }
    } catch {
      toast.error("Failed to create flashcard")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/flashcards/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Flashcard deleted")
        setFlashcards((prev) => prev.filter((f) => f.id !== id))
      } else {
        toast.error("Failed to delete flashcard")
      }
    } catch {
      toast.error("Failed to delete flashcard")
    }
    setShowDelete(null)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-semibold neon-text">Flashcards</h2>
        <Button onClick={() => setShowAdd(true)} className="bg-purple-600 hover:bg-purple-700 rounded-2xl">
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>

      {loading ? <LoadingSpinner /> : flashcards.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">No flashcards found</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-h-[500px] overflow-y-auto">
          {flashcards.map((f) => (
            <div key={f.id} className="glass-card p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <Badge variant="outline" className="text-xs">{f.subject}</Badge>
                <Button variant="ghost" size="sm" onClick={() => setShowDelete(f.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="text-sm font-medium line-clamp-2">{f.front}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{f.back}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add Flashcard Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-[#0f172a] border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="neon-text">Add Flashcard</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input value={fSubject} onChange={(e) => setFSubject(e.target.value)} placeholder="e.g. Physics" className="bg-white/5 border-white/10" />
            </div>
            <div className="space-y-2">
              <Label>Front</Label>
              <Textarea value={fFront} onChange={(e) => setFFront(e.target.value)} placeholder="Front side..." className="bg-white/5 border-white/10" />
            </div>
            <div className="space-y-2">
              <Label>Back</Label>
              <Textarea value={fBack} onChange={(e) => setFBack(e.target.value)} placeholder="Back side..." className="bg-white/5 border-white/10" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
              {saving ? "Saving..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!showDelete} onOpenChange={() => setShowDelete(null)}>
        <DialogContent className="bg-[#0f172a] border-white/10">
          <DialogHeader>
            <DialogTitle>Delete Flashcard</DialogTitle>
            <DialogDescription>Are you sure you want to delete this flashcard?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => showDelete && handleDelete(showDelete)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

// ─── Formulas Tab ───────────────────────────────────────────────────────────

function FormulasTab({ userId }: { userId: string }) {
  const [formulas, setFormulas] = useState<FormulaRow[]>([])
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [showDelete, setShowDelete] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [fmSubject, setFmSubject] = useState("")
  const [fmTitle, setFmTitle] = useState("")
  const [fmContent, setFmContent] = useState("")
  const [fmCategory, setFmCategory] = useState("")

  const fetchFormulas = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/formulas")
      if (res.ok) {
        const data = await res.json()
        setFormulas(Array.isArray(data) ? data : [])
      }
    } catch {
      toast.error("Failed to fetch formulas")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchFormulas() }, [fetchFormulas])

  const handleAdd = async () => {
    if (!fmSubject || !fmTitle || !fmContent) {
      toast.error("Subject, title, and content are required")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/formulas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: fmSubject, title: fmTitle, content: fmContent,
          category: fmCategory || null, createdBy: userId,
        }),
      })
      if (res.ok) {
        toast.success("Formula created")
        fetchFormulas()
        setShowAdd(false)
        setFmSubject(""); setFmTitle(""); setFmContent(""); setFmCategory("")
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to create formula")
      }
    } catch {
      toast.error("Failed to create formula")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/formulas?id=${id}&userId=${userId}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Formula deleted")
        setFormulas((prev) => prev.filter((f) => f.id !== id))
      } else {
        toast.error("Failed to delete formula")
      }
    } catch {
      toast.error("Failed to delete formula")
    }
    setShowDelete(null)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-semibold neon-text">Formulas</h2>
        <Button onClick={() => setShowAdd(true)} className="bg-purple-600 hover:bg-purple-700 rounded-2xl">
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>

      {loading ? <LoadingSpinner /> : formulas.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">No formulas found</div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {formulas.map((f) => (
            <div key={f.id} className="glass-card p-4 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-[10px]">{f.subject}</Badge>
                  {f.category && <span className="text-[10px] text-muted-foreground">{f.category}</span>}
                </div>
                <p className="text-sm font-medium">{f.title}</p>
                <p className="text-xs text-muted-foreground font-mono line-clamp-1">{f.content}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowDelete(f.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add Formula Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-[#0f172a] border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="neon-text">Add Formula</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input value={fmSubject} onChange={(e) => setFmSubject(e.target.value)} placeholder="e.g. Physics" className="bg-white/5 border-white/10" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input value={fmCategory} onChange={(e) => setFmCategory(e.target.value)} placeholder="e.g. Mechanics" className="bg-white/5 border-white/10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={fmTitle} onChange={(e) => setFmTitle(e.target.value)} placeholder="Formula title" className="bg-white/5 border-white/10" />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea value={fmContent} onChange={(e) => setFmContent(e.target.value)} placeholder="Formula content (e.g. E = mc²)" className="bg-white/5 border-white/10 min-h-[80px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
              {saving ? "Saving..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!showDelete} onOpenChange={() => setShowDelete(null)}>
        <DialogContent className="bg-[#0f172a] border-white/10">
          <DialogHeader>
            <DialogTitle>Delete Formula</DialogTitle>
            <DialogDescription>Are you sure you want to delete this formula?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => showDelete && handleDelete(showDelete)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

// ─── Files Tab ──────────────────────────────────────────────────────────────

function FilesTab({ userId }: { userId: string }) {
  const [files, setFiles] = useState<FileRow[]>([])
  const [loading, setLoading] = useState(false)
  const [showDelete, setShowDelete] = useState<string | null>(null)

  const fetchFiles = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/files?admin=true&requesterId=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setFiles(Array.isArray(data) ? data : [])
      }
    } catch {
      toast.error("Failed to fetch files")
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { fetchFiles() }, [fetchFiles])

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/files?id=${id}&userId=${userId}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("File deleted")
        setFiles((prev) => prev.filter((f) => f.id !== id))
      } else {
        toast.error("Failed to delete file")
      }
    } catch {
      toast.error("Failed to delete file")
    }
    setShowDelete(null)
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    } catch {
      return d
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
      <h2 className="text-xl font-semibold neon-text mb-6">Files</h2>

      {loading ? <LoadingSpinner /> : files.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">No files found</div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {files.map((f) => (
            <div key={f.id} className="glass-card p-4 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <FolderOpen className="h-4 w-4 text-purple-400 shrink-0" />
                  <p className="text-sm font-medium truncate">{f.name}</p>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span>{f.type || "unknown"}</span>
                  <span>{formatSize(f.size)}</span>
                  {f.subject && <span>{f.subject}</span>}
                  <span>{formatDate(f.createdAt)}</span>
                  {f.user && <span>by {f.user.username}</span>}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowDelete(f.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={!!showDelete} onOpenChange={() => setShowDelete(null)}>
        <DialogContent className="bg-[#0f172a] border-white/10">
          <DialogHeader>
            <DialogTitle>Delete File</DialogTitle>
            <DialogDescription>Are you sure you want to delete this file?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => showDelete && handleDelete(showDelete)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

// ─── Loading Spinner ────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"
      />
    </div>
  )
}
