import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const schema = z.object({
  nombre: z.string().min(1),
  nit: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const proveedores = await prisma.proveedor.findMany({ orderBy: { nombre: "asc" } })
  return NextResponse.json(proveedores)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (session.user.rol !== "ADMIN") return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })

  const proveedor = await prisma.proveedor.create({ data: parsed.data })
  return NextResponse.json(proveedor, { status: 201 })
}