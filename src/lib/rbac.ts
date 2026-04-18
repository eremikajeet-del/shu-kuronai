// ── Role-Based Access Control System ──────────────────────────────────────────
// Scalable RBAC architecture that's easy to extend for future roles

export const ROLES = {
  STUDENT: "STUDENT",
  ADMIN: "ADMIN",
  TEACHER: "TEACHER",  // Future role
  PREMIUM: "PREMIUM",  // Future role
} as const

export const USER_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const

export type Role = typeof ROLES[keyof typeof ROLES]
export type UserStatus = typeof USER_STATUS[keyof typeof USER_STATUS]

// ── Permission Definitions ────────────────────────────────────────────────────

export const PERMISSIONS = {
  // Dashboard
  VIEW_DASHBOARD: "VIEW_DASHBOARD",
  
  // Study tools
  USE_STUDY_TOOLS: "USE_STUDY_TOOLS",
  ADD_TOPIC: "ADD_TOPIC",
  LOG_STUDY: "LOG_STUDY",
  VIEW_REVISIONS: "VIEW_REVISIONS",
  COMPLETE_REVISIONS: "COMPLETE_REVISIONS",
  USE_FLASHCARDS: "USE_FLASHCARDS",
  USE_FOCUS_TIMER: "USE_FOCUS_TIMER",
  TAKE_QUIZ: "TAKE_QUIZ",
  VIEW_FORMULAS: "VIEW_FORMULAS",
  VIEW_ANALYTICS: "VIEW_ANALYTICS",
  MANAGE_GOALS: "MANAGE_GOALS",
  USE_AI_ASSISTANT: "USE_AI_ASSISTANT",
  
  // Admin
  MANAGE_USERS: "MANAGE_USERS",
  APPROVE_USERS: "APPROVE_USERS",
  MANAGE_CONTENT: "MANAGE_CONTENT",
  VIEW_ADMIN_PANEL: "VIEW_ADMIN_PANEL",
  TOGGLE_AUTO_APPROVE: "TOGGLE_AUTO_APPROVE",
  
  // Teacher (future)
  CREATE_QUIZZES: "CREATE_QUIZZES",
  VIEW_STUDENT_PROGRESS: "VIEW_STUDENT_PROGRESS",
  
  // Premium (future)
  ACCESS_PREMIUM_CONTENT: "ACCESS_PREMIUM_CONTENT",
  UNLIMITED_AI: "UNLIMITED_AI",
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

// ── Role-Permission Mapping ───────────────────────────────────────────────────

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  STUDENT: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.USE_STUDY_TOOLS,
    PERMISSIONS.ADD_TOPIC,
    PERMISSIONS.LOG_STUDY,
    PERMISSIONS.VIEW_REVISIONS,
    PERMISSIONS.COMPLETE_REVISIONS,
    PERMISSIONS.USE_FLASHCARDS,
    PERMISSIONS.USE_FOCUS_TIMER,
    PERMISSIONS.TAKE_QUIZ,
    PERMISSIONS.VIEW_FORMULAS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.MANAGE_GOALS,
    PERMISSIONS.USE_AI_ASSISTANT,
  ],
  ADMIN: [
    // Admin has ALL permissions
    ...Object.values(PERMISSIONS),
  ],
  TEACHER: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.USE_STUDY_TOOLS,
    PERMISSIONS.VIEW_REVISIONS,
    PERMISSIONS.VIEW_FORMULAS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.CREATE_QUIZZES,
    PERMISSIONS.VIEW_STUDENT_PROGRESS,
    PERMISSIONS.MANAGE_CONTENT,
  ],
  PREMIUM: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.USE_STUDY_TOOLS,
    PERMISSIONS.ADD_TOPIC,
    PERMISSIONS.LOG_STUDY,
    PERMISSIONS.VIEW_REVISIONS,
    PERMISSIONS.COMPLETE_REVISIONS,
    PERMISSIONS.USE_FLASHCARDS,
    PERMISSIONS.USE_FOCUS_TIMER,
    PERMISSIONS.TAKE_QUIZ,
    PERMISSIONS.VIEW_FORMULAS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.MANAGE_GOALS,
    PERMISSIONS.USE_AI_ASSISTANT,
    PERMISSIONS.ACCESS_PREMIUM_CONTENT,
    PERMISSIONS.UNLIMITED_AI,
  ],
}

// ── Permission Checker ────────────────────────────────────────────────────────

export function hasPermission(role: string, permission: Permission): boolean {
  const rolePerms = ROLE_PERMISSIONS[role as Role]
  if (!rolePerms) return false
  return rolePerms.includes(permission)
}

export function hasAnyPermission(role: string, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p))
}

export function hasAllPermissions(role: string, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(role, p))
}

// ── Status Access Control ─────────────────────────────────────────────────────

export function canAccessApp(status: string): boolean {
  return status === USER_STATUS.APPROVED
}

export function getStatusMessage(status: string): { title: string; message: string; icon: "clock" | "x" | "check" } {
  switch (status) {
    case USER_STATUS.PENDING:
      return {
        title: "Account Under Review",
        message: "Your account is awaiting admin approval. You'll get full access once approved. Please check back soon!",
        icon: "clock",
      }
    case USER_STATUS.REJECTED:
      return {
        title: "Access Denied",
        message: "Your registration was not approved. Please contact the administrator at eremikajeet@gmail.com for more information.",
        icon: "x",
      }
    case USER_STATUS.APPROVED:
      return {
        title: "Welcome!",
        message: "Your account is approved. Enjoy your study journey!",
        icon: "check",
      }
    default:
      return {
        title: "Unknown Status",
        message: "Please contact support.",
        icon: "clock",
      }
  }
}

// ── Page Access Rules ─────────────────────────────────────────────────────────

export const PAGE_PERMISSIONS: Record<string, Permission[]> = {
  dashboard: [PERMISSIONS.VIEW_DASHBOARD],
  "revision-today": [PERMISSIONS.VIEW_REVISIONS],
  calendar: [PERMISSIONS.VIEW_REVISIONS],
  "add-topic": [PERMISSIONS.ADD_TOPIC],
  "study-log": [PERMISSIONS.LOG_STUDY],
  "student-tools": [PERMISSIONS.USE_STUDY_TOOLS],
  "formula-hub": [PERMISSIONS.VIEW_FORMULAS],
  quiz: [PERMISSIONS.TAKE_QUIZ],
  analytics: [PERMISSIONS.VIEW_ANALYTICS],
  goals: [PERMISSIONS.MANAGE_GOALS],
  "ai-assistant": [PERMISSIONS.USE_AI_ASSISTANT],
  admin: [PERMISSIONS.VIEW_ADMIN_PANEL],
}

export function canAccessPage(role: string, pageId: string): boolean {
  const required = PAGE_PERMISSIONS[pageId]
  if (!required) return true // If no permissions defined, allow access
  return hasAllPermissions(role, required)
}
