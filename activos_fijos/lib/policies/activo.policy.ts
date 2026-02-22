import { Session } from "next-auth";
import { PERMISSIONS } from "../permission";
import { hasPermission } from "../role";

export function canUpdateActivo(user: Session, departamentoId: string) {
  if (hasPermission(user.user.rol, PERMISSIONS.ACTIVO_UPDATE_ANY)) {
    return true;
  }
  if (
    hasPermission(user.user.rol, PERMISSIONS.ACTIVO_UPDATE_OWN) &&
    departamentoId === user.user.departamentoId
  ) {
    return true;
  }
  return false;
}

export function canCreateActivo(user: Session, departamentoId: string) {
  if (hasPermission(user.user.rol, PERMISSIONS.ACTIVO_UPDATE_ANY)) {
    return true;
  }

  if (
    hasPermission(user.user.rol, PERMISSIONS.ACTIVO_UPDATE_OWN) &&
    departamentoId === user.user.departamentoId
  ) {
    return true;
  }

  return false;
}

export function canDeleteActivo(user: Session, departamentoId: string) {
  if (hasPermission(user.user.rol, PERMISSIONS.ACTIVO_DELETE_ANY)) {
    return true;
  }
  if (
    hasPermission(user.user.rol, PERMISSIONS.ACTIVO_DELETE_OWN) &&
    departamentoId === user.user.departamentoId
  ) {
    return true;
  }

  return false;
}

export function canGetActivo(user: Session, departamentoId: string) {
  if (hasPermission(user.user.rol, PERMISSIONS.ACTIVO_READ_ANY)) {
    return true;
  }
  if (
    hasPermission(user.user.rol, PERMISSIONS.ACTIVO_READ_OWN) &&
    departamentoId === user.user.departamentoId
  ) {
    return true
  }
  return false
}

export function getReadDepartamentoFilter(
  user: Session,
  requestedDepartamentoId?: string,
) {
  if (hasPermission(user.user.rol, PERMISSIONS.ACTIVO_READ_ANY)) {
    return requestedDepartamentoId;
  }

  if (hasPermission(user.user.rol, PERMISSIONS.ACTIVO_READ_OWN)) {
    return user.user.departamentoId;
  }

  return null;
}
