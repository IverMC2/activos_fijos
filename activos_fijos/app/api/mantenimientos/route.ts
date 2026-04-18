import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { obtenerMantenimientos } from "@/lib/services/mantenimiento.service"

const schema = z.object({
  activoId: z.string().min(1),
  tipo: z.enum(["PREVENTIVO", "CORRECTIVO"]),
  descripcion: z.string().min(1),
  costo: z.coerce.number().optional(),
  fecha: z.string().min(1),
  proximaFecha: z.string().optional(),
  proveedorId: z.string().optional(),
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
  if (session.user.rol === "CONSULTA") return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  
  if (!parsed.success) {
    console.error(parsed.error.flatten().fieldErrors)
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  // Verificar que el activo existe
  const activo = await prisma.activo.findUnique({
    where: { id: parsed.data.activoId },
    include: { ubicacion: true },
  })

  if (!activo) {
    return NextResponse.json({ error: "Activo no encontrado" }, { status: 404 })
  }

  // Si no es ADMIN, verificar que el activo pertenece a su departamento
  if (session.user.rol !== "ADMIN" && session.user.departamentoId) {
    if (activo.ubicacion.departamentoId !== session.user.departamentoId) {
      return NextResponse.json({ error: "Sin permisos para este activo" }, { status: 403 })
    }
  }

  // Crear mantenimiento
  const mantenimiento = await prisma.mantenimiento.create({
    data: {
      activoId: parsed.data.activoId,
      tipo: parsed.data.tipo,
      descripcion: parsed.data.descripcion,
      costo: parsed.data.costo,
      fecha: new Date(parsed.data.fecha),
      proximaFecha: parsed.data.proximaFecha ? new Date(parsed.data.proximaFecha) : null,
      proveedorId: parsed.data.proveedorId === "none" ? null : parsed.data.proveedorId || null,
    },
    include: {
      activo: { select: { nombre: true, codigo: true } },
      proveedor: true,
    },
  })

  // Cambiar estado del activo a EN_MANTENIMIENTO
  await prisma.activo.update({
    where: { id: parsed.data.activoId },
    data: { estado: "EN_MANTENIMIENTO" },
  })

  return NextResponse.json(mantenimiento, { status: 201 })
}