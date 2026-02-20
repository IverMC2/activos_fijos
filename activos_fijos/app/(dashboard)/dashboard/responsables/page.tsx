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
import { Plus, Loader2, User, Pencil, Trash2 } from "lucide-react"

const schema = z.object({
  nombre: z.string().min(1, "Requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  rol: z.enum(["ADMIN", "CONTABILIDAD", "CONSULTA"]),
  departamentoId: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const rolColors: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-800",
  CONTABILIDAD: "bg-yellow-100 text-yellow-800",
  CONSULTA: "bg-green-100 text-green-800",
}

export default function ResponsablesPage() {
  const [editando, setEditando] = useState<any>(null)
const [openEditar, setOpenEditar] = useState(false)

const [departamentos, setDepartamentos] = useState<any[]>([])
const schemaEditar = z.object({
  nombre: z.string().min(1, "Requerido"),
  email: z.string().email("Email inválido"),
  rol: z.enum(["ADMIN", "CONTABILIDAD", "CONSULTA"]),
  departamentoId: z.string().optional(),
})

type FormDataEditar = z.infer<typeof schemaEditar>

const formEditar = useForm<FormDataEditar>({
  resolver: zodResolver(schemaEditar),
  defaultValues: { nombre: "", email: "", rol: "CONSULTA", departamentoId: "" }

})

function abrirEditar(r: any) {
  formEditar.reset({
    nombre: r.nombre,
    email: r.email,
    rol: r.rol,
    departamentoId: r.departamentoId ?? "none",
  })
  setEditando(r)
  setOpenEditar(true)
}
async function onEditar(data: FormDataEditar) {
  setLoading(true)
  try {
    const res = await fetch(`/api/responsables/${editando.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
  ...data,
  departamentoId: data.departamentoId === "none" ? undefined : data.departamentoId,
}),
    })
    if (!res.ok) { toast.error("Error al actualizar"); return }
    toast.success("Responsable actualizado")
    setOpenEditar(false)
    cargar()
  } catch {
    toast.error("Error inesperado")
  } finally {
    setLoading(false)
  }
}

async function eliminarResponsable(id: string) {
  if (!confirm("¿Desactivar este responsable?")) return
  const res = await fetch(`/api/responsables/${id}`, { method: "DELETE" })
  if (!res.ok) { toast.error("Error al eliminar"); return }
  toast.success("Responsable desactivado")
  cargar()
}
  const [responsables, setResponsables] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: "", email: "", password: "", rol: "CONSULTA", departamentoId: "" }

  })

  function cargar() {
  Promise.all([
    fetch("/api/responsables").then(r => r.json()),
    fetch("/api/departamentos").then(r => r.json()),
  ]).then(([resps, depts]) => {
    setResponsables(resps)
    setDepartamentos(depts)
  })
}

  useEffect(() => { cargar() }, [])

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      const res = await fetch("/api/responsables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
  ...data,
  departamentoId: data.departamentoId === "none" ? undefined : data.departamentoId,
}),

      })
      if (!res.ok) { toast.error("Error al guardar"); return }
      toast.success("Responsable creado")
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
          <h1 className="text-2xl font-bold text-slate-900">Responsables</h1>
          <p className="text-slate-500">{responsables.length} usuarios registrados</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Nuevo Responsable</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Responsable</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="nombre" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre completo *</FormLabel>
                    <FormControl><Input placeholder="Ej: Juan Pérez" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl><Input type="email" placeholder="juan@empresa.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña *</FormLabel>
                    <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="rol" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ADMIN">Administrador</SelectItem>
                        <SelectItem value="CONTABILIDAD">Contabilidad</SelectItem>
                        <SelectItem value="CONSULTA">Consulta</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="departamentoId" render={({ field }) => (
  <FormItem>
    <FormLabel>Departamento</FormLabel>
    <Select onValueChange={field.onChange} value={field.value}>
      <FormControl>
        <SelectTrigger><SelectValue placeholder="Seleccionar departamento" /></SelectTrigger>
      </FormControl>
      <SelectContent>
        <SelectItem value="none">Sin departamento</SelectItem>
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
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Registrado</TableHead>
                <TableHead>Departamento</TableHead>

                <TableHead className="w-24">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {responsables.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-slate-400">
                    No hay responsables registrados
                  </TableCell>
                </TableRow>
              ) : (
                responsables.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-400" />
                      {r.nombre}
                    </TableCell>
                    <TableCell className="text-slate-600">{r.email}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${rolColors[r.rol]}`}>
                        {r.rol}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {new Date(r.creadoEn).toLocaleDateString("es-BO")}
                    </TableCell>
                    <TableCell className="text-slate-600">{r.departamento?.nombre ?? "—"}</TableCell>

                    <TableCell>
  <div className="flex gap-1">
    <Button variant="ghost" size="icon" onClick={() => abrirEditar(r)}>
      <Pencil className="h-4 w-4" />
    </Button>
    <Button variant="ghost" size="icon" onClick={() => eliminarResponsable(r.id)}>
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
    <DialogHeader><DialogTitle>Editar Responsable</DialogTitle></DialogHeader>
    <Form {...formEditar}>
      <form onSubmit={formEditar.handleSubmit(onEditar)} className="space-y-4">
        <FormField control={formEditar.control} name="nombre" render={({ field }) => (
          <FormItem>
            <FormLabel>Nombre *</FormLabel>
            <FormControl><Input {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={formEditar.control} name="email" render={({ field }) => (
          <FormItem>
            <FormLabel>Email *</FormLabel>
            <FormControl><Input type="email" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={formEditar.control} name="rol" render={({ field }) => (
          <FormItem>
            <FormLabel>Rol *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="ADMIN">Administrador</SelectItem>
                <SelectItem value="CONTABILIDAD">Contabilidad</SelectItem>
                <SelectItem value="CONSULTA">Consulta</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="departamentoId" render={({ field }) => (
  <FormItem>
    <FormLabel>Departamento</FormLabel>
    <Select onValueChange={field.onChange} value={field.value}>
      <FormControl>
        <SelectTrigger><SelectValue placeholder="Seleccionar departamento" /></SelectTrigger>
      </FormControl>
      <SelectContent>
        <SelectItem value="none">Sin departamento</SelectItem>
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