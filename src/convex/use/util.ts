// Small helpers shared by the Convex hooks. They keep the familiar
// `{ data, isLoading }` / `{ mutate, isPending, isError }` ergonomics while being
// backed entirely by Convex (reactive queries + optimistic updates), so components
// don't need TanStack Query or manual cache invalidation anymore.

import { useAction } from "convex/react";
import type { FunctionArgs, FunctionReference, FunctionReturnType } from "convex/server";
import { useCallback, useEffect, useRef, useState } from "react";

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

export interface InfiniteActionQueryResult<TPage> {
    pages: Array<TPage>;
    isLoading: boolean;
    isError: boolean;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    fetchNextPage: () => void;
}

interface PagedWire {
    totalItems: number;
    items: Array<unknown>;
}

const pageInfo = (pages: Array<PagedWire>): { loadedCount: number; lastPage: PagedWire | undefined } => ({
    loadedCount: pages.reduce((count, page) => count + page.items.length, 0),
    lastPage: pages.length > 0 ? pages[pages.length - 1] : undefined,
});

// Offset-based infinite pagination over a Convex action returning `{ totalItems,
// items }`. The Google Books API calls run as actions, so they can't use Convex's
// `usePaginatedQuery` (which only works for reactive database queries); this
// accumulates pages instead. `fetchNextPage` appends the next `pageSize` items, and
// the list resets when the args change — previous pages stay visible while the first
// page of the new args loads, like `useActionQuery`.
export const useInfiniteActionQuery = <TAction extends FunctionReference<"action", "public">>(
    action: TAction,
    baseArgs: Omit<FunctionArgs<TAction>, "maxResults" | "startIndex"> | "skip",
    pageSize: number,
): InfiniteActionQueryResult<FunctionReturnType<TAction>> => {
    const run = useAction(action);
    const key = baseArgs === "skip" ? null : JSON.stringify(baseArgs);

    const [state, setState] = useState<{
        key: string | null;
        pages: Array<FunctionReturnType<TAction>>;
        isError: boolean;
        isFetchingNextPage: boolean;
    }>({ key: null, pages: [], isError: false, isFetchingNextPage: false });

    const baseArgsRef = useRef(baseArgs);
    baseArgsRef.current = baseArgs;
    const stateRef = useRef(state);
    stateRef.current = state;
    const fetchingNextRef = useRef(false);

    useEffect(() => {
        const args = baseArgsRef.current;
        if (key === null || args === "skip") return;

        let cancelled = false;

        const firstPageArgs = { ...args, maxResults: pageSize, startIndex: 0 } as unknown as FunctionArgs<TAction>;

        run(firstPageArgs)
            .then((page) => {
                if (!cancelled) setState({ key, pages: [page], isError: false, isFetchingNextPage: false });
            })
            .catch(() => {
                if (!cancelled) setState({ key, pages: [], isError: true, isFetchingNextPage: false });
            });

        return () => {
            cancelled = true;
        };
    }, [key, pageSize, run]);

    const fetchNextPage = useCallback(async () => {
        const args = baseArgsRef.current;
        const current = stateRef.current;
        if (key === null || args === "skip" || current.key !== key || fetchingNextRef.current) return;

        const { loadedCount, lastPage } = pageInfo(current.pages);
        if (!lastPage || lastPage.items.length === 0 || loadedCount >= lastPage.totalItems) return;

        fetchingNextRef.current = true;
        setState((prev) => ({ ...prev, isFetchingNextPage: true }));

        try {
            const nextPageArgs = { ...args, maxResults: pageSize, startIndex: loadedCount } as unknown as FunctionArgs<TAction>;
            const page = await run(nextPageArgs);
            setState((prev) => (prev.key === key ? { ...prev, pages: [...prev.pages, page], isFetchingNextPage: false } : prev));
        } catch {
            setState((prev) => (prev.key === key ? { ...prev, isError: true, isFetchingNextPage: false } : prev));
        } finally {
            fetchingNextRef.current = false;
        }
    }, [key, pageSize, run]);

    const { loadedCount, lastPage } = pageInfo(state.pages);
    const hasNextPage = state.key === key && !!lastPage && lastPage.items.length > 0 && loadedCount < lastPage.totalItems;

    return {
        pages: state.pages,
        isLoading: key !== null && state.key !== key,
        isError: state.isError,
        hasNextPage,
        isFetchingNextPage: state.isFetchingNextPage,
        fetchNextPage: () => void fetchNextPage(),
    };
};

// Convex documents can't be created client-side, so optimistic inserts need a
// placeholder id until the server round trip completes.
export const optimisticId = <TId extends string>(): TId => `optimistic-${crypto.randomUUID()}` as TId;
