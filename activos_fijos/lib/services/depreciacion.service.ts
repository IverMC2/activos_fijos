import { prisma } from "@/lib/prisma"

export async function calcularDepreciacionMensual() {
  const hoy = new Date()
  const mes = hoy.getMonth() + 1
  const anio = hoy.getFullYear()

  const activos = await prisma.activo.findMany({
    where: { estado: "ACTIVO" },
  })

  let procesados = 0

  for (const activo of activos) {
    const yaExiste = await prisma.depreciacion.findUnique({
      where: { activoId_mes_anio: { activoId: activo.id, mes, anio } },
    })

    if (yaExiste) continue

    const costo = Number(activo.costoAdquisicion)
    const residual = Number(activo.valorResidual)
    const vidaMeses = activo.vidaUtilAnios * 12
    const valorLibroActual = Number(activo.valorLibro)

    if (valorLibroActual <= residual) continue

    let cuota = 0

    if (activo.metodoDepreciacion === "LINEAL") {
      cuota = (costo - residual) / vidaMeses
    } else {
      cuota = (valorLibroActual * 2) / (activo.vidaUtilAnios)
    }

    cuota = Math.min(cuota, valorLibroActual - residual)

    const nuevoValorLibro = valorLibroActual - cuota
    const depreciacionAcum = costo - nuevoValorLibro

    await prisma.$transaction([
      prisma.depreciacion.create({
        data: {
          activoId: activo.id,
          mes,
          anio,
          cuotaMensual: cuota,
          depreciacionAcum,
          valorLibro: nuevoValorLibro,
        },
      }),
      prisma.activo.update({
        where: { id: activo.id },
        data: { valorLibro: nuevoValorLibro },
      }),
    ])

    procesados++
  }

  return { procesados, mes, anio }
}

export async function obtenerReporteDepreciacion(anio?: number) {
  const anioFiltro = anio ?? new Date().getFullYear()

  const depreciaciones = await prisma.depreciacion.findMany({
    where: { anio: anioFiltro },
    include: {
      activo: {
        include: { categoria: true, ubicacion: true },
      },
    },
    orderBy: [{ anio: "desc" }, { mes: "desc" }],
  })

  return depreciaciones
}