"use server";

import { signIn, signOut } from "@/auth";
import { db } from "@/server/database";
import { user } from "@/server/schema";
import { Route } from "@/type/Route";
import { User, UserSchema } from "@/type/User";
import { Session } from "next-auth";

export const createUser = async (newUser: typeof user.$inferInsert) => {
    const result = await db.insert(user).values(newUser).returning();
    return result.length > 0 ? result[0].email : null;
};

export const getUser = async (email: string, name: string) => {
    if (!(await existsUser(email))) await createUser({ email, name });

    const result = await db.query.user.findFirst({
        where: (user, { eq }) => eq(user.email, email),
    });

    if (!result) return null;
    return result;
};

export const existsUser = async (email: string) => {
    const result = await db.query.user.findFirst({ where: (user, { eq }) => eq(user.email, email) });
    return !!result;
};

export const signInWithGoogle = async (callbackUrl: string = Route.READING) => {
    await signIn("google", { callbackUrl });
};

export const signOutWithGoogle = async () => {
    await signOut({ redirect: true, redirectTo: Route.AUTH_SIGN_IN });
};

export const getUserFromSession = async (session: Session | null) => {
    if (!session?.user || !session.user.email) return undefined;

    const user = await getUser(session.user.email, session.user.name ?? session.user.email);

    return UserSchema.parse({
        ...user,
        image: session.user.image ?? undefined,
        error: session.user.error,
        accessToken: session.user.access_token,
    }) as User;
};
