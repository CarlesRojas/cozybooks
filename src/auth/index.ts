import { env } from "@/env";
import NextAuth, { NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const authOptions: NextAuthConfig = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: { params: { prompt: "consent", access_type: "offline", response_type: "code" } },
        }),
    ],
    secret: env.NEXTAUTH_SECRET,
    pages: {
        signIn: "/auth/signin",
        signOut: "/",
        error: "/auth/error",
    },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
