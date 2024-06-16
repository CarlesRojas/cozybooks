import { env } from "@/env";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./src/server/schema",
    out: "./src/server/database",
    dialect: "postgresql",
    dbCredentials: {
        url: env.DATABASE_URL,
    },
    verbose: true,
    strict: true,
});
