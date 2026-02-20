"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Upload, FileText, Image, Shield, Loader2, Trash2 } from "lucide-react"

const tipoConfig = {
  FACTURA: { label: "Factura PDF", icon: FileText, accept: ".pdf" },
  FOTO: { label: "Foto del Activo", icon: Image, accept: "image/*" },
  GARANTIA: { label: "Garantía", icon: Shield, accept: ".pdf,image/*" },
}

interface Documento {
  id: string
  tipo: string
  nombre: string
  url: string
  tamanio: number | null
}

interface Props {
  activoId: string
  documentos: Documento[]
  onUpload: (doc: Documento) => void
}

export function DocumentoUpload({ activoId, documentos, onUpload }: Props) {
  const [uploading, setUploading] = useState<string | null>(null)

  async function handleUpload(tipo: string, file: File) {
    setUploading(tipo)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("activoId", activoId)
      formData.append("tipo", tipo)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        toast.error("Error al subir archivo")
        return
      }

      const doc = await res.json()
      onUpload(doc)
      toast.success("Archivo subido correctamente")
    } catch {
      toast.error("Error inesperado")
    } finally {
      setUploading(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Botones de subida */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Object.entries(tipoConfig).map(([tipo, config]) => {
          const Icon = config.icon
          const yaSubido = documentos.find(d => d.tipo === tipo)

          return (
            <div key={tipo} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium">{config.label}</span>
              </div>

              {yaSubido ? (
                <div className="flex items-center justify-between">
                  
                <a href={yaSubido.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline truncate max-w-[120px]"
                  >
                    {yaSubido.nombre}
                  </a>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept={config.accept}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleUpload(tipo, file)
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={uploading === tipo}
                    asChild
                  >
                    <span>
                      {uploading === tipo ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <Upload className="h-3 w-3 mr-1" />
                      )}
                      Subir
                    </span>
                  </Button>
                </label>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}