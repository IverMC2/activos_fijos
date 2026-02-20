"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

export default function DepreciacionPage() {
  const [depreciaciones, setDepreciaciones] = useState<any[]>([])
  const [anio, setAnio] = useState(new Date().getFullYear().toString())

  useEffect(() => {
    fetch(`/api/depreciacion?anio=${anio}`)
      .then(r => r.json())
      .then(setDepreciaciones)
  }, [anio])

  // Agrupar por mes para el gráfico
  const porMes = MESES.map((mes, i) => {
    const registros = depreciaciones.filter(d => d.mes === i + 1)
    const total = registros.reduce((acc, d) => acc + Number(d.cuotaMensual), 0)
    return { mes, total }
  })

  const totalAnual = depreciaciones.reduce((acc, d) => acc + Number(d.cuotaMensual), 0)

  const anios = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString())

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Depreciación</h1>
          <p className="text-slate-500">Reporte de depreciación de activos</p>
        </div>
        <Select value={anio} onValueChange={setAnio}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {anios.map(a => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500">Total Depreciado {anio}</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalAnual)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500">Activos Depreciados</p>
            <p className="text-2xl font-bold">{new Set(depreciaciones.map(d => d.activoId)).size}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500">Promedio Mensual</p>
            <p className="text-2xl font-bold">{formatCurrency(totalAnual / 12)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Depreciación Mensual {anio}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={porMes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(v: any) => formatCurrency(v)} />
              <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabla detalle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalle de Depreciación</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Activo</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Cuota Mensual</TableHead>
                <TableHead>Dep. Acumulada</TableHead>
                <TableHead>Valor Libro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {depreciaciones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                    No hay registros de depreciación para {anio}
                  </TableCell>
                </TableRow>
              ) : (
                depreciaciones.map((d: any) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">
                      <div>{d.activo.nombre}</div>
                      <div className="text-xs text-slate-400 font-mono">{d.activo.codigo}</div>
                    </TableCell>
                    <TableCell className="text-slate-600">{d.activo.categoria.nombre}</TableCell>
                    <TableCell>{String(d.mes).padStart(2, "0")}/{d.anio}</TableCell>
                    <TableCell>{formatCurrency(Number(d.cuotaMensual))}</TableCell>
                    <TableCell>{formatCurrency(Number(d.depreciacionAcum))}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(Number(d.valorLibro))}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}