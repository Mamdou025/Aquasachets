import { defineConfig } from "drizzle-kit";

const dbUrl = process.env.DATABASE_URL ?? "./data/aquasachet.db";

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: dbUrl,
  },
});
