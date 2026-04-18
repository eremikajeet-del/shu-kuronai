"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import ReactMarkdown from "react-markdown"
import {
  Bot,
  Send,
  Trash2,
  Copy,
  Check,
  Loader2,
  Sparkles,
  BookOpen,
  Lightbulb,
  HelpCircle,
  FileText,
  MessageSquare,
} from "lucide-react"
import { useAppStore } from "@/lib/store"
import { toast } from "sonner"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  timestamp: number
}

const QUICK_ACTIONS = [
  {
    label: "Explain a concept",
    icon: <Lightbulb className="h-3.5 w-3.5" />,
    prompt: "Explain a concept",
    response: "What concept would you like me to explain? Please tell me the subject and topic, and I'll break it down for you!",
  },
  {
    label: "Generate study notes",
    icon: <FileText className="h-3.5 w-3.5" />,
    prompt: "Generate study notes",
    response: "What subject/topic should I generate notes for? I'll create organized study notes with key points and summaries!",
  },
  {
    label: "Study tips",
    icon: <Sparkles className="h-3.5 w-3.5" />,
    prompt: "Study tips",
    response: `Here are some effective study tips:

**1. Active Recall** - Instead of re-reading, test yourself on the material. This strengthens memory pathways.

**2. Spaced Repetition** - Review material at increasing intervals (1 day, 3 days, 7 days, etc.) to combat the forgetting curve.

**3. Pomodoro Technique** - Study for 25 minutes, then take a 5-minute break. After 4 cycles, take a longer 15-30 minute break.

**4. Teach Someone Else** - Explaining concepts to others (or even to yourself) reveals gaps in understanding.

**5. Interleaving** - Mix different subjects or problem types in a single study session for better retention.

**6. Mind Mapping** - Create visual diagrams connecting related concepts to see the big picture.

**7. Sleep Well** - Sleep consolidates memories. Aim for 7-9 hours, especially before exams.

**8. Practice Problems** - For math and science, active problem-solving beats passive reading every time.

Would you like me to elaborate on any of these techniques?`,
  },
  {
    label: "Quiz me",
    icon: <HelpCircle className="h-3.5 w-3.5" />,
    prompt: "Quiz me",
    response: "What subject should I quiz you on? Tell me the topic and difficulty level, and I'll create some practice questions for you!",
  },
  {
    label: "Summarize topic",
    icon: <BookOpen className="h-3.5 w-3.5" />,
    prompt: "Summarize topic",
    response: "What topic would you like summarized? Give me the subject and specific area, and I'll provide a concise summary with key takeaways!",
  },
]

