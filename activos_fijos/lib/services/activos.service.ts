import { prisma } from "@/lib/prisma"
import { z } from "zod"


export const activoSchema = z.object({
  nombre: z.string().min(1, "Requerido"),
  descripcion: z.string().optional(),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  numeroSerie: z.string().optional(),
  fechaCompra: z.string().min(1, "Requerido"),
  numeroFactura: z.string().optional(),
  costoAdquisicion: z.coerce.number().positive("Debe ser mayor a 0"),
  valorResidual: z.coerce.number().min(0).default(0),
  vidaUtilAnios: z.coerce.number().int().positive("Debe ser mayor a 0"),
  metodoDepreciacion: z.enum(["LINEAL", "ACELERADO"]).default("LINEAL"),
  categoriaId: z.string().min(1, "Requerido"),
  ubicacionId: z.string().min(1, "Requerido"),
  responsableId: z.string().optional(),
  proveedorId: z.string().optional(),
})

export const deleteSchema = z.object({
  motivo: z.enum(["VENTA", "DETERIORO", "ROBO", "OBSOLESCENCIA"]),
  descripcion: z.string().optional(),
  valorBaja: z.coerce.number().min(0, "Debe ser mayor o igual a 0")
})

export type ActivoInput = z.infer<typeof activoSchema>

function generarCodigo(): string {
  const fecha = new Date()
  const anio = fecha.getFullYear().toString().slice(-2)
  const mes = String(fecha.getMonth() + 1).padStart(2, "0")
  const random = Math.floor(Math.random() * 9000) + 1000
  return `AF-${anio}${mes}-${random}`
}

export async function obtenerActivos(params?: {
  busqueda?: string
  estado?: string
  categoriaId?: string
  ubicacionId?: string
  departamentoId?: string
  page?: number
  limit?: number
}) {
  const page = params?.page ?? 1
  const limit = params?.limit ?? 20
  const skip = (page - 1) * limit

  const where: any = {}

  if (params?.busqueda) {
    where.OR = [
      { nombre: { contains: params.busqueda, mode: "insensitive" } },
      { codigo: { contains: params.busqueda, mode: "insensitive" } },
      { numeroSerie: { contains: params.busqueda, mode: "insensitive" } },
      { responsable: { nombre: { contains: params.busqueda, mode: "insensitive" } } },
    ]
  }

  if (params?.estado) where.estado = params.estado
  if (params?.categoriaId) where.categoriaId = params.categoriaId
  if (params?.ubicacionId) where.ubicacionId = params.ubicacionId

  // Filtrar por departamento si no es ADMIN
  if (params?.departamentoId) {
    where.ubicacion = {
      departamentoId: params.departamentoId
    }
  }

  const [activos, total] = await Promise.all([
    prisma.activo.findMany({
      where,
      include: {
        categoria: true,
        ubicacion: {
          include: { departamento: true }
        },
        responsable: { select: { id: true, nombre: true } },
      },
      orderBy: { creadoEn: "desc" },
      skip,
      take: limit,
    }),
    prisma.activo.count({ where }),
  ])

  return {
    activos,
    total,
    pages: Math.ceil(total / limit),
    page,
  }
}

export async function obtenerActivoPorId(id: string) {
  return prisma.activo.findUnique({
    where: { id },
    include: {
      categoria: true,
      ubicacion: true,
      responsable: { select: { id: true, nombre: true, email: true } },
      proveedor: true,
      documentos: true,
      depreciaciones: {
        orderBy: [{ anio: "desc" }, { mes: "desc" }],
        take: 24,
      },
      mantenimientos: {
        orderBy: { fecha: "desc" },
        take: 10,
        include: { proveedor: true },
      },
      traslados: {
        orderBy: { fecha: "desc" },
        include: {
          ubicacionOrigen: true,
          responsable: { select: { nombre: true } },
        },
      },
      baja: true,
    },
  })
}


