import { NextRequest, NextResponse } from "next/server"
import { calcularDepreciacionMensual } from "@/lib/services/depreciacion.service"

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret")
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const resultado = await calcularDepreciacionMensual()
  return NextResponse.json(resultado)
}