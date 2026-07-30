// Resolves the current session user. Sign-in is identity-only: the app no longer
// calls any Google API on the user's behalf, so no access token is fetched here.

import { auth } from "@/lib/auth";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

export const getUser = createServerFn({ method: "GET" }).handler(async () => {
    const { headers } = getRequest();

    const session = await auth.api.getSession({ headers });
    return { user: session?.user ?? null };
});
