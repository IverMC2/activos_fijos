import { Session } from "next-auth";
import { hasPermission } from "../role";
import { PERMISSIONS } from "../permission";

export function canCreateCategoria(usuario:Session){
    if (hasPermission(usuario.user.rol,PERMISSIONS.CATEGORIA_CREATE_ANY)) {
        return true
    }
    return false
}

export function canUpdateCategoria(usuario:Session){
    if (hasPermission(usuario.user.rol,PERMISSIONS.CATEGORIA_UPDATE_ANY)) {
        return true
    }

    return false
}

export function canDeleteCategoria(usuario:Session){
    if (hasPermission(usuario.user.rol,PERMISSIONS.CATEGORIA_DELETE_ANY)) {
        return true
    }
    return false
}