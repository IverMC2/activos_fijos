import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { canCreateCategoria } from "@/lib/policies/categoria.policy"

const schema = z.object({
  nombre: z.string().min(1),
  vidaUtilAnios: z.coerce.number().int().positive(),
  cuentaContable: z.string().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const categorias = await prisma.categoria.findMany({ orderBy: { nombre: "asc" } })
  return NextResponse.json(categorias)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!canCreateCategoria(session)) return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  const nombreUnico = await prisma.categoria.findFirst({
    where: { nombre: parsed.data.nombre }
  })  
  if (nombreUnico) {        
    return NextResponse.json({error:"El nombre ya existe"}, {status:409})
  }
  const categoria = await prisma.categoria.create({ data: parsed.data })
  return NextResponse.json(categoria, { status: 201 })
}