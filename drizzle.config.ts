import { env } from "@/env";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./src/server/db/schema",
    out: "./src/server/db/migration",
    dialect: "postgresql",
    casing: "snake_case",

    dbCredentials: {
        url: env.DATABASE_URL,
    },
    verbose: true,
    strict: true,
});
