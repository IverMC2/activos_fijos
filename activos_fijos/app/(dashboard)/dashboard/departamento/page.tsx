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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Loader2, Building2, Pencil, Trash2 } from "lucide-react"

const schema = z.object({
  nombre: z.string().min(1, "Requerido"),
  ciudad: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function DepartamentosPage() {
  const [departamentos, setDepartamentos] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [editando, setEditando] = useState<any>(null)
  const [openEditar, setOpenEditar] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: "", ciudad: "" },
  })

  const formEditar = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: "", ciudad: "" },
  })

  function cargar() {
    fetch("/api/departamentos").then(r => r.json()).then(setDepartamentos)
  }

  useEffect(() => { cargar() }, [])

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      const res = await fetch("/api/departamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) { toast.error("Error al guardar"); return }
      toast.success("Departamento creado")
      form.reset()
      setOpen(false)
      cargar()
    } catch {
      toast.error("Error inesperado")
    } finally {
      setLoading(false)
    }
  }

  function abrirEditar(d: any) {
    formEditar.reset({ nombre: d.nombre, ciudad: d.ciudad ?? "" })
    setEditando(d)
    setOpenEditar(true)
  }

  async function onEditar(data: FormData) {
    setLoading(true)
    try {
      const res = await fetch(`/api/departamentos/${editando.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) { toast.error("Error al actualizar"); return }
      toast.success("Departamento actualizado")
      setOpenEditar(false)
      cargar()
    } catch {
      toast.error("Error inesperado")
    } finally {
      setLoading(false)
    }
  }

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar este departamento?")) return
    const res = await fetch(`/api/departamentos/${id}`, { method: "DELETE" })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); return }
    toast.success("Departamento eliminado")
    cargar()
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Departamentos</h1>
          <p className="text-slate-500">{departamentos.length} departamentos registrados</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Nuevo Departamento</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nuevo Departamento</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="nombre" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl><Input placeholder="Ej: Departamento La Paz" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="ciudad" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ciudad</FormLabel>
                    <FormControl><Input placeholder="Ej: La Paz" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Guardar
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
                <TableHead>Nombre</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead>Ubicaciones</TableHead>
                <TableHead>Usuarios</TableHead>
                <TableHead className="w-24">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departamentos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                    No hay departamentos registrados
                  </TableCell>
                </TableRow>
              ) : (
                departamentos.map((d: any) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-400" />
                      {d.nombre}
                    </TableCell>
                    <TableCell className="text-slate-600">{d.ciudad ?? "—"}</TableCell>
                    <TableCell>{d._count.ubicaciones}</TableCell>
                    <TableCell>{d._count.usuarios}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => abrirEditar(d)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => eliminar(d.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog editar */}
      <Dialog open={openEditar} onOpenChange={setOpenEditar}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Departamento</DialogTitle></DialogHeader>
          <Form {...formEditar}>
            <form onSubmit={formEditar.handleSubmit(onEditar)} className="space-y-4">
              <FormField control={formEditar.control} name="nombre" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={formEditar.control} name="ciudad" render={({ field }) => (
                <FormItem>
                  <FormLabel>Ciudad</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpenEditar(false)}>Cancelar</Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Guardar
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}