/*
  Warnings:

  - You are about to drop the column `assurance` on the `Livreur` table. All the data in the column will be lost.
  - You are about to drop the column `assuranceValide` on the `Livreur` table. All the data in the column will be lost.
  - You are about to drop the column `carteGrise` on the `Livreur` table. All the data in the column will be lost.
  - You are about to drop the column `carteGriseValide` on the `Livreur` table. All the data in the column will be lost.
  - You are about to drop the column `cniRecto` on the `Livreur` table. All the data in the column will be lost.
  - You are about to drop the column `cniVerso` on the `Livreur` table. All the data in the column will be lost.
  - You are about to drop the column `dateNaissance` on the `Livreur` table. All the data in the column will be lost.
  - You are about to drop the column `permis` on the `Livreur` table. All the data in the column will be lost.
  - You are about to drop the column `permisValide` on the `Livreur` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Livreur" DROP COLUMN "assurance",
DROP COLUMN "assuranceValide",
DROP COLUMN "carteGrise",
DROP COLUMN "carteGriseValide",
DROP COLUMN "cniRecto",
DROP COLUMN "cniVerso",
DROP COLUMN "dateNaissance",
DROP COLUMN "permis",
DROP COLUMN "permisValide",
ADD COLUMN     "profilValide" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "DocumentLivreur" (
    "id" SERIAL NOT NULL,
    "livreurId" INTEGER NOT NULL,
    "cniRectoUrl" TEXT NOT NULL,
    "cniRectoPublicId" TEXT NOT NULL,
    "cniVersoUrl" TEXT NOT NULL,
    "cniVersoPublicId" TEXT NOT NULL,
    "permisUrl" TEXT,
    "permisPublicId" TEXT,
    "assuranceUrl" TEXT,
    "assurancePublicId" TEXT,
    "recepisseUrl" TEXT,
    "recepissePublicId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentLivreur_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DocumentLivreur_livreurId_key" ON "DocumentLivreur"("livreurId");

-- AddForeignKey
ALTER TABLE "DocumentLivreur" ADD CONSTRAINT "DocumentLivreur_livreurId_fkey" FOREIGN KEY ("livreurId") REFERENCES "Livreur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
