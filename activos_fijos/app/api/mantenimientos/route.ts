import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { obtenerMantenimientos } from "@/lib/services/mantenimiento.service"

const schema = z.object({
  nombre: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  rol: z.enum(["ADMIN", "CONTABILIDAD", "CONSULTA"]).default("CONSULTA"),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const activoId = req.nextUrl.searchParams.get("activoId") ?? undefined
  
  let resultado = await obtenerMantenimientos(activoId)

  // Si no es ADMIN, filtrar por departamento
  if (session.user.rol !== "ADMIN" && session.user.departamentoId) {
    resultado = resultado.filter((m: any) => 
      m.activo?.ubicacion?.departamentoId === session.user.departamentoId
    )
  }

  return NextResponse.json(resultado)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (session.user.rol !== "ADMIN") return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

    console.log(session);
    
  const body = await req.json()
    console.log({...body,...session.user});
    

  const parsed = schema.safeParse({...body,...session.user})
  console.log(parsed?.error?.errors);
  
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })

  const passwordHash = await bcrypt.hash(parsed.data.password, 10)

  const usuario = await prisma.usuario.create({
    data: {
      nombre: parsed.data.nombre,
      email: parsed.data.email,
      passwordHash,
      rol: parsed.data.rol,
    },
    select: { id: true, nombre: true, email: true, rol: true },
  })

  return NextResponse.json(usuario, { status: 201 })
}