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

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const where: any = {}
  if (session.user.rol !== "ADMIN" && session.user.departamentoId) {
    where.departamentoId = session.user.departamentoId
  }

  const ubicaciones = await prisma.ubicacion.findMany({
    where,
    orderBy: { nombre: "asc" },
    include: {
      hijos: true,
      departamento: true,
    },
  })
  return NextResponse.json(ubicaciones)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (session.user.rol !== "ADMIN") return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })

  const ubicacion = await prisma.ubicacion.create({
    data: {
      nombre: parsed.data.nombre,
      tipo: parsed.data.tipo,
      parentId: parsed.data.parentId === "none" ? null : parsed.data.parentId ?? null,
      departamentoId: parsed.data.departamentoId || null,
    },
  })
  return NextResponse.json(ubicacion, { status: 201 })
}