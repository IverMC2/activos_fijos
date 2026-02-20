import { NextRequest, NextResponse } from "next/server"
import { obtenerActivoPorId, actualizarActivo, darDeBajaActivo } from "@/lib/services/activos.service"
import { auth } from "@/lib/auth"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const activo = await obtenerActivoPorId(id)
  if (!activo) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  return NextResponse.json(activo)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (session.user.rol === "CONSULTA") return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const resultado = await actualizarActivo(id, body)

  if (resultado.error) return NextResponse.json(resultado, { status: 400 })
  return NextResponse.json(resultado)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (session.user.rol === "CONSULTA") return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const resultado = await darDeBajaActivo(id, body)

  return NextResponse.json(resultado)
}