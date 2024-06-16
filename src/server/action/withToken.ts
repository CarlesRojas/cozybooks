import { REFRESH_TOKEN_ERROR } from "@/auth";
import { getServerUser } from "@/server/use/useServerUser";
import { Route } from "@/type/Route";
import { signOut } from "next-auth/react";

export interface TokenProps {
    token: string;
}

export const withToken = <T extends TokenProps, R>(fn: (props: T) => Promise<R>) => {
    return async (props: Omit<T, "token">) => {
        const user = await getServerUser();
        const token = user?.accessToken;
        if (!user || user.error === REFRESH_TOKEN_ERROR || !token) await signOut({ callbackUrl: Route.AUTH_SIGN_IN });

        return await fn({ ...props, token } as T);
    };
};
