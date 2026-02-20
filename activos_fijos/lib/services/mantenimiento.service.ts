import { prisma } from "@/lib/prisma"
import { z } from "zod"

const mantenimientoSchema = z.object({
  activoId: z.string().min(1),
  tipo: z.enum(["PREVENTIVO", "CORRECTIVO"]),
  descripcion: z.string().min(1, "Requerido"),
  costo: z.coerce.number().min(0).optional(),
  fecha: z.string().min(1, "Requerido"),
  proximaFecha: z.string().optional(),
  proveedorId: z.string().optional(),
})

export async function obtenerMantenimientos(activoId?: string) {
  return prisma.mantenimiento.findMany({
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
      proveedor: true,
    },
    orderBy: { fecha: "desc" },
  })
}

export async function crearMantenimiento(data: unknown) {
  const parsed = mantenimientoSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const d = parsed.data

  const mantenimiento = await prisma.mantenimiento.create({
    data: {
      activoId: d.activoId,
      tipo: d.tipo,
      descripcion: d.descripcion,
      costo: d.costo,
      fecha: new Date(d.fecha),
      proximaFecha: d.proximaFecha ? new Date(d.proximaFecha) : null,
      proveedorId: d.proveedorId || null,
    },
  })

  await prisma.activo.update({
    where: { id: d.activoId },
    data: { estado: "EN_MANTENIMIENTO" },
  })

  return { success: true, mantenimiento }
}

export async function finalizarMantenimiento(id: string) {
  const mantenimiento = await prisma.mantenimiento.findUnique({
    where: { id },
  })
  if (!mantenimiento) return { error: "No encontrado" }

  await prisma.activo.update({
    where: { id: mantenimiento.activoId },
    data: { estado: "ACTIVO" },
  })

  return { success: true }
}