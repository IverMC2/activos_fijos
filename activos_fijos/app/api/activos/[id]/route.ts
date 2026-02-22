import { NextRequest, NextResponse } from "next/server"
import { obtenerActivoPorId, actualizarActivo, darDeBajaActivo, getDepartamentoIdFromUbicacion, getActivoWithDepartamento } from "@/lib/services/activos.service"
import { auth } from "@/lib/auth"
import { hasPermission } from "@/lib/role"
import { canDeleteActivo, canGetActivo, canUpdateActivo, getReadDepartamentoFilter } from "@/lib/policies/activo.policy"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const activo = await obtenerActivoPorId(id)

  if (!activo?.ubicacion.departamentoId || !canGetActivo(session,activo?.ubicacion.departamentoId)) {
    return NextResponse.json({error:"Sin permisos"},{status:403})
  }
  if (!activo) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  return NextResponse.json(activo)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const activo = await getActivoWithDepartamento(id)

  if (!activo) {
    return NextResponse.json({ error: "Activo no encontrado" }, { status: 404 })
  }

  if (!activo.departamentoId || !canUpdateActivo(session, activo.departamentoId)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }
  const resultado = await actualizarActivo(id, body)

  if (resultado.error) return NextResponse.json(resultado, { status: 400 })
  return NextResponse.json(resultado)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const activo = await getActivoWithDepartamento(id)
  if (!activo) {
    return NextResponse.json({error: "Activo no encontrado"}, {status:404})
  }  
  if (!activo.departamentoId || !canDeleteActivo(session,activo.departamentoId)) {
    return NextResponse.json({error:"Sin permisos"},{status:403})
  }

  const resultado = await darDeBajaActivo(id, body)
  if (resultado.error) {
    return NextResponse.json(resultado, { status: 400 })
  }
  return NextResponse.json(resultado)
}