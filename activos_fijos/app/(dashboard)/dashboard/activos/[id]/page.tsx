"use client"

import { useEffect, useState } from "react"
import { DocumentoUpload } from "@/components/activos/documento-upload"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import QRCode from "react-qr-code"
import { ArrowLeft, Pencil, Trash2, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
const estadoColors: Record<string, string> = {
  ACTIVO: "bg-green-100 text-green-800",
  EN_MANTENIMIENTO: "bg-yellow-100 text-yellow-800",
  DADO_DE_BAJA: "bg-red-100 text-red-800",
}

const estadoLabels: Record<string, string> = {
  ACTIVO: "Activo",
  EN_MANTENIMIENTO: "En Mantenimiento",
  DADO_DE_BAJA: "Dado de Baja",
}

export default function ActivoDetallePage() {
  const [loadingBaja, setLoadingBaja] = useState(false)
const [openBaja, setOpenBaja] = useState(false)
const [motivoBaja, setMotivoBaja] = useState<string>("DETERIORO")
const [descripcionBaja, setDescripcionBaja] = useState("")
const [valorBaja, setValorBaja] = useState(0)

async function handleBaja() {
  setLoadingBaja(true)
  try {
    const res = await fetch(`/api/activos/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        motivo: motivoBaja,
        descripcion: descripcionBaja,
        valorBaja,
      }),
    })
    if (!res.ok) { toast.error("Error al registrar baja"); return }
    toast.success("Activo dado de baja")
    router.push("/dashboard/activos")
  } catch {
    toast.error("Error inesperado")
  } finally {
    setLoadingBaja(false)
  }
}
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [activo, setActivo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/activos/${id}`)
      .then(r => r.json())
      .then(setActivo)
      .catch(() => toast.error("Error al cargar el activo"))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="p-6 text-slate-400">Cargando...</div>
  if (!activo) return <div className="p-6 text-slate-400">Activo no encontrado</div>

  const depAcum = activo.depreciaciones[0]?.depreciacionAcum ?? 0
  const porcentajeDepreciado = ((Number(activo.costoAdquisicion) - Number(activo.valorLibro)) / Number(activo.costoAdquisicion)) * 100

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{activo.nombre}</h1>
            <p className="text-slate-500 font-mono">{activo.codigo}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${estadoColors[activo.estado]}`}>
            {estadoLabels[activo.estado]}
          </span>
          <Link href={`/dashboard/activos/${id}/editar`}>
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
        </div>
        {activo.estado !== "DADO_DE_BAJA" && (
  <Dialog open={openBaja} onOpenChange={setOpenBaja}>
    <DialogTrigger asChild>
      <Button variant="destructive" size="sm">
        <Trash2 className="h-4 w-4 mr-2" />
        Dar de Baja
      </Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Dar de Baja: {activo.nombre}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Motivo *</label>
          <Select value={motivoBaja} onValueChange={setMotivoBaja}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="VENTA">Venta</SelectItem>
              <SelectItem value="DETERIORO">Deterioro</SelectItem>
              <SelectItem value="ROBO">Robo</SelectItem>
              <SelectItem value="OBSOLESCENCIA">Obsolescencia</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Descripción</label>
          <Textarea
            placeholder="Detalle del motivo..."
            value={descripcionBaja}
            onChange={(e) => setDescripcionBaja(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Valor de Baja (Bs.)</label>
          <Input
            type="number"
            step="0.01"
            value={valorBaja}
            onChange={(e) => setValorBaja(Number(e.target.value))}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpenBaja(false)}>Cancelar</Button>
          <Button variant="destructive" onClick={handleBaja} disabled={loadingBaja}>
            {loadingBaja && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirmar Baja
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
)}
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500">Costo Original</p>
            <p className="text-lg font-bold">{formatCurrency(Number(activo.costoAdquisicion))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500">Valor Libro</p>
            <p className="text-lg font-bold text-blue-600">{formatCurrency(Number(activo.valorLibro))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500">Depreciado</p>
            <p className="text-lg font-bold text-red-500">{porcentajeDepreciado.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500">Vida Útil</p>
            <p className="text-lg font-bold">{activo.vidaUtilAnios} años</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="depreciacion">Depreciación</TabsTrigger>
          <TabsTrigger value="mantenimiento">Mantenimiento</TabsTrigger>
          <TabsTrigger value="traslados">Traslados</TabsTrigger>
          <TabsTrigger value="qr">Código QR</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
        </TabsList>

        {/* Info */}
        <TabsContent value="info">
          <Card>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "Categoría", value: activo.categoria.nombre },
                { label: "Marca", value: activo.marca ?? "—" },
                { label: "Modelo", value: activo.modelo ?? "—" },
                { label: "N° Serie", value: activo.numeroSerie ?? "—" },
                { label: "Fecha Compra", value: format(new Date(activo.fechaCompra), "dd/MM/yyyy") },
                { label: "N° Factura", value: activo.numeroFactura ?? "—" },
                { label: "Proveedor", value: activo.proveedor?.nombre ?? "—" },
                { label: "Ubicación", value: activo.ubicacion.nombre },
                { label: "Responsable", value: activo.responsable?.nombre ?? "—" },
                { label: "Método Depreciación", value: activo.metodoDepreciacion === "LINEAL" ? "Línea Recta" : "Acelerado" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="font-medium text-slate-900">{value}</p>
                </div>
              ))}
              {activo.descripcion && (
                <div className="md:col-span-2">
                  <p className="text-xs text-slate-500">Descripción</p>
                  <p className="font-medium text-slate-900">{activo.descripcion}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Depreciación */}
        <TabsContent value="depreciacion">
          <Card>
            <CardHeader><CardTitle className="text-base">Historial de Depreciación</CardTitle></CardHeader>
            <CardContent>
              {activo.depreciaciones.length === 0 ? (
                <p className="text-slate-400 text-center py-8">Sin registros de depreciación aún</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-slate-500">
                      <th className="text-left py-2">Período</th>
                      <th className="text-right py-2">Cuota</th>
                      <th className="text-right py-2">Dep. Acumulada</th>
                      <th className="text-right py-2">Valor Libro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activo.depreciaciones.map((d: any) => (
                      <tr key={d.id} className="border-b hover:bg-slate-50">
                        <td className="py-2">{String(d.mes).padStart(2, "0")}/{d.anio}</td>
                        <td className="text-right py-2">{formatCurrency(Number(d.cuotaMensual))}</td>
                        <td className="text-right py-2">{formatCurrency(Number(d.depreciacionAcum))}</td>
                        <td className="text-right py-2 font-medium">{formatCurrency(Number(d.valorLibro))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mantenimiento */}
        <TabsContent value="mantenimiento">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Historial de Mantenimiento</CardTitle>
                <Link href={`/dashboard/mantenimiento/nuevo?activoId=${id}`}>
                  <Button size="sm">Registrar</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {activo.mantenimientos.length === 0 ? (
                <p className="text-slate-400 text-center py-8">Sin registros de mantenimiento</p>
              ) : (
                <div className="space-y-3">
                  {activo.mantenimientos.map((m: any) => (
                    <div key={m.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${m.tipo === "PREVENTIVO" ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800"}`}>
                          {m.tipo}
                        </span>
                        <span className="text-sm text-slate-500">{format(new Date(m.fecha), "dd/MM/yyyy")}</span>
                      </div>
                      <p className="text-sm text-slate-700">{m.descripcion}</p>
                      {m.costo && <p className="text-sm font-medium mt-1">Costo: {formatCurrency(Number(m.costo))}</p>}
                      {m.proximaFecha && <p className="text-xs text-slate-500 mt-1">Próximo: {format(new Date(m.proximaFecha), "dd/MM/yyyy")}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Traslados */}
        <TabsContent value="traslados">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Historial de Traslados</CardTitle>
                <Link href={`/dashboard/traslados/nuevo?activoId=${id}`}>
                  <Button size="sm">Registrar Traslado</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {activo.traslados.length === 0 ? (
                <p className="text-slate-400 text-center py-8">Sin traslados registrados</p>
              ) : (
                <div className="space-y-3">
                  {activo.traslados.map((t: any) => (
                    <div key={t.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Desde: {t.ubicacionOrigen.nombre}</p>
                        <span className="text-sm text-slate-500">{format(new Date(t.fecha), "dd/MM/yyyy")}</span>
                      </div>
                      {t.motivo && <p className="text-sm text-slate-600 mt-1">{t.motivo}</p>}
                      {t.responsable && <p className="text-xs text-slate-500 mt-1">Responsable: {t.responsable.nombre}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* QR */}
        <TabsContent value="qr">
          <Card>
            <CardHeader><CardTitle className="text-base">Código QR del Activo</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center gap-4 py-6">
              <QRCode value={activo.codigo} size={200} />
              <div className="text-center">
                <p className="font-mono font-bold text-lg">{activo.codigo}</p>
                <p className="text-slate-500">{activo.nombre}</p>
              </div>
              <Button
                variant="outline"
                onClick={() => window.print()}
              >
                Imprimir Etiqueta
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="documentos">
  <Card>
    <CardHeader>
      <CardTitle className="text-base">Documentos Adjuntos</CardTitle>
    </CardHeader>
    <CardContent>
      <DocumentoUpload
        activoId={activo.id}
        documentos={activo.documentos}
        onUpload={(doc) => setActivo((prev: any) => ({
          ...prev,
          documentos: [...prev.documentos, doc]
        }))}
      />
    </CardContent>
  </Card>
</TabsContent>
      </Tabs>
    </div>
  )
}