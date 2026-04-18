import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, MapPin, User, Calendar, DollarSign, Wrench, ArrowRight, XCircle, TrendingDown, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default async function ActivoPublicPage({ 
  params 
}: { 
  params: Promise<{ codigo: string }> 
}) {
  const { codigo } = await params
  
  const activo = await prisma.activo.findUnique({
    where: { codigo },
    include: {
      categoria: true,
      ubicacion: {
        include: { departamento: true }
      },
      responsable: { select: { nombre: true, email: true } },
      proveedor: true,
      documentos: true,
      depreciaciones: {
        orderBy: [{ anio: "desc" }, { mes: "desc" }],
        take: 12,
      },
      mantenimientos: {
        orderBy: { fecha: "desc" },
        take: 5,
        include: {
          proveedor: { select: { nombre: true } }
        }
      },
      traslados: {
        orderBy: { fecha: "desc" },
        take: 5,
        include: {
          ubicacionOrigen: { select: { nombre: true } },
          responsable: { select: { nombre: true } }
        }
      },
      baja: true,
    },
  })

  if (!activo) notFound()

  // Buscar la foto principal del activo
  const fotoActivo = activo.documentos.find(d => d.tipo === "FOTO")?.url
  const factura = activo.documentos.find(d => d.tipo === "FACTURA")
  const garantia = activo.documentos.find(d => d.tipo === "GARANTIA")

  // Calcular depreciación anual
  const depreciacionAnual = activo.depreciaciones.reduce((sum, d) => sum + Number(d.cuotaMensual), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header con foto */}
        <Card className="shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2 mb-2">
                  <Package className="h-6 w-6" />
                  {activo.nombre}
                </CardTitle>
                <p className="text-blue-100">Código: {activo.codigo}</p>
              </div>
              <Badge className={
                activo.estado === "ACTIVO" 
                  ? "bg-green-500" 
                  : activo.estado === "EN_MANTENIMIENTO"
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }>
                {activo.estado.replace(/_/g, " ")}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            {/* Foto del activo */}
            {fotoActivo && (
              <div className="relative w-full h-80 bg-slate-100 rounded-lg overflow-hidden mb-6">
                <Image
                  src={fotoActivo}
                  alt={activo.nombre}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 896px"
                  priority
                />
              </div>
            )}

            {/* Descripción */}
            {activo.descripcion && (
              <div className="mb-6">
                <p className="text-slate-700 text-lg">{activo.descripcion}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Información General */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Información General
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-slate-500 mt-1" />
              <div>
                <p className="text-sm text-slate-500">Categoría</p>
                <p className="font-medium">{activo.categoria.nombre}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-slate-500 mt-1" />
              <div>
                <p className="text-sm text-slate-500">Ubicación</p>
                <p className="font-medium">{activo.ubicacion.nombre}</p>
                {activo.ubicacion.departamento && (
                  <p className="text-sm text-slate-500">{activo.ubicacion.departamento.nombre}</p>
                )}
              </div>
            </div>

            {activo.responsable && (
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-slate-500 mt-1" />
                <div>
                  <p className="text-sm text-slate-500">Responsable</p>
                  <p className="font-medium">{activo.responsable.nombre}</p>
                  {activo.responsable.email && (
                    <p className="text-sm text-slate-500">{activo.responsable.email}</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-slate-500 mt-1" />
              <div>
                <p className="text-sm text-slate-500">Fecha de Compra</p>
                <p className="font-medium">
                  {new Date(activo.fechaCompra).toLocaleDateString()}
                </p>
              </div>
            </div>

            {activo.proveedor && (
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-slate-500 mt-1" />
                <div>
                  <p className="text-sm text-slate-500">Proveedor</p>
                  <p className="font-medium">{activo.proveedor.nombre}</p>
                </div>
              </div>
            )}

            {activo.numeroFactura && (
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-slate-500 mt-1" />
                <div>
                  <p className="text-sm text-slate-500">N° Factura</p>
                  <p className="font-medium">{activo.numeroFactura}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detalles Técnicos */}
        {(activo.marca || activo.modelo || activo.numeroSerie) && (
          <Card>
            <CardHeader>
              <CardTitle>Detalles Técnicos</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {activo.marca && (
                <div>
                  <p className="text-sm text-slate-500">Marca</p>
                  <p className="font-medium">{activo.marca}</p>
                </div>
              )}
              {activo.modelo && (
                <div>
                  <p className="text-sm text-slate-500">Modelo</p>
                  <p className="font-medium">{activo.modelo}</p>
                </div>
              )}
              {activo.numeroSerie && (
                <div>
                  <p className="text-sm text-slate-500">Número de Serie</p>
                  <p className="font-medium">{activo.numeroSerie}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Información Financiera */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Información Financiera
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-slate-500">Costo de Adquisición</p>
              <p className="text-2xl font-bold text-slate-900">
                Bs. {Number(activo.costoAdquisicion).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Valor Libro Actual</p>
              <p className="text-2xl font-bold text-blue-600">
                Bs. {Number(activo.valorLibro).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Valor Residual</p>
              <p className="text-2xl font-bold text-slate-700">
                Bs. {Number(activo.valorResidual).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Vida Útil</p>
              <p className="text-2xl font-bold text-slate-900">
                {activo.vidaUtilAnios} años
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Depreciación */}
        {activo.depreciaciones.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                Depreciación (Últimos 12 meses)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-slate-50 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Método</p>
                    <p className="font-medium">{activo.metodoDepreciacion}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Depreciación Anual</p>
                    <p className="font-medium">Bs. {depreciacionAnual.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Depreciación Acumulada</p>
                    <p className="font-medium">
                      Bs. {Number(activo.depreciaciones[0]?.depreciacionAcum || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left p-2 text-sm font-medium">Período</th>
                      <th className="text-right p-2 text-sm font-medium">Cuota Mensual</th>
                      <th className="text-right p-2 text-sm font-medium">Dep. Acumulada</th>
                      <th className="text-right p-2 text-sm font-medium">Valor Libro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activo.depreciaciones.map((dep) => (
                      <tr key={dep.id} className="border-t">
                        <td className="p-2 text-sm">
                          {dep.mes.toString().padStart(2, "0")}/{dep.anio}
                        </td>
                        <td className="p-2 text-sm text-right">
                          Bs. {Number(dep.cuotaMensual).toLocaleString()}
                        </td>
                        <td className="p-2 text-sm text-right">
                          Bs. {Number(dep.depreciacionAcum).toLocaleString()}
                        </td>
                        <td className="p-2 text-sm text-right font-medium">
                          Bs. {Number(dep.valorLibro).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Historial de Mantenimientos */}
        {activo.mantenimientos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Historial de Mantenimientos (Últimos 5)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activo.mantenimientos.map((mant) => (
                  <div key={mant.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <Wrench className="h-5 w-5 text-slate-500 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant={mant.tipo === "PREVENTIVO" ? "default" : "destructive"}>
                          {mant.tipo}
                        </Badge>
                        <span className="text-sm text-slate-500">
                          {new Date(mant.fecha).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700">{mant.descripcion}</p>
                      {mant.costo && (
                        <p className="text-sm text-slate-600 mt-1">
                          Costo: Bs. {Number(mant.costo).toLocaleString()}
                        </p>
                      )}
                      {mant.proveedor && (
                        <p className="text-xs text-slate-500 mt-1">
                          Proveedor: {mant.proveedor.nombre}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Historial de Traslados */}
        {activo.traslados.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5" />
                Historial de Traslados (Últimos 5)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activo.traslados.map((tras) => (
                  <div key={tras.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <ArrowRight className="h-5 w-5 text-slate-500 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">
                          {tras.ubicacionOrigen.nombre} → {activo.ubicacion.nombre}
                        </span>
                        <span className="text-sm text-slate-500">
                          {new Date(tras.fecha).toLocaleDateString()}
                        </span>
                      </div>
                      {tras.motivo && (
                        <p className="text-sm text-slate-700">{tras.motivo}</p>
                      )}
                      {tras.responsable && (
                        <p className="text-xs text-slate-500 mt-1">
                          Responsable: {tras.responsable.nombre}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Baja (si aplica) */}
        {activo.baja && (
          <Card className="border-red-200">
            <CardHeader className="bg-red-50">
              <CardTitle className="flex items-center gap-2 text-red-700">
                <XCircle className="h-5 w-5" />
                Activo Dado de Baja
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Motivo</p>
                  <p className="font-medium">{activo.baja.motivo}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Fecha de Baja</p>
                  <p className="font-medium">
                    {new Date(activo.baja.fecha).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Valor de Baja</p>
                  <p className="font-medium">
                    Bs. {Number(activo.baja.valorBaja).toLocaleString()}
                  </p>
                </div>
              </div>
              {activo.baja.descripcion && (
                <div className="mt-4">
                  <p className="text-sm text-slate-500">Descripción</p>
                  <p className="text-slate-700">{activo.baja.descripcion}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Documentos */}
        {activo.documentos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentos Adjuntos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {factura && (
                  <a 
                    href={factura.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition"
                  >
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">Factura</p>
                      <p className="text-xs text-slate-500">Ver documento</p>
                    </div>
                  </a>
                )}
                {garantia && (
                  <a 
                    href={garantia.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition"
                  >
                    <FileText className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">Garantía</p>
                      <p className="text-xs text-slate-500">Ver documento</p>
                    </div>
                  </a>
                )}
                {activo.documentos.filter(d => d.tipo === "OTRO").map(doc => (
                  <a 
                    key={doc.id}
                    href={doc.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition"
                  >
                    <FileText className="h-5 w-5 text-slate-600" />
                    <div>
                      <p className="text-sm font-medium">{doc.nombre}</p>
                      <p className="text-xs text-slate-500">Ver documento</p>
                    </div>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* QR Code */}
        <Card>
          <CardHeader>
            <CardTitle>Código QR del Activo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <img
              src={`/api/activos/${activo.codigo}/qr`}
              alt={`QR ${activo.codigo}`}
              className="w-48 h-48"
            />
            <p className="text-sm text-slate-600 text-center">
              Escanea este código para acceder a esta página
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-slate-500 space-y-1">
          <p>Sistema de Control de Activos Fijos</p>
          <p className="text-xs">Última actualización: {new Date(activo.actualizadoEn).toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}