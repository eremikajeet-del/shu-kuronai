import { create } from "zustand"

export type PageId =
  | "dashboard"
  | "revision-today"
  | "calendar"
  | "add-topic"
  | "study-log"
  | "student-tools"
  | "ai-assistant"
  | "goals"
  | "analytics"
  | "formula-hub"
  | "quiz"
  | "admin"
  | "flashcards"
  | "focus-timer"
  | "mistake-log"
  | "mock-test"
  | "notes"
  | "questions"

interface AppState {
  currentPage: PageId
  setCurrentPage: (page: PageId) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  userId: string | null
  setUserId: (id: string | null) => void
  userRole: string | null
  setUserRole: (role: string | null) => void
  userName: string | null
  setUserName: (name: string | null) => void
  userStatus: string | null
  setUserStatus: (status: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: "dashboard",
  setCurrentPage: (page) => set({ currentPage: page }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  userId: null,
  setUserId: (id) => set({ userId: id }),
  userRole: null,
  setUserRole: (role) => set({ userRole: role }),
  userName: null,
  setUserName: (name) => set({ userName: name }),
  userStatus: null,
  setUserStatus: (status) => set({ userStatus: status }),
}))
