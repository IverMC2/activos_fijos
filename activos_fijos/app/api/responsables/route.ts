import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"
import bcrypt from "bcryptjs"

const schema = z.object({
  nombre: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  rol: z.enum(["ADMIN", "CONTABILIDAD", "CONSULTA"]).default("CONSULTA"),
  departamentoId: z.string().optional(),
})
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const where: any = { activo: true }
  
  // Si no es ADMIN, solo ve usuarios de su departamento
  if (session.user.rol !== "ADMIN" && session.user.departamentoId) {
    where.departamentoId = session.user.departamentoId
  }

  const usuarios = await prisma.usuario.findMany({
    where,
    select: { id: true, nombre: true, email: true, rol: true, creadoEn: true, departamentoId: true, departamento: true },
    orderBy: { nombre: "asc" },
  })
  return NextResponse.json(usuarios)
}
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (session.user.rol !== "ADMIN") return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })

  const passwordHash = await bcrypt.hash(parsed.data.password, 10)

  const usuario = await prisma.usuario.create({
    data: {
      nombre: parsed.data.nombre,
      email: parsed.data.email,
      passwordHash,
      rol: parsed.data.rol,
      departamentoId: parsed.data.departamentoId === "none" ? null : parsed.data.departamentoId || null,
    },
    select: { id: true, nombre: true, email: true, rol: true, departamentoId: true, departamento: true },
  })

  return NextResponse.json(usuario, { status: 201 })
}