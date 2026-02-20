import { v2 as cloudinary } from "cloudinary"

// El SDK lee CLOUDINARY_URL automáticamente, no necesitas configuración manual

export async function uploadFile(
  buffer: Buffer,
  fileName: string,
  tipo: string
): Promise<string> {
  const folder =
    tipo === "FOTO"
      ? "activos/fotos"
      : tipo === "FACTURA"
      ? "activos/facturas"
      : "activos/garantias"

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: "auto",
          public_id: `${Date.now()}-${fileName.replace(/\.[^/.]+$/, "")}`,
        },
        (error, result) => {
          if (error || !result) return reject(error)
          resolve(result.secure_url)
        }
      )
      .end(buffer)
  })
}

export async function deleteFile(url: string): Promise<void> {
  const parts = url.split("/")
  const fileName = parts.pop()?.replace(/\.[^/.]+$/, "") ?? ""
  const folder = parts.slice(parts.indexOf("activos")).join("/")
  const publicId = `${folder}/${fileName}`
  await cloudinary.uploader.destroy(publicId, { resource_type: "auto" })
}