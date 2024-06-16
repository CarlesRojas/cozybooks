"use server";

import { signIn, signOut } from "@/auth";
import { Route } from "@/type/Route";

export const signInWithGoogle = async (callbackUrl: string = Route.READING) => {
    await signIn("google", { callbackUrl });
};

export const signOutWithGoogle = async () => {
    await signOut({ redirect: true, redirectTo: Route.AUTH_SIGN_IN });
};
