"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, Lock, ArrowRight, Sparkles, Clock, XCircle, Info } from "lucide-react"
import { toast } from "sonner"

export function LoginHero() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: "pending" | "rejected" | "info"; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatusMessage(null)

    try {
      if (isLogin) {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        })
        if (result?.error) {
          // Check for status-related errors
          if (result.error.startsWith("ACCOUNT_PENDING")) {
            const msg = result.error.split(":").slice(1).join(":")
            setStatusMessage({ type: "pending", text: msg })
            toast.error("Account pending approval")
          } else if (result.error.startsWith("ACCOUNT_REJECTED")) {
            const msg = result.error.split(":").slice(1).join(":")
            setStatusMessage({ type: "rejected", text: msg })
            toast.error("Account was rejected")
          } else {
            toast.error("Invalid credentials")
          }
        }
      } else {
        // Register
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, username }),
        })
        const data = await res.json()
        if (res.ok) {
          if (data.status === "PENDING") {
            setStatusMessage({
              type: "info",
              text: "Account created! Your registration is pending admin approval. You'll receive access once approved.",
            })
            toast.success("Account created! Awaiting admin approval.")
            setIsLogin(true)
          } else {
            toast.success("Account created and auto-approved! Please sign in.")
            setIsLogin(true)
          }
        } else {
          toast.error(data.error || "Registration failed")
        }
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setLoading(false)
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
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-purple-400/30"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="relative w-24 h-24 mx-auto mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-2 border-transparent"
              style={{
                borderImage: "linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899) 1",
              }}
            />
            <div className="absolute inset-1 rounded-full border border-purple-500/30" />
            <div className="absolute inset-2 rounded-full border border-blue-500/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20"
              >
                <span className="text-white font-bold text-2xl">A</span>
              </motion.div>
            </div>
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute inset-[-8px] rounded-full border border-dashed border-purple-500/20"
            />
          </div>
          <h1 className="text-4xl font-bold neon-text mb-2">Mr.ADHD</h1>
          <p className="text-muted-foreground">AI-Powered Study Tracker</p>
        </motion.div>

        {/* Auth Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass-card p-8"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? "login" : "register"}
              initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-xl font-semibold mb-1">
                {isLogin ? "Welcome back" : "Create account"}
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                {isLogin ? "Sign in to continue studying" : "Start your study journey"}
              </p>

              {/* Status Message Banner */}
              <AnimatePresence>
                {statusMessage && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 overflow-hidden"
                  >
                    <div className={`flex items-start gap-3 p-4 rounded-xl border ${
                      statusMessage.type === "pending"
                        ? "bg-yellow-500/10 border-yellow-500/20"
                        : statusMessage.type === "rejected"
                        ? "bg-red-500/10 border-red-500/20"
                        : "bg-purple-500/10 border-purple-500/20"
                    }`}>
                      {statusMessage.type === "pending" ? (
                        <Clock className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
                      ) : statusMessage.type === "rejected" ? (
                        <XCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                      ) : (
                        <Info className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
                      )}
                      <p className="text-sm leading-relaxed">{statusMessage.text}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="relative">
                    <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 outline-none transition-all text-sm placeholder:text-muted-foreground"
                      required
                    />
                  </div>
                )}
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 outline-none transition-all text-sm placeholder:text-muted-foreground"
                    required
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 outline-none transition-all text-sm placeholder:text-muted-foreground"
                    required
                    minLength={6}
                  />
                </div>
                {!isLogin && (
                  <p className="text-xs text-muted-foreground">
                    New accounts require admin approval before access is granted.
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <>
                      {isLogin ? "Sign In" : "Create Account"}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => { setIsLogin(!isLogin); setStatusMessage(null) }}
                  className="text-sm text-muted-foreground hover:text-purple-400 transition-colors"
                >
                  {isLogin
                    ? "Don't have an account? Sign up"
                    : "Already have an account? Sign in"}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Demo credentials hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-xs text-muted-foreground mt-4"
        >
          Admin: eremikajeet@gmail.com / Mr.Robot
        </motion.p>
      </div>
    </div>
  )
}
