import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

if (!process.env.VERCEL) {
  dotenv.config();
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL || env("POSTGRES_PRISMA_URL"),
  },
});

