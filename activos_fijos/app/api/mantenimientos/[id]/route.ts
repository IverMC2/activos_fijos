import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const schema = z.object({
  tipo: z.enum(["PREVENTIVO", "CORRECTIVO"]),
  descripcion: z.string().min(1),
  costo: z.coerce.number().min(0).optional(),
  fecha: z.string().min(1),
  proximaFecha: z.string().optional(),
  proveedorId: z.string().optional(),
})

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (session.user.rol === "CONSULTA") return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })

  const d = parsed.data
  const mantenimiento = await prisma.mantenimiento.update({
    where: { id },
    data: {
      tipo: d.tipo,
      descripcion: d.descripcion,
      costo: d.costo,
      fecha: new Date(d.fecha),
      proximaFecha: d.proximaFecha ? new Date(d.proximaFecha) : null,
      proveedorId: d.proveedorId || null,
    },
  })

  return NextResponse.json(mantenimiento)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (session.user.rol === "CONSULTA") return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  const { id } = await params
  const mantenimiento = await prisma.mantenimiento.findUnique({ where: { id } })
  if (!mantenimiento) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  await prisma.mantenimiento.delete({ where: { id } })

  const otrosMantenimientos = await prisma.mantenimiento.count({
    where: { activoId: mantenimiento.activoId },
  })

  if (otrosMantenimientos === 0) {
    await prisma.activo.update({
      where: { id: mantenimiento.activoId },
      data: { estado: "ACTIVO" },
    })
  }

  return NextResponse.json({ success: true })
}