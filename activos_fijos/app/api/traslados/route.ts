import { NextRequest, NextResponse } from "next/server"
import { obtenerTraslados, crearTraslado } from "@/lib/services/traslados.service"
import { auth } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const activoId = req.nextUrl.searchParams.get("activoId") ?? undefined
  let resultado = await obtenerTraslados(activoId)

  // Si no es ADMIN, filtrar por departamento
  if (session.user.rol !== "ADMIN" && session.user.departamentoId) {
    resultado = resultado.filter((t: any) => 
      t.activo?.ubicacion?.departamentoId === session.user.departamentoId
    )
  }

  return NextResponse.json(resultado)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (session.user.rol === "CONSULTA") return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  const body = await req.json()
  const resultado = await crearTraslado(body)

  if (resultado.error) return NextResponse.json(resultado, { status: 400 })
  return NextResponse.json(resultado, { status: 201 })
}