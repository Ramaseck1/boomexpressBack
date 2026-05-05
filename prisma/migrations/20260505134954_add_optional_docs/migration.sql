-- AlterTable
ALTER TABLE "Livreur" ADD COLUMN     "assurance" TEXT,
ADD COLUMN     "assuranceValide" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "carteGrise" TEXT,
ADD COLUMN     "carteGriseValide" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cniRecto" TEXT,
ADD COLUMN     "cniVerso" TEXT,
ADD COLUMN     "dateNaissance" TIMESTAMP(3),
ADD COLUMN     "estVerifie" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "permis" TEXT,
ADD COLUMN     "permisValide" BOOLEAN NOT NULL DEFAULT false;
