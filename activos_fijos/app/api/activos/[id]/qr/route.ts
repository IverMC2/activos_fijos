import { NextRequest, NextResponse } from "next/server"
import QRCode from "qrcode"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ codigo: string }> } // 'codigo' no 'id'
) {
  const { codigo } = await params
  const url = `${process.env.NEXT_PUBLIC_URL}/activos/public/${codigo}`

  try {
    // Generar QR como SVG (muy ligero, ~2KB)
    const qrSvg = await QRCode.toString(url, {
      type: "svg",
      width: 300,
      margin: 2,
      errorCorrectionLevel: "M", // Balance entre tamaño y corrección
    })

    return new NextResponse(qrSvg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Error generando QR" }, { status: 500 })
  }
}