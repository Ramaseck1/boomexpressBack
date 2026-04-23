/*
  Warnings:

  - You are about to drop the column `adresseArrivee` on the `Commande` table. All the data in the column will be lost.
  - You are about to drop the column `adresseDepart` on the `Commande` table. All the data in the column will be lost.
  - You are about to drop the column `destinataireId` on the `Commande` table. All the data in the column will be lost.
  - You are about to drop the column `expediteurId` on the `Commande` table. All the data in the column will be lost.
  - Added the required column `adresseLivraison` to the `Client` table without a default value. This is not possible if the table is not empty.
  - Added the required column `prenom` to the `Client` table without a default value. This is not possible if the table is not empty.
  - Added the required column `telephoneDestinataire` to the `Client` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientId` to the `Commande` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Commande" DROP CONSTRAINT "Commande_destinataireId_fkey";

-- DropForeignKey
ALTER TABLE "Commande" DROP CONSTRAINT "Commande_expediteurId_fkey";

-- DropIndex
DROP INDEX "Livraison_commandeId_key";

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "adresseLivraison" TEXT NOT NULL,
ADD COLUMN     "prenom" TEXT NOT NULL,
ADD COLUMN     "telephoneDestinataire" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Commande" DROP COLUMN "adresseArrivee",
DROP COLUMN "adresseDepart",
DROP COLUMN "destinataireId",
DROP COLUMN "expediteurId",
ADD COLUMN     "clientId" INTEGER NOT NULL,
ALTER COLUMN "statut" SET DEFAULT 'en_attente';

-- AddForeignKey
ALTER TABLE "Commande" ADD CONSTRAINT "Commande_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
