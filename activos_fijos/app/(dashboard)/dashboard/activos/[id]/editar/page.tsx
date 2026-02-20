"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, ArrowLeft } from "lucide-react"
import { format } from "date-fns"

const schema = z.object({
  nombre: z.string().min(1, "Requerido"),
  descripcion: z.string().optional(),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  numeroSerie: z.string().optional(),
  fechaCompra: z.string().min(1, "Requerido"),
  numeroFactura: z.string().optional(),
  costoAdquisicion: z.coerce.number().positive("Debe ser mayor a 0"),
  valorResidual: z.coerce.number().min(0),
  vidaUtilAnios: z.coerce.number().int().positive("Debe ser mayor a 0"),
  metodoDepreciacion: z.enum(["LINEAL", "ACELERADO"]),
  categoriaId: z.string().min(1, "Requerido"),
  ubicacionId: z.string().min(1, "Requerido"),
  responsableId: z.string().optional(),
  proveedorId: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function EditarActivoPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categorias, setCategorias] = useState<any[]>([])
  const [ubicaciones, setUbicaciones] = useState<any[]>([])
  const [proveedores, setProveedores] = useState<any[]>([])
  const [responsables, setResponsables] = useState<any[]>([])

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      marca: "",
      modelo: "",
      numeroSerie: "",
      fechaCompra: "",
      numeroFactura: "",
      costoAdquisicion: 0,
      valorResidual: 0,
      vidaUtilAnios: 1,
      metodoDepreciacion: "LINEAL",
      categoriaId: "",
      ubicacionId: "",
      responsableId: "",
      proveedorId: "",
    },
  })

  useEffect(() => {
    Promise.all([
      fetch(`/api/activos/${id}`).then(r => r.json()),
      fetch("/api/categorias").then(r => r.json()),
      fetch("/api/ubicaciones").then(r => r.json()),
      fetch("/api/proveedores").then(r => r.json()),
      fetch("/api/responsables").then(r => r.json()),
    ]).then(([activo, cats, ubics, provs, resps]) => {
      setCategorias(cats)
      setUbicaciones(ubics)
      setProveedores(provs)
      setResponsables(resps)

      form.reset({
        nombre: activo.nombre ?? "",
        descripcion: activo.descripcion ?? "",
        marca: activo.marca ?? "",
        modelo: activo.modelo ?? "",
        numeroSerie: activo.numeroSerie ?? "",
        fechaCompra: format(new Date(activo.fechaCompra), "yyyy-MM-dd"),
        numeroFactura: activo.numeroFactura ?? "",
        costoAdquisicion: Number(activo.costoAdquisicion),
        valorResidual: Number(activo.valorResidual),
        vidaUtilAnios: activo.vidaUtilAnios,
        metodoDepreciacion: activo.metodoDepreciacion,
        categoriaId: activo.categoriaId,
        ubicacionId: activo.ubicacionId,
        responsableId: activo.responsableId ?? "",
        proveedorId: activo.proveedorId ?? "",
      })
    })
  }, [id])

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      const res = await fetch(`/api/activos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
  ...data,
  responsableId: data.responsableId === "none" ? undefined : data.responsableId,
  proveedorId: data.proveedorId === "none" ? undefined : data.proveedorId,
}),
      })
      if (!res.ok) { toast.error("Error al actualizar"); return }
      toast.success("Activo actualizado correctamente")
      router.push(`/dashboard/activos/${id}`)
    } catch {
      toast.error("Error inesperado")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Editar Activo</h1>
          <p className="text-slate-500">Modifica los datos del activo</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

          <Card>
            <CardHeader><CardTitle className="text-base">Información General</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="nombre" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Nombre del Activo *</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="descripcion" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Descripción</FormLabel>
                  <FormControl><Textarea {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="marca" render={({ field }) => (
                <FormItem>
                  <FormLabel>Marca</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="modelo" render={({ field }) => (
                <FormItem>
                  <FormLabel>Modelo</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="numeroSerie" render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Serie</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="categoriaId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categorias.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Datos de Compra</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="fechaCompra" render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de Compra *</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="numeroFactura" render={({ field }) => (
                <FormItem>
                  <FormLabel>N° de Factura</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="costoAdquisicion" render={({ field }) => (
                <FormItem>
                  <FormLabel>Costo de Adquisición (Bs.) *</FormLabel>
                  <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="valorResidual" render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Residual (Bs.)</FormLabel>
                  <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="proveedorId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Proveedor</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Seleccionar proveedor" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
  <SelectItem value="none">Sin proveedor</SelectItem>
  {proveedores.map((p: any) => (
    <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
  ))}
</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Depreciación y Asignación</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="vidaUtilAnios" render={({ field }) => (
                <FormItem>
                  <FormLabel>Vida Útil (años) *</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="metodoDepreciacion" render={({ field }) => (
                <FormItem>
                  <FormLabel>Método de Depreciación</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="LINEAL">Línea Recta</SelectItem>
                      <SelectItem value="ACELERADO">Acelerado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="ubicacionId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Ubicación *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Seleccionar ubicación" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ubicaciones.map((u: any) => (
                        <SelectItem key={u.id} value={u.id}>{u.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="responsableId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsable</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Seleccionar responsable" /></SelectTrigger>
                    </FormControl>
                <SelectContent>
  <SelectItem value="none">Sin responsable</SelectItem>
  {responsables.map((r: any) => (
    <SelectItem key={r.id} value={r.id}>{r.nombre}</SelectItem>
  ))}
</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}