-- CreateEnum
CREATE TYPE "FoodType" AS ENUM ('JAIN', 'NON_JAIN');

-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL,
    "guestFName" TEXT NOT NULL,
    "guestLName" TEXT NOT NULL,
    "guestDesignation" TEXT NOT NULL,
    "guestCompanions" INTEGER NOT NULL,
    "guestContact" TEXT NOT NULL,
    "driver" BOOLEAN NOT NULL,
    "email" TEXT,
    "foodPreferences" "FoodType"[],
    "addDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);
