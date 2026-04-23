-- CreateTable
CREATE TABLE "Carte" (
    "id" SERIAL NOT NULL,
    "commune" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Carte_pkey" PRIMARY KEY ("id")
);
