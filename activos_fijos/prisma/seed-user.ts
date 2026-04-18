import { PrismaClient, Rol } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const departamento = await prisma.departamento.findFirst();

  if (!departamento) {
    throw new Error("No hay departamentos en la BD. Verifica que existan.");
  }

  const usuario = await prisma.usuario.upsert({
    where: { email: "ivermc@gmail.com" },
    update: {
      passwordHash: await bcrypt.hash("123456", 10),
      rol: Rol.ADMIN,
    },
    create: {
      nombre: "Iver MC",
      email: "ivermc@gmail.com",
      passwordHash: await bcrypt.hash("123456", 10),
      rol: Rol.ADMIN,
      departamentoId: departamento.id,
    },
  });

  console.log("✅ Usuario creado/actualizado:", usuario.email);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });