import { NextRequest, NextResponse } from "next/server";
import { obtenerActivos, crearActivo, ActivoInput, getDepartamentoIdFromUbicacion } from "@/lib/services/activos.service";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/role";
import { canCreateActivo, getReadDepartamentoFilter } from "@/lib/policies/activo.policy";
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  console.log("USER ROL:", session.user.rol);
  console.log("USER DEPT:", session.user.departamentoId);

  const { searchParams } = req.nextUrl;

  // Si no es ADMIN, filtrar por su departamento
  const departamentoId = getReadDepartamentoFilter(
    session,
    searchParams.get("departamentoId") ?? undefined
  );

  if (departamentoId === null) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  console.log("DEPT FILTER:", departamentoId);

  const resultado = await obtenerActivos({
    busqueda: searchParams.get("busqueda") ?? undefined,
    estado: searchParams.get("estado") ?? undefined,
    categoriaId: searchParams.get("categoriaId") ?? undefined,
    ubicacionId: searchParams.get("ubicacionId") ?? undefined,
    departamentoId,
    page: searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1,
    limit: searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : 20,
  });

  return NextResponse.json(resultado);
}
export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body: ActivoInput = await req.json();

  const departamentoId = await getDepartamentoIdFromUbicacion(body.ubicacionId)

  if (!departamentoId || !canCreateActivo(session, departamentoId)) {
    return NextResponse.json({ error: "Prohibido" }, { status: 403 });
  }
  const resultado = await crearActivo(body);

  if (resultado.error) return NextResponse.json(resultado, { status: 400 });
  return NextResponse.json(resultado, { status: 201 });
}
