/*
  Warnings:

  - You are about to drop the column `livreurId` on the `Commande` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Commande" DROP CONSTRAINT "Commande_livreurId_fkey";

-- AlterTable
ALTER TABLE "Commande" DROP COLUMN "livreurId";
