"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Loader2, Printer } from "lucide-react"
import { format } from "date-fns"
import { formatCurrency } from "@/lib/utils"

const schema = z.object({
  activoId: z.string().min(1, "Requerido"),
  motivo: z.enum(["VENTA", "DETERIORO", "ROBO", "OBSOLESCENCIA"]),
  descripcion: z.string().optional(),
  valorBaja: z.coerce.number().min(0),
})

type FormData = z.infer<typeof schema>

const motivoColors: Record<string, string> = {
  VENTA: "bg-green-100 text-green-800",
  DETERIORO: "bg-orange-100 text-orange-800",
  ROBO: "bg-red-100 text-red-800",
  OBSOLESCENCIA: "bg-slate-100 text-slate-800",
}

export default function BajasPage() {
  const [bajas, setBajas] = useState<any[]>([])
  const [activos, setActivos] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      activoId: "",
      motivo: "DETERIORO",
      descripcion: "",
      valorBaja: 0,
    },
  })

  function cargar() {
    Promise.all([
      fetch("/api/bajas").then(r => r.json()),
      fetch("/api/activos?estado=ACTIVO&limit=200").then(r => r.json()),
    ]).then(([bajas, acts]) => {
      setBajas(bajas)
      setActivos(acts.activos ?? [])
    })
  }

  useEffect(() => { cargar() }, [])

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      const res = await fetch(`/api/activos/${data.activoId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          motivo: data.motivo,
          descripcion: data.descripcion,
          valorBaja: data.valorBaja,
        }),
      })
      if (!res.ok) { toast.error("Error al registrar baja"); return }
      toast.success("Baja registrada correctamente")
      form.reset()
      setOpen(false)
      cargar()
    } catch {
      toast.error("Error inesperado")
    } finally {
      setLoading(false)
    }
  }

  function imprimirActa(baja: any) {
    const ventana = window.open("", "_blank")
    if (!ventana) return
    ventana.document.write(`
      <html>
        <head>
          <title>Acta de Baja - ${baja.activo.codigo}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            td, th { border: 1px solid #ccc; padding: 8px 12px; }
            th { background: #f1f5f9; }
            .firma { margin-top: 60px; display: flex; justify-content: space-around; }
            .firma div { text-align: center; border-top: 1px solid #000; padding-top: 8px; width: 200px; }
          </style>
        </head>
        <body>
          <h1>ACTA DE BAJA DE ACTIVO FIJO</h1>
          <p><strong>Fecha:</strong> ${format(new Date(baja.fecha), "dd/MM/yyyy")}</p>
          <table>
            <tr><th>Campo</th><th>Valor</th></tr>
            <tr><td>Código</td><td>${baja.activo.codigo}</td></tr>
            <tr><td>Nombre</td><td>${baja.activo.nombre}</td></tr>
            <tr><td>Categoría</td><td>${baja.activo.categoria.nombre}</td></tr>
            <tr><td>Motivo de Baja</td><td>${baja.motivo}</td></tr>
            <tr><td>Descripción</td><td>${baja.descripcion ?? "—"}</td></tr>
            <tr><td>Valor de Baja</td><td>${formatCurrency(Number(baja.valorBaja))}</td></tr>
          </table>
          <div class="firma">
            <div>Responsable</div>
            <div>Autorizado por</div>
          </div>
        </body>
      </html>
    `)
    ventana.document.close()
    ventana.print()
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bajas de Activos</h1>
          <p className="text-slate-500">{bajas.length} activos dados de baja</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive"><Plus className="h-4 w-4 mr-2" />Registrar Baja</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Registrar Baja de Activo</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="activoId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activo *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Seleccionar activo" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activos.map((a: any) => (
                          <SelectItem key={a.id} value={a.id}>{a.codigo} — {a.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="motivo" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="VENTA">Venta</SelectItem>
                        <SelectItem value="DETERIORO">Deterioro</SelectItem>
                        <SelectItem value="ROBO">Robo</SelectItem>
                        <SelectItem value="OBSOLESCENCIA">Obsolescencia</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="descripcion" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl><Textarea placeholder="Detalle del motivo..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="valorBaja" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor de Baja (Bs.)</FormLabel>
                    <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button type="submit" variant="destructive" disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Registrar Baja
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
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
                <TableHead>Acta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bajas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                    No hay bajas registradas
                  </TableCell>
                </TableRow>
              ) : (
                bajas.map((b: any) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">
                      <div>{b.activo.nombre}</div>
                      <div className="text-xs text-slate-400 font-mono">{b.activo.codigo}</div>
                    </TableCell>
                    <TableCell className="text-slate-600">{b.activo.categoria.nombre}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${motivoColors[b.motivo]}`}>
                        {b.motivo}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(Number(b.valorBaja))}</TableCell>
                    <TableCell>{format(new Date(b.fecha), "dd/MM/yyyy")}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => imprimirActa(b)}>
                        <Printer className="h-4 w-4" />
                      </Button>
                    </TableCell>
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