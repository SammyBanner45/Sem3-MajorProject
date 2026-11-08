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
