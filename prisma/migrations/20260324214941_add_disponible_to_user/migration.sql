/*
  Warnings:

  - Made the column `telephone` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `role` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "disponible" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "telephone" SET NOT NULL,
ALTER COLUMN "statut" DROP NOT NULL,
ALTER COLUMN "statut" DROP DEFAULT,
DROP COLUMN "role",
ADD COLUMN     "role" TEXT NOT NULL;
