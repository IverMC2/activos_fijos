import { NextRequest, NextResponse } from "next/server"
import { obtenerActivos, crearActivo } from "@/lib/services/activos.service"
import { auth } from "@/lib/auth"
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  console.log("USER ROL:", session.user.rol)
  console.log("USER DEPT:", session.user.departamentoId)

  const { searchParams } = req.nextUrl

  // Si no es ADMIN, filtrar por su departamento
  const departamentoId = session.user.rol !== "ADMIN"
    ? session.user.departamentoId ?? undefined
    : searchParams.get("departamentoId") ?? undefined

  console.log("DEPT FILTER:", departamentoId)

  const resultado = await obtenerActivos({
    busqueda: searchParams.get("busqueda") ?? undefined,
    estado: searchParams.get("estado") ?? undefined,
    categoriaId: searchParams.get("categoriaId") ?? undefined,
    ubicacionId: searchParams.get("ubicacionId") ?? undefined,
    departamentoId,
    page: searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 20,
  })

  return NextResponse.json(resultado)
}
export async function POST(req: NextRequest) {
  const session = await auth()
  
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (session.user.rol === "CONSULTA") return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  const body = await req.json()
  const resultado = await crearActivo(body)

  if (resultado.error) return NextResponse.json(resultado, { status: 400 })
  return NextResponse.json(resultado, { status: 201 })
}