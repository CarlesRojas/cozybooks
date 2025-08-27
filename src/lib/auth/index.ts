import { env } from "@/env";
import { db } from "@/server/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { reactStartCookies } from "better-auth/react-start";

export const auth = betterAuth({
    database: drizzleAdapter(db, { provider: "pg" }),

    socialProviders: {
        google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
    },

    plugins: [reactStartCookies()],
});
