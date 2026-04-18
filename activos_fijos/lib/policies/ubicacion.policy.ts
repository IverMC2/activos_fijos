import { Session } from "next-auth";
import { hasPermission } from "../role";
import { PERMISSIONS } from "../permission";

export function canCreateUbicacion(usuario: Session) {
  return hasPermission(usuario.user.rol, PERMISSIONS.UBICACION_CREATE_ANY)
}

export function canUpdateUbicacion(usuario: Session) {
  return hasPermission(usuario.user.rol, PERMISSIONS.UBICACION_UPDATE_ANY)
}

export function canDeleteUbicacion(usuario:Session){
  return hasPermission(usuario.user.rol,PERMISSIONS.UBICACION_DELETE_ANY)
}
export function getReadUbicacionFilter(
  user: Session,
) {
  if (hasPermission(user.user.rol, PERMISSIONS.UBICACION_CREATE_ANY)) {
    return undefined;
  }

  if (hasPermission(user.user.rol, PERMISSIONS.UBICACION_READ_OWN)) {
    return user.user.departamentoId;
  }

  return null;
}