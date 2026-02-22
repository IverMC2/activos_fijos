import { Session } from "next-auth";
import { hasPermission } from "../role";
import { PERMISSIONS } from "../permission";

export function canGetUsuario(user: Session, departamentoId: string) {
    if (hasPermission(user.user.rol, PERMISSIONS.USUARIO_READ_ANY)) {
        return true
    }

    //?K Deberia leerse a los usuarios de sus propios departamentos?
    if (hasPermission(user.user.rol, PERMISSIONS.USUARIO_READ_OWN) &&
        user.user.departamentoId === departamentoId) {
    }
}

export function getReadUsuariosFilter(
  user: Session,
) {
  if (hasPermission(user.user.rol, PERMISSIONS.ACTIVO_READ_ANY)) {
    return undefined;
  }

  if (hasPermission(user.user.rol, PERMISSIONS.ACTIVO_READ_OWN)) {
    return user.user.departamentoId;
  }

  return null;
}

export function canCreateUsuario(usuario:Session){
    return hasPermission(usuario.user.rol,PERMISSIONS.USUARIO_CREATE_ANY)
}

export function canUpdateUsuario(usuario:Session){
    return hasPermission(usuario.user.rol,PERMISSIONS.USUARIO_UPDATE_ANY)
}

export function canDeleteUsuario(usuario:Session){
    return hasPermission(usuario.user.rol,PERMISSIONS.USUARIO_DELETE_ANY)
}