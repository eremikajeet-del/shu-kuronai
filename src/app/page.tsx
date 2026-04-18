"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { AnimatePresence, motion } from "framer-motion"
import { useAppStore } from "@/lib/store"
import { Providers } from "@/components/providers"
import { Sidebar } from "@/components/sidebar"
import { Dashboard } from "@/components/pages/dashboard"
import { RevisionToday } from "@/components/pages/revision-today"
import { CalendarPage } from "@/components/pages/calendar"
import { AddTopic } from "@/components/pages/add-topic"
import { StudyLog } from "@/components/pages/study-log"
import { StudentTools } from "@/components/pages/student-tools"
import { AiAssistant } from "@/components/pages/ai-assistant"
import { Goals } from "@/components/pages/goals"
import { Analytics } from "@/components/pages/analytics"
import { FormulaHub } from "@/components/pages/formula-hub"
import { QuizSystem } from "@/components/pages/quiz-system"
import { AdminPanel } from "@/components/pages/admin-panel"
import { LoginHero } from "@/components/login-hero"
import { AccountPendingScreen } from "@/components/account-pending"
import { canAccessPage } from "@/lib/rbac"

function AppContent() {
  const { data: session, status } = useSession()
  const { currentPage, setUserId, setUserRole, setUserName, setUserStatus, setSidebarOpen, sidebarOpen, userRole, userStatus } = useAppStore()

  const isLoading = status === "loading"

  // Sync session data to store
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setUserId(session.user.id || null)
      setUserRole((session.user as { role?: string })?.role || "STUDENT")
      setUserName(session.user.name || null)
      setUserStatus((session.user as { status?: string })?.status || "APPROVED")
    }
  }, [session, status, setUserId, setUserRole, setUserName, setUserStatus])

  // Responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [setSidebarOpen])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (status !== "authenticated") {
    return <LoginHero />
  }

  // Check if user status is not approved (non-admin)
  if (userRole !== "ADMIN" && userStatus !== "APPROVED") {
    return <AccountPendingScreen status={userStatus || "PENDING"} />
  }

  // Check page-level permissions
  if (userRole && !canAccessPage(userRole, currentPage)) {
    // Redirect to dashboard if no permission for current page
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="glass-card p-8 rounded-2xl text-center max-w-md">
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don&apos;t have permission to view this page.</p>
        </div>
      </div>
    )
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard": return <Dashboard />
      case "revision-today": return <RevisionToday />
      case "calendar": return <CalendarPage />
      case "add-topic": return <AddTopic />
      case "study-log": return <StudyLog />
      case "student-tools": return <StudentTools />
      case "ai-assistant": return <AiAssistant />
      case "goals": return <Goals />
      case "analytics": return <Analytics />
      case "formula-hub": return <FormulaHub />
      case "quiz": return <QuizSystem />
      case "admin": return <AdminPanel />
      default: return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main
        className="transition-all duration-300"
        style={{ marginLeft: sidebarOpen ? "280px" : "0px" }}
      >
        <div className="p-4 md:p-6 lg:p-8 max-w-[1600px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

export default function Home() {
  return (
    <Providers>
      <AppContent />
    </Providers>
  )
}
