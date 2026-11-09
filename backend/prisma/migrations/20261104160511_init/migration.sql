-- CreateEnum
CREATE TYPE "UserAppCategory" AS ENUM ('travel', 'food', 'grocery');

-- CreateEnum
CREATE TYPE "Co2LogType" AS ENUM ('travel', 'food');

-- CreateEnum
CREATE TYPE "Co2LogStatus" AS ENUM ('pending_log', 'logged');

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserApp" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" "UserAppCategory" NOT NULL,
    "icon" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserApp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Co2Log" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "Co2LogType" NOT NULL,
    "status" "Co2LogStatus" NOT NULL,
    "co2Kg" DOUBLE PRECISION NOT NULL,
    "distanceKm" DOUBLE PRECISION,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loggedAt" TIMESTAMP(3),

    CONSTRAINT "Co2Log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserApp_userId_idx" ON "UserApp"("userId");

-- CreateIndex
CREATE INDEX "Co2Log_userId_idx" ON "Co2Log"("userId");

-- AddForeignKey
ALTER TABLE "UserApp" ADD CONSTRAINT "UserApp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Co2Log" ADD CONSTRAINT "Co2Log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
