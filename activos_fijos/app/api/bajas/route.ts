import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const where: any = {}
  
  // Si no es ADMIN, solo ve bajas de su departamento
  if (session.user.rol !== "ADMIN" && session.user.departamentoId) {
    where.activo = {
      ubicacion: {
        departamentoId: session.user.departamentoId
      }
    }
  }

  const bajas = await prisma.baja.findMany({
    where,
    include: {
      activo: {
        include: { 
          categoria: true,
          ubicacion: {
            include: { departamento: true }
          }
        },
      },
    },
    orderBy: { fecha: "desc" },
  })
  return NextResponse.json(bajas)
}