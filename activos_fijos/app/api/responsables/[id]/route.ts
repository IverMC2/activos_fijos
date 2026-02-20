import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const schema = z.object({
  nombre: z.string().min(1),
  email: z.string().email(),
  rol: z.enum(["ADMIN", "CONTABILIDAD", "CONSULTA"]),
  departamentoId: z.string().optional(),
})

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (session.user.rol !== "ADMIN") return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })

  const usuario = await prisma.usuario.update({
  where: { id },
  data: {
    nombre: parsed.data.nombre,
    email: parsed.data.email,
    rol: parsed.data.rol,
    departamentoId: parsed.data.departamentoId === "none" ? null : parsed.data.departamentoId || null,
  },
  select: { id: true, nombre: true, email: true, rol: true, departamentoId: true },
})

  return NextResponse.json(usuario)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (session.user.rol !== "ADMIN") return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  const { id } = await params

  await prisma.usuario.update({
    where: { id },
    data: { activo: false },
  })

  return NextResponse.json({ success: true })
}