import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  // Departamentos de Bolivia
  const departamentos = [
    { nombre: "La Paz", ciudad: "La Paz" },
    { nombre: "Cochabamba", ciudad: "Cochabamba" },
    { nombre: "Santa Cruz", ciudad: "Santa Cruz" },
    { nombre: "Oruro", ciudad: "Oruro" },
    { nombre: "Potosí", ciudad: "Potosí" },
    { nombre: "Chuquisaca", ciudad: "Sucre" },
    { nombre: "Tarija", ciudad: "Tarija" },
    { nombre: "Beni", ciudad: "Trinidad" },
    { nombre: "Pando", ciudad: "Cobija" },
  ]

  for (const dept of departamentos) {
    await prisma.departamento.upsert({
      where: { nombre: dept.nombre },
      update: {},
      create: dept,
    })
  }

  // Usuario admin
  const passwordHash = await bcrypt.hash("admin123", 10)
  await prisma.usuario.upsert({
    where: { email: "admin@empresa.com" },
    update: {},
    create: {
      nombre: "Administrador",
      email: "admin@empresa.com",
      passwordHash,
      rol: "ADMIN",
    },
  })

  // Categorías
  const categorias = [
    { nombre: "Equipos de Computación", vidaUtilAnios: 5, cuentaContable: "1.2.1.01" },
    { nombre: "Muebles y Enseres", vidaUtilAnios: 10, cuentaContable: "1.2.1.02" },
    { nombre: "Vehículos", vidaUtilAnios: 5, cuentaContable: "1.2.1.03" },
    { nombre: "Maquinaria y Equipo", vidaUtilAnios: 10, cuentaContable: "1.2.1.04" },
    { nombre: "Edificios", vidaUtilAnios: 40, cuentaContable: "1.2.1.05" },
  ]

  for (const cat of categorias) {
    await prisma.categoria.upsert({
      where: { nombre: cat.nombre },
      update: {},
      create: cat,
    })
  }

  console.log("✅ Seed completado")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())