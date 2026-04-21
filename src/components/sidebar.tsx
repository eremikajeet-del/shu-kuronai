"use client"

import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useSession, signOut } from "next-auth/react"
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  PlusCircle,
  Clock,
  Wrench,
  Bot,
  Target,
  BarChart3,
  FlaskConical,
  HelpCircle,
  Shield,
  LogOut,
  Menu,
  X,
  User,
  ChevronRight,
} from "lucide-react"
import { useAppStore, type PageId } from "@/lib/store"
import { cn } from "@/lib/utils"

const mainNavItems: { id: PageId; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  { id: "revision-today", label: "Revision Today", icon: <BookOpen className="h-5 w-5" /> },
  { id: "calendar", label: "Calendar", icon: <Calendar className="h-5 w-5" /> },
  { id: "add-topic", label: "Add Topic", icon: <PlusCircle className="h-5 w-5" /> },
  { id: "study-log", label: "Study Log", icon: <Clock className="h-5 w-5" /> },
]

const toolsNavItems: { id: PageId; label: string; icon: React.ReactNode }[] = [
  { id: "student-tools", label: "Student Tools", icon: <Wrench className="h-5 w-5" /> },
  { id: "formula-hub", label: "Formula Hub", icon: <FlaskConical className="h-5 w-5" /> },
  { id: "quiz", label: "Quiz", icon: <HelpCircle className="h-5 w-5" /> },
  { id: "analytics", label: "Analytics", icon: <BarChart3 className="h-5 w-5" /> },
  { id: "goals", label: "Goals", icon: <Target className="h-5 w-5" /> },
  { id: "ai-assistant", label: "AI Assistant", icon: <Bot className="h-5 w-5" /> },
]

const adminNavItems: { id: PageId; label: string; icon: React.ReactNode }[] = [
  { id: "admin", label: "Admin Panel", icon: <Shield className="h-5 w-5" /> },
]

export function Sidebar() {
  const { currentPage, setCurrentPage, sidebarOpen, setSidebarOpen, userName, userRole } = useAppStore()
  const { data: session } = useSession()

  const navItems =
    userRole === "ADMIN"
      ? [...mainNavItems, ...toolsNavItems, ...adminNavItems]
      : [...mainNavItems, ...toolsNavItems]

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden glass-card p-2 rounded-xl"
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -320 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={cn(
          "fixed top-0 left-0 h-screen z-50 w-[280px]",
          "gradient-sidebar border-r border-[rgba(148,163,184,0.08)]",
          "flex flex-col"
        )}
      >
        {/* Logo */}
        <div className="p-6 pb-4">
          <h1 className="font-bold text-lg neon-text">Mr.ADHD</h1>
          <p className="text-xs text-muted-foreground">Study Tracker</p>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-6">
          {/* Main */}
          <div>
            <p className="text-xs text-muted-foreground px-3 mb-2">Main</p>
            <nav className="space-y-1">
              {mainNavItems.map((item) => (
                <NavButton
                  key={item.id}
                  item={item}
                  isActive={currentPage === item.id}
                  onClick={() => setCurrentPage(item.id)}
                />
              ))}
            </nav>
          </div>

          {/* Tools */}
          <div>
            <p className="text-xs text-muted-foreground px-3 mb-2">Tools</p>
            <nav className="space-y-1">
              {toolsNavItems.map((item) => (
                <NavButton
                  key={item.id}
                  item={item}
                  isActive={currentPage === item.id}
                  onClick={() => setCurrentPage(item.id)}
                />
              ))}
            </nav>
          </div>

          {/* Admin */}
          {userRole === "ADMIN" && (
            <div>
              <p className="text-xs text-muted-foreground px-3 mb-2">Admin</p>
              <nav className="space-y-1">
                {adminNavItems.map((item) => (
                  <NavButton
                    key={item.id}
                    item={item}
                    isActive={currentPage === item.id}
                    onClick={() => setCurrentPage(item.id)}
                  />
                ))}
              </nav>
            </div>
          )}
        </div>

        {/* User */}
        <div className="p-4 border-t border-[rgba(148,163,184,0.08)]">
          <div className="flex items-center gap-3">
            <User className="h-4 w-4" />
            <div>
              <p>{userName || session?.user?.name || "Student"}</p>
              <p className="text-xs text-muted-foreground">
                {userRole === "ADMIN" ? "Admin" : "Student"}
              </p>
            </div>
            <button onClick={() => signOut()}>
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  )
}

function NavButton({ item, isActive, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 rounded-lg",
        isActive
          ? "bg-purple-500/20 text-purple-300"
          : "text-muted-foreground hover:bg-white/5"
      )}
    >
      {item.icon}
      {item.label}
    </button>
  )
}