"use server";

import { signIn, signOut } from "@/auth";
import { Route } from "@/type/Route";
import { User, UserSchema } from "@/type/User";
import { Session } from "next-auth";

export const signInWithGoogle = async (callbackUrl: string = Route.READING) => {
    await signIn("google", { callbackUrl });
};

export const signOutWithGoogle = async () => {
    await signOut({ redirect: true, redirectTo: Route.AUTH_SIGN_IN });
};

export const getUserFromSession = async (session: Session | null) => {
    if (!session?.user || !session.user.email) return undefined;

    // TODO Get user from database and create a new user if not found
    // const user = await getUser(email, name, image);
    // return user;
    return UserSchema.parse({
        id: 1,
        email: session.user.email,
        name: session.user.name ?? session.user.email,
        image: session.user.image ?? undefined,
        error: session.user.error,
        accessToken: session.user.access_token,
    }) as User;
};
