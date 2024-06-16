"use server";

import { signIn, signOut } from "@/auth";
import { Route } from "@/type/Route";
import { Session } from "next-auth";

export const signInWithGoogle = async (callbackUrl: string = Route.READING) => {
    await signIn("google", { callbackUrl });
};

export const signOutWithGoogle = async () => {
    await signOut({ redirect: true, redirectTo: Route.AUTH_SIGN_IN });
};

export const getUserFromSession = async (session: Session | null) => {
    if (!session?.user || !session.user.email) return null;

    const email = session.user.email;
    const name = session.user.name ?? email;
    const image = session.user.image ?? undefined;

    // TODO Get user from database and create a new user if not found
    // const user = await getUser(email, name, image);
    // return user;
    console.log(session.user);

    return { email, name, image };
};
