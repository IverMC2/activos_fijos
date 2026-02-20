/*
  Warnings:

  - You are about to drop the column `creadoEn` on the `bajas` table. All the data in the column will be lost.
  - You are about to drop the column `creadoEn` on the `traslados` table. All the data in the column will be lost.
  - You are about to drop the `bitacora` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "bitacora" DROP CONSTRAINT "bitacora_activoId_fkey";

-- DropForeignKey
ALTER TABLE "bitacora" DROP CONSTRAINT "bitacora_usuarioId_fkey";

-- AlterTable
ALTER TABLE "bajas" DROP COLUMN "creadoEn";

-- AlterTable
ALTER TABLE "traslados" DROP COLUMN "creadoEn";

-- AlterTable
ALTER TABLE "ubicaciones" ADD COLUMN     "departamentoId" TEXT;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "departamentoId" TEXT;

-- DropTable
DROP TABLE "bitacora";

-- CreateTable
CREATE TABLE "departamentos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "ciudad" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "departamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bitacoras" (
    "id" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "tabla" TEXT NOT NULL,
    "registroId" TEXT,
    "usuarioId" TEXT,
    "datos" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bitacoras_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departamentos_nombre_key" ON "departamentos"("nombre");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "departamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ubicaciones" ADD CONSTRAINT "ubicaciones_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "departamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bitacoras" ADD CONSTRAINT "bitacoras_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
