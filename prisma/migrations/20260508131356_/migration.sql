-- AlterTable
ALTER TABLE "PasswordResetCode" ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false;
