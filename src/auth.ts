import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { authConfig } from "@/auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const rawEmail = credentials?.email
        const rawPassword = credentials?.password
        if (typeof rawEmail !== "string" || typeof rawPassword !== "string") return null

        const normalizedEmail = rawEmail.trim().toLowerCase()
        if (!normalizedEmail || !rawPassword) return null

        const user =
          (await prisma.user.findUnique({
            where: { email: normalizedEmail },
          })) ??
          (await prisma.user.findFirst({
            where: { email: { equals: normalizedEmail, mode: "insensitive" } },
          }))

        if (!user || !user.password) return null

        if (user.isActive === false) {
          throw new Error("AccountDeactivated")
        }

        const passwordsMatch = await bcrypt.compare(
          rawPassword,
          user.password
        )

        if (passwordsMatch) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            modules: user.modules,
          }
        }

        return null
      },
    }),
  ],
})
