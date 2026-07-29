// Counterpart of `src/server/use/finished/useUpdateFinishedDate.ts`.

import { useTrackedMutation } from "@/convex/use/util";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";

interface Props {
    id: string;
    bookId: string;
    timestamp: Date;
    userId: string;
}

export const useUpdateFinishedDate = () => {
    const update = useMutation(api.finished.update).withOptimisticUpdate((localStore, { id, userId, bookId, timestamp }) => {
        const current = localStore.getQuery(api.finished.getForBook, { userId, bookId });
        if (current === undefined) return;

        localStore.setQuery(
            api.finished.getForBook,
            { userId, bookId },
            current
                .map((finished) => (finished.id === id ? { ...finished, timestamp } : finished))
                .sort((a, b) => a.timestamp - b.timestamp),
        );
    });

    return useTrackedMutation(({ id, bookId, timestamp, userId }: Props) =>
        update({ id: id as Id<"finished">, userId, bookId, timestamp: timestamp.getTime() }),
    );
};
