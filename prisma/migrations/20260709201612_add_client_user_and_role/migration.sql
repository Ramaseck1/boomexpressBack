/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `Client` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'CLIENT';

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "latActuelle" DOUBLE PRECISION,
ADD COLUMN     "lngActuelle" DOUBLE PRECISION,
ADD COLUMN     "pushToken" TEXT,
ADD COLUMN     "userId" INTEGER;

-- AlterTable
ALTER TABLE "Commande" ADD COLUMN     "adresseDepart" TEXT,
ADD COLUMN     "adresseLivraison" TEXT,
ADD COLUMN     "annulePar" TEXT,
ADD COLUMN     "departLat" DOUBLE PRECISION,
ADD COLUMN     "departLng" DOUBLE PRECISION,
ADD COLUMN     "destLat" DOUBLE PRECISION,
ADD COLUMN     "destLng" DOUBLE PRECISION,
ADD COLUMN     "telephoneDestinataire" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Client_userId_key" ON "Client"("userId");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
