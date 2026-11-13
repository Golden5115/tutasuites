import type { NextAuthConfig } from "next-auth"

// Guard against `.env` `http://localhost:3000` accidentally copied into Vercel env vars,
// which causes NextAuth to issue non-secure cookies and redirect staff to localhost:3000.
if (process.env.VERCEL) {
  for (const key of ["AUTH_URL", "NEXTAUTH_URL"] as const) {
    const val = process.env[key]
    if (!val) continue
    try {
      const { hostname } = new URL(val)
      if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0") {
        delete process.env[key]
      }
    } catch {
      delete process.env[key]
    }
  }
}

export const authConfig = {
  trustHost: true,
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        // @ts-ignore
        token.role = user.role
        // @ts-ignore
        token.modules = user.modules
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        // @ts-ignore
        session.user.id = token.id as string
        // @ts-ignore
        session.user.role = token.role as string
        // @ts-ignore
        session.user.modules = token.modules as string[]
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig
