import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const schema = z.object({
  nombre: z.string().min(1),
  ciudad: z.string().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const departamentos = await prisma.departamento.findMany({
    orderBy: { nombre: "asc" },
    include: {
      _count: { select: { ubicaciones: true, usuarios: true } }
    }
  })
  return NextResponse.json(departamentos)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (session.user.rol !== "ADMIN") return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })

  const departamento = await prisma.departamento.create({ data: parsed.data })
  return NextResponse.json(departamento, { status: 201 })
}