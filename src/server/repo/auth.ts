import { auth } from "@/lib/auth";
import { createServerFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";

export const getUser = createServerFn({ method: "GET" }).handler(async () => {
    const { headers } = getWebRequest()!;

    const session = await auth.api.getSession({ headers });
    if (!session) return { user: null, googleToken: null };

    try {
        const accessToken = await auth.api.getAccessToken({ body: { providerId: "google" }, headers });
        return { user: session.user, googleToken: accessToken.accessToken };
    } catch (error) {
        console.log(error);
    }

    return { user: null, googleToken: null };
});
