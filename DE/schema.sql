-- ========================================================
-- MIGRATION: 20261102071000_init
-- ========================================================
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('activity', 'challenge');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "UserAppCategory" AS ENUM ('travel', 'food', 'grocery');

-- CreateEnum
CREATE TYPE "Co2LogType" AS ENUM ('travel', 'food');

-- CreateEnum
CREATE TYPE "Co2LogStatus" AS ENUM ('pending_log', 'logged');

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'user',
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "lastStreakDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "discount" TEXT NOT NULL,
    "milestoneDays" INTEGER NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_coupons" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "couponId" UUID,
    "milestoneDay" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRedeemed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "TaskType" NOT NULL,
    "points" INTEGER NOT NULL,
    "challengeDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'pending',
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" UUID,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_apps" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" "UserAppCategory" NOT NULL,
    "icon" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_apps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "co2_logs" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "Co2LogType" NOT NULL,
    "status" "Co2LogStatus" NOT NULL,
    "co2Kg" DOUBLE PRECISION NOT NULL,
    "distanceKm" DOUBLE PRECISION,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loggedAt" TIMESTAMP(3),

    CONSTRAINT "co2_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_coupons_code_key" ON "user_coupons"("code");

-- CreateIndex
CREATE INDEX "user_coupons_userId_idx" ON "user_coupons"("userId");

-- CreateIndex
CREATE INDEX "user_coupons_couponId_idx" ON "user_coupons"("couponId");

-- CreateIndex
CREATE INDEX "submissions_userId_idx" ON "submissions"("userId");

-- CreateIndex
CREATE INDEX "submissions_taskId_idx" ON "submissions"("taskId");

-- CreateIndex
CREATE INDEX "user_apps_userId_idx" ON "user_apps"("userId");

-- CreateIndex
CREATE INDEX "co2_logs_userId_idx" ON "co2_logs"("userId");

-- AddForeignKey
ALTER TABLE "user_coupons" ADD CONSTRAINT "user_coupons_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_coupons" ADD CONSTRAINT "user_coupons_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_apps" ADD CONSTRAINT "user_apps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "co2_logs" ADD CONSTRAINT "co2_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ========================================================
-- MIGRATION: 20261108000000_add_users_and_link_profiles
-- ========================================================
BEGIN;

-- Preserve the legacy Profile.role enum and its values under a new type name.
ALTER TYPE "Role" RENAME TO "ProfileRole";

-- The new authentication role enum belongs to User.
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- Create the authentication parent table. Legacy accounts can lack credentials.
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- Preserve Profile IDs and credentials while translating the legacy role values.
-- An unexpected enum value produces NULL and fails the users.role NOT NULL constraint.
INSERT INTO "users" ("id", "email", "passwordHash", "role")
SELECT
    profile."id",
    profile."email",
    profile."passwordHash",
    CASE profile."role"::TEXT
        WHEN 'user' THEN 'USER'
        WHEN 'admin' THEN 'ADMIN'
    END::"Role"
FROM "profiles" AS profile;

-- Keep the legacy Profile columns and values, but allow new auth profiles to omit them.
ALTER TABLE "profiles"
    ALTER COLUMN "email" DROP NOT NULL,
    ALTER COLUMN "passwordHash" DROP NOT NULL;

-- Link Profile to its matching User without changing any existing child relations.
ALTER TABLE "profiles"
    ADD CONSTRAINT "profiles_id_fkey"
    FOREIGN KEY ("id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;


-- ========================================================
-- MIGRATION: 20261109205638_add_co2_points_and_rewards
-- ========================================================
-- CreateEnum
CREATE TYPE "RewardKind" AS ENUM ('voucher', 'physical', 'donation');

-- CreateEnum
CREATE TYPE "RedemptionStatus" AS ENUM ('active', 'used', 'expired');

-- AlterTable
ALTER TABLE "co2_logs" ADD COLUMN     "chosenVehicle" TEXT,
ADD COLUMN     "pointsEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "savedKg" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Reward" (
    "id" UUID NOT NULL,
    "brand" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "kind" "RewardKind" NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "stock" INTEGER NOT NULL,
    "validDays" INTEGER NOT NULL,
    "terms" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Reward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Redemption" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "rewardId" UUID NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "code" TEXT NOT NULL,
    "status" "RedemptionStatus" NOT NULL DEFAULT 'active',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Redemption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Redemption_code_key" ON "Redemption"("code");

-- CreateIndex
CREATE INDEX "Redemption_userId_idx" ON "Redemption"("userId");

-- CreateIndex
CREATE INDEX "Redemption_rewardId_idx" ON "Redemption"("rewardId");

-- AddForeignKey
ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ========================================================
-- MIGRATION: 20261111194943_add_grocery_log_type
-- ========================================================
-- AlterEnum
ALTER TYPE "Co2LogType" ADD VALUE 'grocery';