export function AiAssistant() {
  const { userId } = useAppStore()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, scrollToBottom])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMessage: ChatMessage = {
      role: "user",
      content: text.trim(),
      timestamp: Date.now(),
    }

    setMessages((prev) => {
      const updated = [...prev, userMessage]
      return updated.slice(-20)
    })
    setInput("")
    setIsLoading(true)

    try {
      const history = messages.slice(-19).map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          conversationHistory: history,
          userId,
        }),
      })

      if (!res.ok) throw new Error("Failed to get response")

      const data = await res.json()

      const aiMessage: ChatMessage = {
        role: "assistant",
        content: data.response || "I couldn't generate a response. Please try again.",
        timestamp: Date.now(),
      }

      setMessages((prev) => {
        const updated = [...prev, aiMessage]
        return updated.slice(-20)
      })
    } catch {
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, errorMessage])
      toast.error("Failed to get AI response")
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickAction = (action: (typeof QUICK_ACTIONS)[number]) => {
    const userMessage: ChatMessage = {
      role: "user",
      content: action.prompt,
      timestamp: Date.now(),
    }

    setMessages((prev) => {
      const updated = [...prev, userMessage]
      return updated.slice(-20)
    })
    setInput("")

    // For "Study tips", we use the preset response
    // For others, we call the AI
    if (action.prompt === "Study tips") {
      const aiMessage: ChatMessage = {
        role: "assistant",
        content: action.response,
        timestamp: Date.now(),
      }
      setTimeout(() => {
        setMessages((prev) => {
          const updated = [...prev, aiMessage]
          return updated.slice(-20)
        })
      }, 600)
    } else {
      // Call AI with the prompt context
      setIsLoading(true)
      const history = messages.slice(-19).map((m) => ({
        role: m.role,
        content: m.content,
      }))

      fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: action.prompt,
          conversationHistory: history,
          userId,
        }),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed")
          return res.json()
        })
        .then((data) => {
          const aiMessage: ChatMessage = {
            role: "assistant",
            content: data.response || action.response,
            timestamp: Date.now(),
          }
          setMessages((prev) => {
            const updated = [...prev, aiMessage]
            return updated.slice(-20)
          })
        })
        .catch(() => {
          // Fallback to preset response
          const aiMessage: ChatMessage = {
            role: "assistant",
            content: action.response,
            timestamp: Date.now(),
          }
          setMessages((prev) => [...prev, aiMessage])
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }

  const handleCopy = (content: string, timestamp: number) => {
    navigator.clipboard.writeText(content)
    setCopiedId(timestamp)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleClear = () => {
    setMessages([])
    toast.success("Conversation cleared")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-[calc(100vh-8rem)] max-h-[calc(100vh-8rem)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold neon-text flex items-center gap-3">
            <Bot className="h-8 w-8" />
            AI Assistant
          </h1>
          <p className="text-muted-foreground mt-1">Your personal study companion</p>
        </div>
        {messages.length > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClear}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors border border-red-500/20"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </motion.button>
        )}
      </div>

      {/* Quick Actions */}
      {messages.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex-shrink-0 mb-4"
        >
          <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Quick actions
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((action) => (
              <motion.button
                key={action.label}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleQuickAction(action)}
                className="flex items-center gap-2 px-3 py-2 glass-card text-sm font-medium hover:bg-white/[0.06] transition-colors rounded-xl"
              >
                {action.icon}
                {action.label}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4 neon-glow">
              <Bot className="h-10 w-10 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">How can I help you study?</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Ask me to explain concepts, generate study notes, quiz you, or provide study tips.
              I&apos;m here to help you learn more effectively!
            </p>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={msg.timestamp + i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="h-4 w-4 text-purple-400" />
                </div>
              )}
              <div className={`group relative max-w-[85%] md:max-w-[70%] ${
                msg.role === "user"
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl rounded-tr-sm px-4 py-3"
                  : "glass-card rounded-2xl rounded-tl-sm px-4 py-3"
              }`}>
                {msg.role === "assistant" ? (
                  <div className="prose prose-invert prose-sm max-w-none text-sm leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:text-purple-300 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:mb-1 [&_code]:bg-white/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-cyan-300 [&_pre]:bg-white/5 [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:overflow-x-auto [&_h1]:text-base [&_h1]:font-bold [&_h1]:mt-3 [&_h1]:mb-1 [&_h2]:text-sm [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm text-white leading-relaxed">{msg.content}</p>
                )}
                {/* Copy button */}
                <button
                  onClick={() => handleCopy(msg.content, msg.timestamp)}
                  className="absolute -bottom-2 right-2 opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all"
                  title="Copy message"
                >
                  {copiedId === msg.timestamp ? (
                    <Check className="h-3 w-3 text-green-400" />
                  ) : (
                    <Copy className="h-3 w-3 text-muted-foreground" />
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4 text-purple-400" />
            </div>
            <div className="glass-card rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-1.5">
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                  className="w-2 h-2 rounded-full bg-purple-400"
                />
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                  className="w-2 h-2 rounded-full bg-purple-400"
                />
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                  className="w-2 h-2 rounded-full bg-purple-400"
                />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 pt-4 border-t border-white/[0.05]">
        {/* Quick action chips when conversation is active */}
        {messages.length > 0 && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-none">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                onClick={() => handleQuickAction(action)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap flex-shrink-0 border border-white/[0.05]"
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about your studies..."
            disabled={isLoading}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder:text-muted-foreground/50 disabled:opacity-50"
          />
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={!input.trim() || isLoading}
            className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:shadow-none transition-shadow"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </motion.button>
        </form>
      </div>
    </motion.div>
  )
}
