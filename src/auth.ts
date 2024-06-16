import { REFRESH_TOKEN_ERROR } from "@/const";
import { env } from "@/env";
import NextAuth, { type NextAuthConfig, type User } from "next-auth";
import { type JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";

const GOOGLE_AUTHORIZATION_URL =
    "https://accounts.google.com/o/oauth2/v2/auth?" +
    new URLSearchParams({ prompt: "consent", access_type: "offline", response_type: "code" });

const refreshAccessToken = async (token: JWT) => {
    try {
        const url =
            "https://oauth2.googleapis.com/token?" +
            new URLSearchParams({
                client_id: env.GOOGLE_CLIENT_ID,
                client_secret: env.GOOGLE_CLIENT_SECRET,
                grant_type: "refresh_token",
                refresh_token: token.refreshToken as string,
            });

        const response = await fetch(url, { headers: { "Content-Type": "application/x-www-form-urlencoded" }, method: "POST" });
        const refreshedTokens = await response.json();
        if (!response.ok) throw refreshedTokens;

        const newToken: JWT = {
            ...token,
            idToken: refreshedTokens.id_token ?? token.idToken,
            accessToken: refreshedTokens.access_token ?? token.accessToken,
            accessTokenExpires: Date.now() + (refreshedTokens.expires_in ?? 3599) * 1000,
            refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
        };

        return newToken;
    } catch (error) {
        return { ...token, error: REFRESH_TOKEN_ERROR };
    }
};

const authOptions: NextAuthConfig = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: GOOGLE_AUTHORIZATION_URL,
        }),
    ],
    secret: env.NEXTAUTH_SECRET,
    pages: {
        signIn: "/auth/signin",
        signOut: "/",
        error: "/auth/error",
    },

    callbacks: {
        async jwt({ token, user, account }) {
            // Initial sign in
            if (account && user)
                return {
                    ...account,
                    accessTokenExpires: account.expires_at ? account.expires_at * 1000 : Date.now() + 60 * 30,
                    user,
                };

            // Return previous token if the access token has not expired yet
            if (Date.now() < (token.accessTokenExpires as number)) return token;

            // Access token has expired, try to update it
            return refreshAccessToken(token);
        },

        async session({ session, token }) {
            const tokenUser = token.user as User;

            // @ts-expect-error Bad types from next-auth
            session.user = { ...tokenUser, ...token };
            return session;
        },
    },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
