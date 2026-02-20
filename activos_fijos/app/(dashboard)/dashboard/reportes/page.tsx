"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { toast } from "sonner"

export default function ReportesPage() {
  const [activos, setActivos] = useState<any[]>([])
  const [bajas, setBajas] = useState<any[]>([])
  const [depreciaciones, setDepreciaciones] = useState<any[]>([])
  const [categorias, setCategorias] = useState<any[]>([])
  const [ubicaciones, setUbicaciones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroUbicacion, setFiltroUbicacion] = useState("todas")
  const [filtroCategoria, setFiltroCategoria] = useState("todas")
  const [anio, setAnio] = useState(new Date().getFullYear().toString())

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch("/api/activos?limit=10000").then(r => r.json()),
      fetch("/api/bajas").then(r => r.json()),
      fetch(`/api/depreciacion?anio=${anio}`).then(r => r.json()),
      fetch("/api/categorias").then(r => r.json()),
      fetch("/api/ubicaciones").then(r => r.json()),
    ]).then(([acts, bajas, deps, cats, ubics]) => {
      setActivos(acts.activos ?? [])
      setBajas(bajas)
      setDepreciaciones(deps)
      setCategorias(cats)
      setUbicaciones(ubics)
    }).finally(() => setLoading(false))
  }, [anio])

  // Filtros
  const activosFiltrados = activos.filter(a => {
    if (filtroUbicacion !== "todas" && a.ubicacionId !== filtroUbicacion) return false
    if (filtroCategoria !== "todas" && a.categoriaId !== filtroCategoria) return false
    return true
  })

  // ─── Exportar Excel ──────────────────────────────────────
  function exportarExcel(datos: any[], nombre: string, columnas: string[], filas: (a: any) => any[]) {
    const ws = XLSX.utils.aoa_to_sheet([columnas, ...datos.map(filas)])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, nombre)
    XLSX.writeFile(wb, `${nombre}_${format(new Date(), "yyyyMMdd")}.xlsx`)
    toast.success("Excel exportado correctamente")
  }

  function exportarInventarioExcel() {
    exportarExcel(
      activosFiltrados,
      "Inventario",
      ["Código", "Nombre", "Categoría", "Marca", "Modelo", "Ubicación", "Responsable", "Costo", "Valor Libro", "Estado"],
      (a) => [
        a.codigo, a.nombre, a.categoria?.nombre, a.marca ?? "—", a.modelo ?? "—",
        a.ubicacion?.nombre, a.responsable?.nombre ?? "—",
        Number(a.costoAdquisicion), Number(a.valorLibro), a.estado
      ]
    )
  }

  function exportarDepreciacionExcel() {
    exportarExcel(
      depreciaciones,
      "Depreciacion",
      ["Código", "Nombre", "Categoría", "Período", "Cuota Mensual", "Dep. Acumulada", "Valor Libro"],
      (d) => [
        d.activo?.codigo, d.activo?.nombre, d.activo?.categoria?.nombre,
        `${String(d.mes).padStart(2, "0")}/${d.anio}`,
        Number(d.cuotaMensual), Number(d.depreciacionAcum), Number(d.valorLibro)
      ]
    )
  }

  function exportarBajasExcel() {
    exportarExcel(
      bajas,
      "Bajas",
      ["Código", "Nombre", "Categoría", "Motivo", "Valor Baja", "Fecha"],
      (b) => [
        b.activo?.codigo, b.activo?.nombre, b.activo?.categoria?.nombre,
        b.motivo, Number(b.valorBaja),
        format(new Date(b.fecha), "dd/MM/yyyy")
      ]
    )
  }

  // ─── Exportar PDF ─────────────────────────────────────────
  function exportarPDF(titulo: string, columnas: string[], filas: any[][]) {
    const doc = new jsPDF({ orientation: "landscape" })
    doc.setFontSize(16)
    doc.text(titulo, 14, 15)
    doc.setFontSize(10)
    doc.text(`Generado: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 22)

    autoTable(doc, {
      head: [columnas],
      body: filas,
      startY: 28,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 58, 107] },
    })

    doc.save(`${titulo.replace(/ /g, "_")}_${format(new Date(), "yyyyMMdd")}.pdf`)
    toast.success("PDF exportado correctamente")
  }

  function exportarInventarioPDF() {
    exportarPDF(
      "Inventario General de Activos Fijos",
      ["Código", "Nombre", "Categoría", "Ubicación", "Responsable", "Costo", "Valor Libro", "Estado"],
      activosFiltrados.map(a => [
        a.codigo, a.nombre, a.categoria?.nombre,
        a.ubicacion?.nombre, a.responsable?.nombre ?? "—",
        formatCurrency(Number(a.costoAdquisicion)),
        formatCurrency(Number(a.valorLibro)),
        a.estado
      ])
    )
  }

  function exportarDepreciacionPDF() {
    exportarPDF(
      `Reporte de Depreciación ${anio}`,
      ["Código", "Nombre", "Período", "Cuota Mensual", "Dep. Acumulada", "Valor Libro"],
      depreciaciones.map(d => [
        d.activo?.codigo, d.activo?.nombre,
        `${String(d.mes).padStart(2, "0")}/${d.anio}`,
        formatCurrency(Number(d.cuotaMensual)),
        formatCurrency(Number(d.depreciacionAcum)),
        formatCurrency(Number(d.valorLibro))
      ])
    )
  }

  function exportarBajasPDF() {
    exportarPDF(
      "Reporte de Bajas de Activos",
      ["Código", "Nombre", "Categoría", "Motivo", "Valor Baja", "Fecha"],
      bajas.map(b => [
        b.activo?.codigo, b.activo?.nombre, b.activo?.categoria?.nombre,
        b.motivo, formatCurrency(Number(b.valorBaja)),
        format(new Date(b.fecha), "dd/MM/yyyy")
      ])
    )
  }

  const anios = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString())

  if (loading) return <div className="p-6 text-slate-400">Cargando reportes...</div>

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reportes</h1>
        <p className="text-slate-500">Exporta reportes en Excel o PDF</p>
      </div>

      <Tabs defaultValue="inventario">
        <TabsList>
          <TabsTrigger value="inventario">Inventario</TabsTrigger>
          <TabsTrigger value="depreciacion">Depreciación</TabsTrigger>
          <TabsTrigger value="bajas">Bajas</TabsTrigger>
          <TabsTrigger value="categorias">Por Categoría</TabsTrigger>
        </TabsList>

        {/* ── INVENTARIO ── */}
        <TabsContent value="inventario" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex gap-3">
              <Select value={filtroUbicacion} onValueChange={setFiltroUbicacion}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Ubicación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las ubicaciones</SelectItem>
                  {ubicaciones.map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>{u.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las categorías</SelectItem>
                  {categorias.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportarInventarioExcel}>
                <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                Excel
              </Button>
              <Button variant="outline" onClick={exportarInventarioPDF}>
                <FileText className="h-4 w-4 mr-2 text-red-600" />
                PDF
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Inventario General — {activosFiltrados.length} activos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Responsable</TableHead>
                    <TableHead>Costo</TableHead>
                    <TableHead>Valor Libro</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activosFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-slate-400">
                        No hay activos
                      </TableCell>
                    </TableRow>
                  ) : (
                    activosFiltrados.map((a: any) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-mono text-sm">{a.codigo}</TableCell>
                        <TableCell className="font-medium">{a.nombre}</TableCell>
                        <TableCell>{a.categoria?.nombre}</TableCell>
                        <TableCell>{a.ubicacion?.nombre}</TableCell>
                        <TableCell>{a.responsable?.nombre ?? "—"}</TableCell>
                        <TableCell>{formatCurrency(Number(a.costoAdquisicion))}</TableCell>
                        <TableCell className="font-medium text-blue-600">
                          {formatCurrency(Number(a.valorLibro))}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            a.estado === "ACTIVO" ? "bg-green-100 text-green-800" :
                            a.estado === "EN_MANTENIMIENTO" ? "bg-yellow-100 text-yellow-800" :
                            "bg-red-100 text-red-800"
                          }`}>
                            {a.estado}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── DEPRECIACIÓN ── */}
        <TabsContent value="depreciacion" className="space-y-4">
          <div className="flex items-center justify-between">
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
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportarDepreciacionExcel}>
                <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                Excel
              </Button>
              <Button variant="outline" onClick={exportarDepreciacionPDF}>
                <FileText className="h-4 w-4 mr-2 text-red-600" />
                PDF
              </Button>
            </div>
          </div>

          <Card>
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
                          <div>{d.activo?.nombre}</div>
                          <div className="text-xs text-slate-400 font-mono">{d.activo?.codigo}</div>
                        </TableCell>
                        <TableCell>{d.activo?.categoria?.nombre}</TableCell>
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
        </TabsContent>

        {/* ── BAJAS ── */}
        <TabsContent value="bajas" className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={exportarBajasExcel}>
              <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
              Excel
            </Button>
            <Button variant="outline" onClick={exportarBajasPDF}>
              <FileText className="h-4 w-4 mr-2 text-red-600" />
              PDF
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Activo</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Valor Baja</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bajas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                        No hay bajas registradas
                      </TableCell>
                    </TableRow>
                  ) : (
                    bajas.map((b: any) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">
                          <div>{b.activo?.nombre}</div>
                          <div className="text-xs text-slate-400 font-mono">{b.activo?.codigo}</div>
                        </TableCell>
                        <TableCell>{b.activo?.categoria?.nombre}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {b.motivo}
                          </span>
                        </TableCell>
                        <TableCell>{formatCurrency(Number(b.valorBaja))}</TableCell>
                        <TableCell>{format(new Date(b.fecha), "dd/MM/yyyy")}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── POR CATEGORÍA ── */}
        <TabsContent value="categorias" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categorias.map((cat: any) => {
              const activosCat = activos.filter(a => a.categoriaId === cat.id)
              const valorTotal = activosCat.reduce((acc, a) => acc + Number(a.valorLibro), 0)
              const costoTotal = activosCat.reduce((acc, a) => acc + Number(a.costoAdquisicion), 0)
              return (
                <Card key={cat.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600">{cat.nombre}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{activosCat.length}</p>
                    <p className="text-xs text-slate-500 mt-1">activos</p>
                    <div className="mt-3 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Costo total:</span>
                        <span className="font-medium">{formatCurrency(costoTotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Valor libro:</span>
                        <span className="font-medium text-blue-600">{formatCurrency(valorTotal)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}