import NextAuth, { DefaultSession } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      rol: string
      departamentoId: string | null
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    rol: string
    departamentoId: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    rol: string
    departamentoId: string | null
  }
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data

const usuario = await prisma.usuario.findUnique({
  where: { email, activo: true },
})
        if (!usuario) return null

const passwordMatch = await bcrypt.compare(password, usuario.passwordHash)
if (!passwordMatch) return null

return {
  id: usuario.id,
  name: usuario.nombre,
  email: usuario.email,
  rol: usuario.rol,
  departamentoId: usuario.departamentoId,
}
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.rol = user.rol
        token.departamentoId = user.departamentoId
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      session.user.rol = token.rol as string
      session.user.departamentoId = token.departamentoId as string | null
      return session
    },
  },
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
})