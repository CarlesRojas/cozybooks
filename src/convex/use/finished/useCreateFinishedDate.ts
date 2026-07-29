// Counterpart of `src/server/use/finished/useCreateFinishedDate.ts`. The optimistic
// update is applied through Convex's local store instead of hand-rolled query-cache
// surgery, and every subscribed query (finished dates, library lists) converges
// automatically when the mutation lands.

import { optimisticId, useTrackedMutation } from "@/convex/use/util";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";

interface Props {
    userId: string;
    bookId: string;
    timestamp: Date;
}

export const useCreateFinishedDate = () => {
    const add = useMutation(api.finished.add).withOptimisticUpdate((localStore, { userId, bookId, timestamp }) => {
        const current = localStore.getQuery(api.finished.getForBook, { userId, bookId });
        if (current === undefined) return;

        const optimistic = { id: optimisticId<Id<"finished">>(), userId, bookId, timestamp };
        localStore.setQuery(
            api.finished.getForBook,
            { userId, bookId },
            [...current, optimistic].sort((a, b) => a.timestamp - b.timestamp),
        );
    });

    return useTrackedMutation(({ bookId, timestamp, userId }: Props) => add({ bookId, userId, timestamp: timestamp.getTime() }));
};
