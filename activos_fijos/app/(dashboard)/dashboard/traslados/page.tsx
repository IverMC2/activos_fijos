"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Loader2, ArrowLeftRight } from "lucide-react"
import { format } from "date-fns"

const schema = z.object({
  activoId: z.string().min(1, "Requerido"),
  ubicacionDestinoId: z.string().min(1, "Requerido"),
  responsableId: z.string().optional(),
  motivo: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function TrasladosPage() {
  const [traslados, setTraslados] = useState<any[]>([])
  const [activos, setActivos] = useState<any[]>([])
  const [ubicaciones, setUbicaciones] = useState<any[]>([])
  const [responsables, setResponsables] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      activoId: "",
      ubicacionDestinoId: "",
      responsableId: "",
      motivo: "",
    },
  })

  function cargar() {
    Promise.all([
      fetch("/api/traslados").then(r => r.json()),
      fetch("/api/activos?limit=100").then(r => r.json()),
      fetch("/api/ubicaciones").then(r => r.json()),
      fetch("/api/responsables").then(r => r.json()),
    ]).then(([tras, acts, ubics, resps]) => {
      setTraslados(tras)
      setActivos(acts.activos ?? [])
      setUbicaciones(ubics)
      setResponsables(resps)
    })
  }

  useEffect(() => { cargar() }, [])

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      const res = await fetch("/api/traslados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          responsableId: data.responsableId || undefined,
          motivo: data.motivo || undefined,
        }),
      })
      if (!res.ok) { toast.error("Error al registrar traslado"); return }
      toast.success("Traslado registrado")
      form.reset()
      setOpen(false)
      cargar()
    } catch {
      toast.error("Error inesperado")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Traslados</h1>
          <p className="text-slate-500">{traslados.length} traslados registrados</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Registrar Traslado</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Registrar Traslado</DialogTitle>
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
                <FormField control={form.control} name="ubicacionDestinoId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ubicación Destino *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Seleccionar destino" /></SelectTrigger>
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
                    <FormLabel>Responsable del Traslado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Seleccionar responsable" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {responsables.map((r: any) => (
                          <SelectItem key={r.id} value={r.id}>{r.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="motivo" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo</FormLabel>
                    <FormControl><Input placeholder="Motivo del traslado..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Registrar
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
                <TableHead>Desde</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {traslados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                    No hay traslados registrados
                  </TableCell>
                </TableRow>
              ) : (
                traslados.map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">
                      <div>{t.activo.nombre}</div>
                      <div className="text-xs text-slate-400 font-mono">{t.activo.codigo}</div>
                    </TableCell>
                    <TableCell className="text-slate-600">{t.ubicacionOrigen.nombre}</TableCell>
                    <TableCell className="text-slate-600">{t.responsable?.nombre ?? "—"}</TableCell>
                    <TableCell className="text-slate-600">{t.motivo ?? "—"}</TableCell>
                    <TableCell>{format(new Date(t.fecha), "dd/MM/yyyy")}</TableCell>
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