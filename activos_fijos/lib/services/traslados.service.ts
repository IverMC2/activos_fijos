import { prisma } from "@/lib/prisma"
import { z } from "zod"

const trasladoSchema = z.object({
  activoId: z.string().min(1),
  ubicacionDestinoId: z.string().min(1, "Requerido"),
  responsableId: z.string().optional(),
  motivo: z.string().optional(),
})

export async function obtenerTraslados(activoId?: string) {
  return prisma.traslado.findMany({
    where: activoId ? { activoId } : undefined,
    include: {
      activo: {
        select: {
          id: true,
          nombre: true,
          codigo: true,
          ubicacion: {
            include: { departamento: true }
          }
        },
      },
      ubicacionOrigen: true,
      responsable: { select: { nombre: true } },
    },
    orderBy: { fecha: "desc" },
  })
}

export async function crearTraslado(data: unknown) {
  const parsed = trasladoSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const d = parsed.data

  const activo = await prisma.activo.findUnique({
    where: { id: d.activoId },
  })
  if (!activo) return { error: "Activo no encontrado" }

  await prisma.$transaction([
    prisma.traslado.create({
      data: {
        activoId: d.activoId,
        ubicacionOrigenId: activo.ubicacionId,
        responsableId: d.responsableId || null,
        motivo: d.motivo,
      },
    }),
    prisma.activo.update({
      where: { id: d.activoId },
      data: { ubicacionId: d.ubicacionDestinoId },
    }),
  ])

  return { success: true }
}