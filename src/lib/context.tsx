import type { getUser } from "@/lib/auth/getUser";
import { QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: false,
        },
    },
});

export const getContext = () => {
    return { queryClient, user: null };
};

export type Context = {
    queryClient: QueryClient;
    user: NonNullable<Awaited<ReturnType<typeof getUser>>>["user"] | null;
};
