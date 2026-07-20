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
        const { email, password } = credentials
        if (!email || !password) return null

        const user = await prisma.user.findUnique({
          where: { email: email as string },
        })

        if (!user || !user.password) return null

        const passwordsMatch = await bcrypt.compare(
          password as string,
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
