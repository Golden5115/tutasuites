import type { NextAuthConfig } from "next-auth"

export const authConfig = {
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
