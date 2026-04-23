-- AlterTable
ALTER TABLE "Commande" ADD COLUMN     "commissionPaye" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "livreurId" INTEGER;

-- AddForeignKey
ALTER TABLE "Commande" ADD CONSTRAINT "Commande_livreurId_fkey" FOREIGN KEY ("livreurId") REFERENCES "Livreur"("id") ON DELETE SET NULL ON UPDATE CASCADE;
