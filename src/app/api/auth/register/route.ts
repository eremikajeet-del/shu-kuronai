import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const { email, password, username } = await req.json()

    if (!email || !password || !username) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    // Validate username
    if (username.length < 2) {
      return NextResponse.json({ error: "Username must be at least 2 characters" }, { status: 400 })
    }

    const existingUser = await db.user.findFirst({
      where: { OR: [{ email }, { username }] },
    })

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    const hashedPassword = await hash(password, 10)

    // Check if auto-approve is enabled
    let autoApprove = false
    try {
      const autoApproveAdmin = await db.user.findFirst({
        where: { role: "ADMIN", autoApprove: true },
      })
      autoApprove = !!autoApproveAdmin
    } catch {
      // If autoApprove field doesn't exist yet, default to pending
      autoApprove = false
    }

    const initialStatus = autoApprove ? "APPROVED" : "PENDING"

    const user = await db.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        name: username,
        role: "STUDENT",
        status: initialStatus,
      },
    })

    return NextResponse.json({
      message: initialStatus === "APPROVED"
        ? "Account created and auto-approved! Please sign in."
        : "Account created! Please wait for admin approval.",
      userId: user.id,
      status: initialStatus,
    }, { status: 201 })
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
