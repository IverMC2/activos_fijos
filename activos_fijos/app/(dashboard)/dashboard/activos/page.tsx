"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Eye, Plus, Search } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"

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

export default function ActivosPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [activos, setActivos] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [categorias, setCategorias] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const currentPage = parseInt(searchParams.get("page") ?? "1")

  useEffect(() => {
    fetch("/api/categorias").then(r => r.json()).then(setCategorias)
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams(searchParams.toString())
    fetch(`/api/activos?${params}`)
      .then(r => r.json())
      .then(data => {
        setActivos(data.activos)
        setTotal(data.total)
        setPages(data.pages)
      })
      .catch(() => toast.error("Error al cargar activos"))
      .finally(() => setLoading(false))
  }, [searchParams])

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== "todos") {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete("page")
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Activos Fijos</h1>
          <p className="text-slate-500">{total} activos registrados</p>
        </div>
        <Link href="/dashboard/activos/nuevo">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Activo
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por nombre, código o responsable..."
            className="pl-9"
            defaultValue={searchParams.get("busqueda") ?? ""}
            onChange={(e) => updateParam("busqueda", e.target.value)}
          />
        </div>
        <Select
          defaultValue={searchParams.get("estado") ?? "todos"}
          onValueChange={(v) => updateParam("estado", v)}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="ACTIVO">Activo</SelectItem>
            <SelectItem value="EN_MANTENIMIENTO">En Mantenimiento</SelectItem>
            <SelectItem value="DADO_DE_BAJA">Dado de Baja</SelectItem>
          </SelectContent>
        </Select>
        <Select
          defaultValue={searchParams.get("categoriaId") ?? "todos"}
          onValueChange={(v) => updateParam("categoriaId", v)}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas las categorías</SelectItem>
            {categorias.map((c: any) => (
              <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Responsable</TableHead>
              <TableHead>Valor Libro</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-slate-400">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : activos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-slate-400">
                  No se encontraron activos
                </TableCell>
              </TableRow>
            ) : (
              activos.map((activo: any) => (
                <TableRow key={activo.id} className="hover:bg-slate-50">
                  <TableCell className="font-mono text-sm">{activo.codigo}</TableCell>
                  <TableCell className="font-medium">{activo.nombre}</TableCell>
                  <TableCell className="text-slate-600">{activo.categoria.nombre}</TableCell>
                  <TableCell className="text-slate-600">{activo.ubicacion.nombre}</TableCell>
                  <TableCell className="text-slate-600">{activo.responsable?.nombre ?? "—"}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(Number(activo.valorLibro))}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${estadoColors[activo.estado]}`}>
                      {estadoLabels[activo.estado]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Link href={`/dashboard/activos/${activo.id}`}>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      {pages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => updateParam("page", String(currentPage - 1))}
          >
            Anterior
          </Button>
          <span className="text-sm text-slate-600">
            Página {currentPage} de {pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= pages}
            onClick={() => updateParam("page", String(currentPage + 1))}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  )
}