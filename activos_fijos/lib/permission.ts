export enum Role {
  ADMIN = "ADMIN",
  CONTABILIDAD = "CONTABILIDAD",
  CONSULTA = "CONSULTA"
}

export const permissions = {
  ADMIN: [
    "activo:read",
    "activo:create",
    "activo:update",
    "activo:delete",

    "usuario:read",
    "usuario:create",
    "usuario:update",
    "usuario:delete",

    "ubicacion:read",
    "ubicacion:create",
    "ubicacion:update",
    "ubicacion:delete",

    "categoria:read",
    "categoria:create",
    "categoria:update",
    "categoria:delete",

    "mantenimiento:create",
    "transferencia:create",
    "reporte:read",

    "departamento:read",
    "departamento:create",
    "departamento:update",
    "departamento:delete"
  ],
  CONTABILIDAD: [
    "activo:read:departamento",
    "activo:create",
    "activo:update",
    "activo:delete",

    "mantenimiento:create",

    "transferencia:create",
    
    "reporte:read:departamento"
  ],
  CONSULTA: [
    "activo:read:departamento",
    "reporte:read:departamento"
  ]
}

export function hasPermission(role: Role, permission: string) {
  return permissions[role]?.includes(permission)
}