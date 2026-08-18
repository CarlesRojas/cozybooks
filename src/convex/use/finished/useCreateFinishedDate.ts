// Counterpart of `src/server/use/finished/useCreateFinishedDate.ts`. The optimistic
// update is applied through Convex's local store instead of hand-rolled query-cache
// surgery, and every subscribed query (finished dates, library lists) converges
// automatically when the mutation lands.

import { optimisticId, useTrackedMutation } from "@/convex/use/util";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";

interface Props {
    bookId: string;
    timestamp: Date;
}

export const useCreateFinishedDate = () => {
    const add = useMutation(api.finished.add).withOptimisticUpdate((localStore, { bookId, timestamp }) => {
        const current = localStore.getQuery(api.finished.getForBook, { bookId });
        if (current === undefined) return;

        // `userId` is on the wire row because the query returns what the table holds;
        // the optimistic stand-in copies it off a row already on screen, or off the
        // query's own shape when this is the first date for the book.
        const optimistic = { id: optimisticId<Id<"finished">>(), userId: current[0]?.userId ?? "", bookId, timestamp };
        localStore.setQuery(
            api.finished.getForBook,
            { bookId },
            [...current, optimistic].sort((a, b) => a.timestamp - b.timestamp),
        );
    });

    return useTrackedMutation(({ bookId, timestamp }: Props) => add({ bookId, timestamp: timestamp.getTime() }));
};
