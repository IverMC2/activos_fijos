"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, MapPin, Pencil, Trash2, Loader2 } from "lucide-react"


const schema = z.object({
  nombre: z.string().min(1, "Requerido"),
  tipo: z.enum(["sucursal", "area", "departamento"]),
  parentId: z.string().optional(),
  departamentoId: z.string().min(1, "Requerido"),
})
type FormData = z.infer<typeof schema>

export default function UbicacionesPage() {
  const [ubicaciones, setUbicaciones] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
const [departamentos, setDepartamentos] = useState<any[]>([])
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: "", tipo: "sucursal", parentId: "none", departamentoId: "" }

  })

  function cargar() {
  Promise.all([
    fetch("/api/ubicaciones").then(r => r.json()),
    fetch("/api/departamentos").then(r => r.json()),
  ]).then(([ubics, depts]) => {
    setUbicaciones(ubics)
    setDepartamentos(depts)
  })
}

  useEffect(() => { cargar() }, [])

  async function onSubmit(data: FormData) {
  setLoading(true)
  try {
    const res = await fetch("/api/ubicaciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: data.nombre,
        tipo: data.tipo,
        parentId: data.parentId === "none" ? undefined : data.parentId,
        departamentoId: data.departamentoId === "none" ? undefined : data.departamentoId || undefined,
      }),
    })
    if (!res.ok) { toast.error("Error al guardar"); return }
    toast.success("Ubicación creada")
    form.reset()
    setOpen(false)
    cargar()
  } catch {
    toast.error("Error inesperado")
  } finally {
    setLoading(false)
  }
}

  const tipoLabels: Record<string, string> = {
    sucursal: "Sucursal",
    area: "Área",
    departamento: "Departamento",
  }
  const [editando, setEditando] = useState<any>(null)
const [openEditar, setOpenEditar] = useState(false)

const formEditar = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: { nombre: "", tipo: "sucursal", parentId: "none" },
})

function abrirEditar(u: any) {
  formEditar.reset({
    nombre: u.nombre,
    tipo: u.tipo,
    parentId: u.parentId ?? "none",
    departamentoId: u.departamentoId ?? "",
  })
  setEditando(u)
  setOpenEditar(true)
}
async function onEditar(data: FormData) {
  setLoading(true)
  try {
    const res = await fetch(`/api/ubicaciones/${editando.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        parentId: data.parentId === "none" ? undefined : data.parentId,
      }),
    })
    if (!res.ok) { toast.error("Error al actualizar"); return }
    toast.success("Ubicación actualizada")
    setOpenEditar(false)
    cargar()
  } catch {
    toast.error("Error inesperado")
  } finally {
    setLoading(false)
  }
}

async function eliminarUbicacion(id: string) {
  if (!confirm("¿Eliminar esta ubicación?")) return
  const res = await fetch(`/api/ubicaciones/${id}`, { method: "DELETE" })
  const data = await res.json()
  if (!res.ok) { toast.error(data.error); return }
  toast.success("Ubicación eliminada")
  cargar()
}

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ubicaciones</h1>
          <p className="text-slate-500">{ubicaciones.length} ubicaciones registradas</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Nueva Ubicación</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Ubicación</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="nombre" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl><Input placeholder="Ej: Oficina Central" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="tipo" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sucursal">Sucursal</SelectItem>
                        <SelectItem value="area">Área</SelectItem>
                        <SelectItem value="departamento">Departamento</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="parentId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Depende de</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Ninguna (nivel raíz)" /></SelectTrigger>
                      </FormControl><SelectContent>
  <SelectItem value="none">Ninguna (nivel raíz)</SelectItem>
  {ubicaciones.map((u: any) => (
    <SelectItem key={u.id} value={u.id}>{u.nombre}</SelectItem>
  ))}
</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="departamentoId" render={({ field }) => (
  <FormItem>
    <FormLabel>Departamento *</FormLabel>
    <Select onValueChange={field.onChange} value={field.value}>
      <FormControl>
        <SelectTrigger><SelectValue placeholder="Seleccionar departamento" /></SelectTrigger>
      </FormControl>
      <SelectContent>
        {departamentos.map((d: any) => (
          <SelectItem key={d.id} value={d.id}>{d.nombre}</SelectItem>
        ))}
      </SelectContent>
    </Select>
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
                <TableHead>Tipo</TableHead>
                <TableHead>Depende de</TableHead>
                <TableHead>Sub-ubicaciones</TableHead>
                <TableHead>Departamento</TableHead>

                <TableHead className="w-24">Acciones</TableHead>
                
              </TableRow>
            </TableHeader>
            <TableBody>
              {ubicaciones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-slate-400">
                    No hay ubicaciones registradas
                  </TableCell>
                </TableRow>
              ) : (
                ubicaciones.map((u: any) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      {u.nombre}
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {tipoLabels[u.tipo]}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {ubicaciones.find((p: any) => p.id === u.parentId)?.nombre ?? "—"}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {u.hijos?.length ?? 0}
                    </TableCell>
                    <TableCell className="text-slate-600">{u.departamento?.nombre ?? "—"}</TableCell>

                    <TableCell>
  <div className="flex gap-1">
    <Button variant="ghost" size="icon" onClick={() => abrirEditar(u)}>
      <Pencil className="h-4 w-4" />
    </Button>
    <Button variant="ghost" size="icon" onClick={() => eliminarUbicacion(u.id)}>
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
      <Dialog open={openEditar} onOpenChange={setOpenEditar}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Editar Ubicación</DialogTitle>
    </DialogHeader>
    <Form {...formEditar}>
      <form onSubmit={formEditar.handleSubmit(onEditar)} className="space-y-4">
        <FormField control={formEditar.control} name="nombre" render={({ field }) => (
          <FormItem>
            <FormLabel>Nombre *</FormLabel>
            <FormControl><Input {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={formEditar.control} name="tipo" render={({ field }) => (
          <FormItem>
            <FormLabel>Tipo *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="sucursal">Sucursal</SelectItem>
                <SelectItem value="area">Área</SelectItem>
                <SelectItem value="departamento">Departamento</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={formEditar.control} name="parentId" render={({ field }) => (
          <FormItem>
            <FormLabel>Depende de</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="none">Ninguna</SelectItem>
                {ubicaciones
                  .filter(u => u.id !== editando?.id)
                  .map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>{u.nombre}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="departamentoId" render={({ field }) => (
  <FormItem>
    <FormLabel>Departamento *</FormLabel>
    <Select onValueChange={field.onChange} value={field.value}>
      <FormControl>
        <SelectTrigger><SelectValue placeholder="Seleccionar departamento" /></SelectTrigger>
      </FormControl>
      <SelectContent>
        {departamentos.map((d: any) => (
          <SelectItem key={d.id} value={d.id}>{d.nombre}</SelectItem>
        ))}
      </SelectContent>
    </Select>
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
