export const PERMISSIONS = {
  ACTIVO_READ_ANY: "activo:read:any",
  ACTIVO_READ_OWN: "activo:read:own",

  ACTIVO_CREATE_ANY: "activo:create:any",
  ACTIVO_CREATE_OWN: "activo:create:own",

  ACTIVO_UPDATE_ANY: "activo:update:any",
  ACTIVO_UPDATE_OWN: "activo:update:own",

  ACTIVO_DELETE_ANY: "activo:delete:any",
  ACTIVO_DELETE_OWN: "activo:delete:own",


  UBICACION_READ_ANY: "ubicacion:read:any",
  
  //?K Deberia leerse a los usuarios de sus propios departamentos?
  UBICACION_READ_OWN: "ubicacion:read:own",

  UBICACION_CREATE_ANY: "ubicacion:create:any",
  UBICACION_UPDATE_ANY: "ubicacion:update:any",
  UBICACION_DELETE_ANY: "ubicacion:update:any",

  CATEGORIA_READ_ANY: "categoria:read:any",
  CATEGORIA_CREATE_ANY: "categoria:create:any",
  CATEGORIA_UPDATE_ANY: "categoria:update:any",
  CATEGORIA_DELETE_ANY: "categoria:update:any",

  USUARIO_READ_ANY: "usuario:read:any",
  USUARIO_CREATE_ANY: "usuario:create:any",
  USUARIO_UPDATE_ANY: "usuario:update:any",
  USUARIO_DELETE_ANY: "usuario:update:any",

  MANTENIMIENTO_CREATE_ANY: "mantenimiento:create:any",
  MANTENIMIENTO_CREATE_OWN:"mantenimiento:create:own",

  //?K Deberia leerse a los usuarios de sus propios departamentos?
  USUARIO_READ_OWN:"usuario:read:own",

  TRANSFERENCIA_CREATE_ANY: "transferencia:create:any",
  TRANSFERENCIA_CREATE_OWN:"transferencia:create:own",

  REPORTE_READ_ANY: "reporte:read:any",
  REPORTE_READ_OWN: "reporte:read:own",

  DEPARTAMENTO_READ_ANY: "departamento:read:any",
  DEPARTAMENTO_CREATE_ANY: "departamento:create:any",
  DEPARTAMENTO_UPDATE_ANY: "departamento:update:any",
  DEPARTAMENTO_DELETE_ANY: "departamento:delete:any"

} as const

// export enum Role {
//   ADMIN = "ADMIN",
//   CONTABILIDAD = "CONTABILIDAD",
//   CONSULTA = "CONSULTA",
// }

// export const permissions = {
//   ADMIN: [
//     "activo:read",
//     "activo:create",
//     "activo:update",
//     "activo:delete",

//     "usuario:read",
//     "usuario:create",
//     "usuario:update",
//     "usuario:delete",

//     "ubicacion:read",
//     "ubicacion:create",
//     "ubicacion:update",
//     "ubicacion:delete",

//     "categoria:read",
//     "categoria:create",
//     "categoria:update",
//     "categoria:delete",

//     "mantenimiento:create",
//     "transferencia:create",
//     "reporte:read",

//     "departamento:read",
//     "departamento:create",
//     "departamento:update",
//     "departamento:delete",
//   ],
//   CONTABILIDAD: [
//     "activo:read:departamento",
//     "activo:create",
//     "activo:update",
//     "activo:delete",

//     "mantenimiento:create",

//     "transferencia:create",

//     "reporte:read:departamento",
//   ],
//   CONSULTA: ["activo:read:departamento", "reporte:read:departamento"],
// };

// export function hasPermission(role: Role, permission: string) {
//   return permissions[role]?.includes(permission);
// }

// export function canUpdateActivo(usuario: Session, departamentoId: string) {
//   if (permissions[usuario.user.rol].includes("activo:update")) return true;
//   if (
//     permissions[usuario.user.rol].include("activo:update:departamento") &&
//     departamentoId === usuario.user.departamentoId
//   )
//     return true;
//   return false;
// }

// export function canCreateActivo(usuario: Session, departamentoId: string) {
//   if (permissions[usuario.user.rol].includes("activo:create")) return true;
//   if (
//     permissions[usuario.user.rol].include("activo:create:departamento") &&
//     departamentoId === usuario.user.departamentoId
//   )
//     return true;
//   return false;
// }