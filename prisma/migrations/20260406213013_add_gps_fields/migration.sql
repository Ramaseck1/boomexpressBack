-- AlterTable
ALTER TABLE "Livraison" ADD COLUMN     "destinationLat" DOUBLE PRECISION,
ADD COLUMN     "destinationLng" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Livreur" ADD COLUMN     "latActuelle" DOUBLE PRECISION,
ADD COLUMN     "lngActuelle" DOUBLE PRECISION;
