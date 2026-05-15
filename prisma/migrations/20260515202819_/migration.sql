-- DropForeignKey
ALTER TABLE "Livreur" DROP CONSTRAINT "Livreur_userId_fkey";

-- AddForeignKey
ALTER TABLE "Livreur" ADD CONSTRAINT "Livreur_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
