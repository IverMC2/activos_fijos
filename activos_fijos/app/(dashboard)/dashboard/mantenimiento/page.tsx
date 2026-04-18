"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { Plus, Loader2, Wrench, Pencil, Trash2 } from "lucide-react";
const schema = z.object({
  activoId: z.string().min(1, "Requerido"),
  tipo: z.enum(["PREVENTIVO", "CORRECTIVO"]),
  descripcion: z.string().min(1, "Requerido"),
  costo: z.coerce.number().min(0).optional(),
  fecha: z.string().min(1, "Requerido"),
  proximaFecha: z.string().optional(),
  proveedorId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function MantenimientoPage() {
  const [editando, setEditando] = useState<any>(null);
  const [openEditar, setOpenEditar] = useState(false);

  const formEditar = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      activoId: "",
      tipo: "PREVENTIVO",
      descripcion: "",
      costo: 0,
      fecha: "",
      proximaFecha: "",
      proveedorId: "",
    },
  });

  function abrirEditar(m: any) {
    formEditar.reset({
      activoId: m.activoId,
      tipo: m.tipo,
      descripcion: m.descripcion,
      costo: Number(m.costo ?? 0),
      fecha: format(new Date(m.fecha), "yyyy-MM-dd"),
      proximaFecha: m.proximaFecha
        ? format(new Date(m.proximaFecha), "yyyy-MM-dd")
        : "",
      proveedorId: m.proveedorId ?? "",
    });
    setEditando(m);
    setOpenEditar(true);
  }

  async function onEditar(data: FormData) {
    setLoading(true);
    try {
      const res = await fetch(`/api/mantenimientos/${editando.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          proveedorId: data.proveedorId || undefined,
          proximaFecha: data.proximaFecha || undefined,
        }),
      });
      if (!res.ok) {
        toast.error("Error al actualizar");
        return;
      }
      toast.success("Mantenimiento actualizado");
      setOpenEditar(false);
      cargar();
    } catch {
      toast.error("Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function eliminarMantenimiento(id: string) {
    if (!confirm("¿Eliminar este registro de mantenimiento?")) return;
    const res = await fetch(`/api/mantenimientos/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Error al eliminar");
      return;
    }
    toast.success("Mantenimiento eliminado");
    cargar();
  }
  const [mantenimientos, setMantenimientos] = useState<any[]>([]);
  const [activos, setActivos] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      activoId: "",
      tipo: "PREVENTIVO",
      descripcion: "",
      costo: 0,
      fecha: "",
      proximaFecha: "",
      proveedorId: "",
    },
  });

  function cargar() {
    Promise.all([
      fetch("/api/mantenimientos").then((r) => r.json()),
      fetch("/api/activos?limit=100").then((r) => r.json()),
      fetch("/api/proveedores").then((r) => r.json()),
    ]).then(([mantos, acts, provs]) => {
      setMantenimientos(mantos);
      setActivos(acts.activos ?? []);
      setProveedores(provs);
    });
  }

  useEffect(() => {
    cargar();
  }, []);

  async function onSubmit(data: FormData) {
  setLoading(true)
  try {
    const res = await fetch("/api/mantenimientos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        activoId: data.activoId,
        tipo: data.tipo,
        descripcion: data.descripcion,
        costo: data.costo ? Number(data.costo) : undefined,
        fecha: data.fecha,
        proximaFecha: data.proximaFecha || undefined,
        proveedorId: data.proveedorId === "none" ? undefined : data.proveedorId,
      }),
    })
    if (!res.ok) {
      const error = await res.json()
      console.error(error)
      toast.error("Error al guardar")
      return
    }
    toast.success("Mantenimiento registrado")
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
          <h1 className="text-2xl font-bold text-slate-900">Mantenimiento</h1>
          <p className="text-slate-500">{mantenimientos.length} registros</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Mantenimiento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Registrar Mantenimiento</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="activoId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Activo *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar activo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {activos.map((a: any) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.codigo} — {a.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PREVENTIVO">Preventivo</SelectItem>
                          <SelectItem value="CORRECTIVO">Correctivo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="descripcion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descripción del mantenimiento..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fecha"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="proximaFecha"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Próxima Fecha</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="costo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Costo (Bs.)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="proveedorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proveedor del Servicio</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar proveedor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {proveedores.map((p: any) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
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
                <TableHead>Activo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Próxima Fecha</TableHead>
                <TableHead>Costo</TableHead>
                <TableHead className="w-24">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mantenimientos.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-12 text-slate-400"
                  >
                    No hay registros de mantenimiento
                  </TableCell>
                </TableRow>
              ) : (
                mantenimientos.map((m: any) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      <div>{m.activo?.nombre ?? "—"}</div>
                      <div className="text-xs text-slate-400 font-mono">
                        {m.activo?.codigo ?? "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${m.tipo === "PREVENTIVO" ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800"}`}
                      >
                        {m.tipo}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-600 max-w-xs truncate">
                      {m.descripcion}
                    </TableCell>
                    <TableCell>
                      {m.fecha ? format(new Date(m.fecha), "dd/MM/yyyy") : "-"}
                    </TableCell>
                    <TableCell>
                      {m.proximaFecha
                        ? format(new Date(m.proximaFecha), "dd/MM/yyyy")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {m.costo ? formatCurrency(Number(m.costo)) : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => abrirEditar(m)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => eliminarMantenimiento(m.id)}
                        >
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Mantenimiento</DialogTitle>
          </DialogHeader>
          <Form {...formEditar}>
            <form
              onSubmit={formEditar.handleSubmit(onEditar)}
              className="space-y-4"
            >
              <FormField
                control={formEditar.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PREVENTIVO">Preventivo</SelectItem>
                        <SelectItem value="CORRECTIVO">Correctivo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={formEditar.control}
                name="descripcion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción *</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={formEditar.control}
                  name="fecha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={formEditar.control}
                  name="proximaFecha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Próxima Fecha</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={formEditar.control}
                name="costo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Costo (Bs.)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={formEditar.control}
                name="proveedorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proveedor</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar proveedor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Sin proveedor</SelectItem>
                        {proveedores.map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenEditar(false)}
                >
                  Cancelar
                </Button>
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
  );
}
