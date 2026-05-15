import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import type { NextAuthConfig } from "next-auth"

const ALLOWED = (process.env.ALLOWED_EMAILS ?? "lohjohn02@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

const config: NextAuthConfig = {
  providers: [Google],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    signIn({ user }) {
      const email = user.email?.toLowerCase()
      if (!email || !ALLOWED.includes(email)) {
        return "/auth/denied"
      }
      return true
    },
    jwt({ token, user }) {
      if (user) {
        token.paidTier = "free"
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.sub!
      session.user.paidTier = token.paidTier as string | undefined
      return session
    },
  },
}

export const { handlers, signIn, signOut, auth } = NextAuth(config)
