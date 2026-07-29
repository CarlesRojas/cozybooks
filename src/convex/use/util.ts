// Small helpers shared by the Convex hooks. They keep the familiar
// `{ data, isLoading }` / `{ mutate, isPending, isError }` ergonomics while being
// backed entirely by Convex (reactive queries + optimistic updates), so components
// don't need TanStack Query or manual cache invalidation anymore.

import { useAction } from "convex/react";
import type { FunctionArgs, FunctionReference, FunctionReturnType } from "convex/server";
import { useCallback, useEffect, useState } from "react";

export interface TrackedMutation<TVars> {
    mutate: (vars: TVars) => Promise<boolean>;
    isPending: boolean;
    isError: boolean;
}

// Wraps a mutation (or any async function) with pending/error state, the same role
// TanStack Query's useMutation played in the old hooks.
export const useTrackedMutation = <TVars>(run: (vars: TVars) => Promise<unknown>): TrackedMutation<TVars> => {
    const [pendingCount, setPendingCount] = useState(0);
    const [isError, setIsError] = useState(false);

    const mutate = useCallback(
        async (vars: TVars) => {
            setIsError(false);
            setPendingCount((count) => count + 1);

            try {
                await run(vars);
                return true;
            } catch {
                setIsError(true);
                return false;
            } finally {
                setPendingCount((count) => count - 1);
            }
        },
        [run],
    );

    return { mutate, isPending: pendingCount > 0, isError };
};

export interface ActionQueryResult<TData> {
    data: TData | undefined;
    isLoading: boolean;
    isError: boolean;
}

// Runs a Convex action as a read (used for the Google Books API calls, which can't
// be reactive queries). Refetches when the args change and keeps the previous data
// visible while the next page loads, like `keepPreviousData` did.
export const useActionQuery = <TAction extends FunctionReference<"action", "public">>(
    action: TAction,
    args: FunctionArgs<TAction> | "skip",
): ActionQueryResult<FunctionReturnType<TAction>> => {
    const run = useAction(action);
    const [state, setState] = useState<{ key: string | null; data?: FunctionReturnType<TAction>; isError: boolean }>({
        key: null,
        isError: false,
    });

    const key = args === "skip" ? null : JSON.stringify(args);

    useEffect(() => {
        if (args === "skip" || key === null) return;

        let cancelled = false;

        run(args)
            .then((data) => {
                if (!cancelled) setState((prev) => ({ ...prev, key, data, isError: false }));
            })
            .catch(() => {
                if (!cancelled) setState((prev) => ({ ...prev, key, isError: true }));
            });

        return () => {
            cancelled = true;
        };
    }, [key, run]);

    return {
        data: state.data,
        isLoading: key !== null && state.key !== key,
        isError: state.isError,
    };
};

// Convex documents can't be created client-side, so optimistic inserts need a
// placeholder id until the server round trip completes.
export const optimisticId = <TId extends string>(): TId => `optimistic-${crypto.randomUUID()}` as TId;
