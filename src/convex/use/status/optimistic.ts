import { api } from "@convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import type { OptimisticLocalStore } from "convex/browser";

type WireBookStatus = FunctionReturnType<typeof api.status.getBookStatus>;

// Flips the reactive `getBookStatus` query instantly while the mutation is in flight.
export const setOptimisticBookStatus = (
    localStore: OptimisticLocalStore,
    { bookId, status }: { bookId: string; status: WireBookStatus },
) => {
    if (localStore.getQuery(api.status.getBookStatus, { bookId }) === undefined) return;
    localStore.setQuery(api.status.getBookStatus, { bookId }, status);
};
