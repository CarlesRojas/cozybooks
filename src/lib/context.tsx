import type { getUser } from "@/server/repo/auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

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
    user: Awaited<ReturnType<typeof getUser>>;
};

export const Providers = ({ children }: { children: ReactNode }) => {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