export async function crearActivo(data: unknown) {
  const parsed = activoSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const d = parsed.data

  let codigo = generarCodigo()
  let existe = await prisma.activo.findUnique({ where: { codigo } })
  while (existe) {
    codigo = generarCodigo()
    existe = await prisma.activo.findUnique({ where: { codigo } })
  }

  // NO generamos QR aquí, se genera dinámicamente cuando se necesita
  
  const activo = await prisma.activo.create({
    data: {
      codigo,
      nombre: d.nombre,
      descripcion: d.descripcion,
      marca: d.marca,
      modelo: d.modelo,
      numeroSerie: d.numeroSerie,
      fechaCompra: new Date(d.fechaCompra),
      numeroFactura: d.numeroFactura,
      costoAdquisicion: d.costoAdquisicion,
      valorResidual: d.valorResidual,
      vidaUtilAnios: d.vidaUtilAnios,
      metodoDepreciacion: d.metodoDepreciacion,
      valorLibro: d.costoAdquisicion,
      categoriaId: d.categoriaId,
      ubicacionId: d.ubicacionId,
      responsableId: d.responsableId || null,
      proveedorId: d.proveedorId || null,
    },
  })


  // ── Calcular depreciación histórica si la fecha de compra es pasada ──
  const hoy = new Date()
  const fechaCompraDate = new Date(d.fechaCompra)
  const mesesTranscurridos =
    (hoy.getFullYear() - fechaCompraDate.getFullYear()) * 12 +
    (hoy.getMonth() - fechaCompraDate.getMonth())

  if (mesesTranscurridos > 0) {
    const vidaMeses = d.vidaUtilAnios * 12
    const costo = d.costoAdquisicion
    const residual = d.valorResidual ?? 0
    const cuotaMensual = (costo - residual) / vidaMeses

    let valorLibroActual = costo
    const depreciaciones = []

    for (let i = 0; i < Math.min(mesesTranscurridos, vidaMeses); i++) {
      const fecha = new Date(fechaCompraDate)
      fecha.setMonth(fecha.getMonth() + i + 1)

      const cuota = Math.min(cuotaMensual, valorLibroActual - residual)
      if (cuota <= 0) break

      valorLibroActual = valorLibroActual - cuota
      const depreciacionAcum = costo - valorLibroActual

      depreciaciones.push({
        activoId: activo.id,
        mes: fecha.getMonth() + 1,
        anio: fecha.getFullYear(),
        cuotaMensual: cuota,
        depreciacionAcum,
        valorLibro: valorLibroActual,
      })
    }

    if (depreciaciones.length > 0) {
      await prisma.$transaction([
        prisma.depreciacion.createMany({
          data: depreciaciones,
          skipDuplicates: true,
        }),
        prisma.activo.update({
          where: { id: activo.id },
          data: { valorLibro: valorLibroActual },
        }),
      ])
    }
  }

  return { success: true, activo }
}

export async function actualizarActivo(id: string, data: unknown) {
  const parsed = activoSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const d = parsed.data

  const activo = await prisma.activo.update({
    where: { id },
    data: {
      nombre: d.nombre,
      descripcion: d.descripcion,
      marca: d.marca,
      modelo: d.modelo,
      numeroSerie: d.numeroSerie,
      fechaCompra: new Date(d.fechaCompra),
      numeroFactura: d.numeroFactura,
      costoAdquisicion: d.costoAdquisicion,
      valorResidual: d.valorResidual,
      vidaUtilAnios: d.vidaUtilAnios,
      metodoDepreciacion: d.metodoDepreciacion,
      categoriaId: d.categoriaId,
      ubicacionId: d.ubicacionId,
      responsableId: d.responsableId || null,
      proveedorId: d.proveedorId || null,
    },
  })

  return { success: true, activo }
}

export async function darDeBajaActivo(id: string, data: {
  motivo: "VENTA" | "DETERIORO" | "ROBO" | "OBSOLESCENCIA"
  descripcion?: string
  valorBaja: number
}) {
  const parsed = deleteSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  await prisma.$transaction([
    prisma.activo.update({
      where: { id },
      data: { estado: "DADO_DE_BAJA" },
    }),
    prisma.baja.create({
      data: {
        activoId: id,
        motivo: data.motivo,
        descripcion: data.descripcion,
        valorBaja: data.valorBaja,
      },
    }),
  ])

  return { success: true }
}

export async function getActivoWithDepartamento(id: string) {
  const activo = await prisma.activo.findUnique({
    where: { id },
    include: {
      ubicacion: {
        select: {
          departamentoId: true
        }
      }
    }
  })

  if (!activo) return null

  return {
    ...activo,
    departamentoId: activo.ubicacion.departamentoId
  }
}

export async function getDepartamentoIdFromUbicacion(ubicacionId: string) {
  const ubicacion = await prisma.ubicacion.findUnique({
    where: { id: ubicacionId },
    select: {
      departamentoId: true
    }
  })

  return ubicacion?.departamentoId ?? null
}


