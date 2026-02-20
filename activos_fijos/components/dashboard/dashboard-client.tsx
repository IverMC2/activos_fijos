"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  Package, TrendingDown, Wrench, Trash2,
  DollarSign, AlertTriangle
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts"

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]

interface Props {
  nombre: string
  stats: {
    totalActivos: number
    activosActivos: number
    enMantenimiento: number
    dadosDeBaja: number
    valorTotalLibro: number
    valorTotalCosto: number
  }
  activosPorCategoria: { nombre: string; cantidad: number }[]
  activosPorUbicacion: { nombre: string; cantidad: number }[]
  ultimosActivos: {
    id: string
    codigo: string
    nombre: string
    categoria: string
    ubicacion: string
    creadoEn: string
  }[]
  proximosMantenimientos: {
    id: string
    activo: string
    codigo: string
    tipo: string
    proximaFecha: string
  }[]
  depreciacionMensual: { mes: string; total: number }[]
}

export function DashboardClient({
  nombre,
  stats,
  activosPorCategoria,
  activosPorUbicacion,
  ultimosActivos,
  proximosMantenimientos,
  depreciacionMensual,
}: Props) {
  const depreciacionTotal = depreciacionMensual.reduce((acc, d) => acc + d.total, 0)
  const porcentajeDepreciado = stats.valorTotalCosto > 0
    ? ((stats.valorTotalCosto - stats.valorTotalLibro) / stats.valorTotalCosto * 100).toFixed(1)
    : "0"

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Bienvenido, {nombre}</p>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Activos",
            value: stats.totalActivos,
            icon: Package,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Activos",
            value: stats.activosActivos,
            icon: TrendingDown,
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            label: "En Mantenimiento",
            value: stats.enMantenimiento,
            icon: Wrench,
            color: "text-yellow-600",
            bg: "bg-yellow-50",
          },
          {
            label: "Dados de Baja",
            value: stats.dadosDeBaja,
            icon: Trash2,
            color: "text-red-600",
            bg: "bg-red-50",
          },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500">{stat.label}</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bg}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Stats financieras */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-blue-50">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Costo Total Adquisición</p>
                <p className="text-xl font-bold">{formatCurrency(stats.valorTotalCosto)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-green-50">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Valor Libro Total</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(stats.valorTotalLibro)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-red-50">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Dep. Acumulada {new Date().getFullYear()}</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(depreciacionTotal)}</p>
                <p className="text-xs text-slate-400">{porcentajeDepreciado}% depreciado</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Depreciación mensual */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Depreciación Mensual {new Date().getFullYear()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {depreciacionMensual.length === 0 ? (
              <p className="text-slate-400 text-center py-8 text-sm">Sin datos de depreciación</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={depreciacionMensual}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: any) => formatCurrency(v)} />
                  <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Activos por categoría */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activos por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            {activosPorCategoria.length === 0 ? (
              <p className="text-slate-400 text-center py-8 text-sm">Sin datos</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
  data={activosPorCategoria}
  dataKey="cantidad"
  nameKey="nombre"
  cx="50%"
  cy="50%"
  outerRadius={80}
  label={({ name, value }) => `${name}: ${value}`}
>
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Activos por ubicación */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activos por Ubicación</CardTitle>
          </CardHeader>
          <CardContent>
            {activosPorUbicacion.length === 0 ? (
              <p className="text-slate-400 text-center py-8 text-sm">Sin datos</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={activosPorUbicacion} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="nombre" type="category" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="cantidad" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Próximos mantenimientos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Próximos Mantenimientos</CardTitle>
              {proximosMantenimientos.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-yellow-600 font-medium">
                  <AlertTriangle className="h-3 w-3" />
                  {proximosMantenimientos.length} pendientes
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {proximosMantenimientos.length === 0 ? (
              <p className="text-slate-400 text-center py-8 text-sm">Sin mantenimientos próximos</p>
            ) : (
              <div className="space-y-3">
                {proximosMantenimientos.map((m) => (
                  <div key={m.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{m.activo}</p>
                      <p className="text-xs text-slate-400 font-mono">{m.codigo}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${m.tipo === "PREVENTIVO" ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800"}`}>
                        {m.tipo}
                      </span>
                      <p className="text-xs text-slate-500 mt-1">
                        {format(new Date(m.proximaFecha), "dd MMM yyyy", { locale: es })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Últimos activos registrados */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Últimos Activos Registrados</CardTitle>
            <Link href="/dashboard/activos" className="text-xs text-blue-600 hover:underline">
              Ver todos →
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left px-4 py-2 text-slate-500 font-medium">Código</th>
                <th className="text-left px-4 py-2 text-slate-500 font-medium">Nombre</th>
                <th className="text-left px-4 py-2 text-slate-500 font-medium">Categoría</th>
                <th className="text-left px-4 py-2 text-slate-500 font-medium">Ubicación</th>
                <th className="text-left px-4 py-2 text-slate-500 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {ultimosActivos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    No hay activos registrados
                  </td>
                </tr>
              ) : (
                ultimosActivos.map((a) => (
                  <tr key={a.id} className="border-b hover:bg-slate-50">
                    <td className="px-4 py-2 font-mono">{a.codigo}</td>
                    <td className="px-4 py-2 font-medium">
                      <Link href={`/dashboard/activos/${a.id}`} className="hover:text-blue-600">
                        {a.nombre}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-slate-600">{a.categoria}</td>
                    <td className="px-4 py-2 text-slate-600">{a.ubicacion}</td>
                    <td className="px-4 py-2 text-slate-500">
                      {format(new Date(a.creadoEn), "dd/MM/yyyy")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}