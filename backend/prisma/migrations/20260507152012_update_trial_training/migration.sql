/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `TrialTraining` table. All the data in the column will be lost.
  - Added the required column `scheduledAt` to the `TrialTraining` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Application" DROP COLUMN "createdAt";

-- AlterTable
ALTER TABLE "TrialTraining" DROP COLUMN "date",
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "scheduledAt" TIMESTAMP(3) NOT NULL;
