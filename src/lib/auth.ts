import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { db } from "@/lib/db"
import { USER_STATUS } from "@/lib/rbac"

declare module "next-auth" {
  interface User {
    id?: string
    role?: string
    status?: string
  }
  interface Session {
    user: {
      id?: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: string
      status?: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    role?: string
    status?: string
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required")
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) {
          throw new Error("No user found with this email")
        }

        const isValid = await compare(credentials.password, user.password)

        if (!isValid) {
          throw new Error("Invalid password")
        }

        // Check account status - admin always allowed
        if (user.role !== "ADMIN" && user.status !== USER_STATUS.APPROVED) {
          if (user.status === USER_STATUS.PENDING) {
            throw new Error("ACCOUNT_PENDING:Your account is under review. Please wait for admin approval.")
          }
          if (user.status === USER_STATUS.REJECTED) {
            throw new Error("ACCOUNT_REJECTED:Your registration was not approved. Contact admin for help.")
          }
          throw new Error("Account access denied")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.username,
          role: user.role,
          status: user.status,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.status = user.status
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.status = token.status as string
      }
      return session
    },
  },
  pages: {
    signIn: "/",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "mr-adhd-study-tracker-secret-key-2024",
}
