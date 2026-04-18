"use client"

import { motion } from "framer-motion"
import { signOut } from "next-auth/react"
import { Clock, XCircle, LogOut, RefreshCw } from "lucide-react"
import { getStatusMessage, USER_STATUS } from "@/lib/rbac"
import { toast } from "sonner"
import { useState } from "react"

export function AccountPendingScreen({ status }: { status: string }) {
  const [checking, setChecking] = useState(false)
  const statusInfo = getStatusMessage(status)

  const handleCheckStatus = async () => {
    setChecking(true)
    try {
      // Sign out and let user re-login to check updated status
      await signOut({ callbackUrl: "/" })
    } catch {
      toast.error("Failed to refresh status")
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/3 rounded-full blur-3xl" />
      </div>

      {/* Floating particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-purple-400/20"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.1, 0.4, 0.1],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md px-6"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 opacity-80 blur-[2px]" />
            <div className="relative rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 w-20 h-20 flex items-center justify-center">
              <span className="text-white font-bold text-3xl">A</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold neon-text mb-1">Mr.ADHD</h1>
          <p className="text-sm text-muted-foreground">Study Tracker</p>
        </div>

        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="glass-card p-8"
        >
          {/* Status Icon */}
          <div className="flex justify-center mb-6">
            {status === USER_STATUS.PENDING ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center border-2 border-yellow-500/20"
              >
                <Clock className="h-10 w-10 text-yellow-400" />
              </motion.div>
            ) : status === USER_STATUS.REJECTED ? (
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center border-2 border-red-500/20"
              >
                <XCircle className="h-10 w-10 text-red-400" />
              </motion.div>
            ) : null}
          </div>

          {/* Status Badge */}
          <div className="flex justify-center mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
              status === USER_STATUS.PENDING
                ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20"
                : "bg-red-500/15 text-red-400 border border-red-500/20"
            }`}>
              {status === USER_STATUS.PENDING ? "🟡 Pending" : "🔴 Rejected"}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-center mb-2">
            {statusInfo.title}
          </h2>

          {/* Message */}
          <p className="text-sm text-muted-foreground text-center leading-relaxed mb-6">
            {statusInfo.message}
          </p>

          {/* Actions */}
          <div className="space-y-3">
            {status === USER_STATUS.PENDING && (
              <button
                onClick={handleCheckStatus}
                disabled={checking}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {checking ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Check Status Again
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-foreground font-medium text-sm flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </motion.div>

        {/* Help text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-xs text-muted-foreground mt-4"
        >
          Need help? Contact: eremikajeet@gmail.com
        </motion.p>
      </motion.div>
    </div>
  )
}
