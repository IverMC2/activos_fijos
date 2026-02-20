import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DashboardClient } from "@/components/dashboard/dashboard-client"

export default async function DashboardPage() {
  const session = await auth()

  const [
    totalActivos,
    activosActivos,
    enMantenimiento,
    dadosDeBaja,
    activosPorCategoria,
    activosPorUbicacion,
    ultimosActivos,
    proximosMantenimientos,
    depreciacionMensual,
  ] = await Promise.all([
    prisma.activo.count(),
    prisma.activo.count({ where: { estado: "ACTIVO" } }),
    prisma.activo.count({ where: { estado: "EN_MANTENIMIENTO" } }),
    prisma.activo.count({ where: { estado: "DADO_DE_BAJA" } }),
    prisma.categoria.findMany({
      include: { _count: { select: { activos: true } } },
      orderBy: { activos: { _count: "desc" } },
      take: 6,
    }),
    prisma.ubicacion.findMany({
      include: { _count: { select: { activos: true } } },
      orderBy: { activos: { _count: "desc" } },
      take: 6,
    }),
    prisma.activo.findMany({
      orderBy: { creadoEn: "desc" },
      take: 5,
      include: { categoria: true, ubicacion: true },
    }),
    prisma.mantenimiento.findMany({
      where: {
        proximaFecha: { gte: new Date() },
      },
      orderBy: { proximaFecha: "asc" },
      take: 5,
      include: { activo: { select: { nombre: true, codigo: true } } },
    }),
    prisma.depreciacion.groupBy({
      by: ["mes", "anio"],
      where: { anio: new Date().getFullYear() },
      _sum: { cuotaMensual: true },
      orderBy: [{ anio: "asc" }, { mes: "asc" }],
    }),
  ])

  const valorTotalLibro = await prisma.activo.aggregate({
    _sum: { valorLibro: true },
    where: { estado: { not: "DADO_DE_BAJA" } },
  })

  const valorTotalCosto = await prisma.activo.aggregate({
    _sum: { costoAdquisicion: true },
    where: { estado: { not: "DADO_DE_BAJA" } },
  })

  return (
    <DashboardClient
      nombre={session?.user.name ?? ""}
      stats={{
        totalActivos,
        activosActivos,
        enMantenimiento,
        dadosDeBaja,
        valorTotalLibro: Number(valorTotalLibro._sum.valorLibro ?? 0),
        valorTotalCosto: Number(valorTotalCosto._sum.costoAdquisicion ?? 0),
      }}
      activosPorCategoria={activosPorCategoria.map(c => ({
        nombre: c.nombre,
        cantidad: c._count.activos,
      }))}
      activosPorUbicacion={activosPorUbicacion.map(u => ({
        nombre: u.nombre,
        cantidad: u._count.activos,
      }))}
      ultimosActivos={ultimosActivos.map(a => ({
        id: a.id,
        codigo: a.codigo,
        nombre: a.nombre,
        categoria: a.categoria.nombre,
        ubicacion: a.ubicacion.nombre,
        creadoEn: a.creadoEn.toISOString(),
      }))}
      proximosMantenimientos={proximosMantenimientos.map(m => ({
        id: m.id,
        activo: m.activo.nombre,
        codigo: m.activo.codigo,
        tipo: m.tipo,
        proximaFecha: m.proximaFecha!.toISOString(),
      }))}
      depreciacionMensual={depreciacionMensual.map(d => ({
        mes: `${String(d.mes).padStart(2, "0")}/${d.anio}`,
        total: Number(d._sum.cuotaMensual ?? 0),
      }))}
    />
  )
}