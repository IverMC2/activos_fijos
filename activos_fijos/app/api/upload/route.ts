import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { uploadFile } from "@/lib/cloudinary"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get("file") as File
  const activoId = formData.get("activoId") as string
  const tipo = formData.get("tipo") as string

  if (!file || !activoId || !tipo) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
  }

  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    return NextResponse.json({ error: "Archivo muy grande, máximo 10MB" }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const url = await uploadFile(buffer, file.name, file.type)

  const documento = await prisma.documento.create({
    data: {
      activoId,
      tipo: tipo as any,
      nombre: file.name,
      url,
      tamanio: file.size,
    },
  })

  return NextResponse.json(documento, { status: 201 })
}