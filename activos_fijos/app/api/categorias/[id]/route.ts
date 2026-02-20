import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const schema = z.object({
  nombre: z.string().min(1),
  vidaUtilAnios: z.coerce.number().int().positive(),
  cuentaContable: z.string().optional(),
})

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (session.user.rol !== "ADMIN") return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })

  const categoria = await prisma.categoria.update({
    where: { id },
    data: parsed.data,
  })

  return NextResponse.json(categoria)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (session.user.rol !== "ADMIN") return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  const { id } = await params

  const activosConCategoria = await prisma.activo.count({ where: { categoriaId: id } })
  if (activosConCategoria > 0) {
    return NextResponse.json({ error: "No se puede eliminar, tiene activos asignados" }, { status: 400 })
  }

  await prisma.categoria.delete({ where: { id } })
  return NextResponse.json({ success: true })
}