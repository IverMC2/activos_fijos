import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const schema = z.object({
  nombre: z.string().min(1),
  tipo: z.enum(["sucursal", "area", "departamento"]),
  parentId: z.string().optional(),
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

  const ubicacion = await prisma.ubicacion.update({
  where: { id },
  data: {
    nombre: parsed.data.nombre,
    tipo: parsed.data.tipo,
    parentId: parsed.data.parentId === "none" ? null : parsed.data.parentId ?? null,
    departamentoId: parsed.data.departamentoId || null,
  },
})

  return NextResponse.json(ubicacion)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (session.user.rol !== "ADMIN") return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  const { id } = await params

  const activosEnUbicacion = await prisma.activo.count({ where: { ubicacionId: id } })
  if (activosEnUbicacion > 0) {
    return NextResponse.json({ error: "No se puede eliminar, tiene activos asignados" }, { status: 400 })
  }

  await prisma.ubicacion.delete({ where: { id } })
  return NextResponse.json({ success: true })
}