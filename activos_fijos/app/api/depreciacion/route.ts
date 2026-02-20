import { NextRequest, NextResponse } from "next/server"
import { obtenerReporteDepreciacion } from "@/lib/services/depreciacion.service"
import { auth } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const anio = req.nextUrl.searchParams.get("anio")
  const resultado = await obtenerReporteDepreciacion(anio ? parseInt(anio) : undefined)
  return NextResponse.json(resultado)
}