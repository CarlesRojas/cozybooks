// Counterpart of `src/server/use/finished/useDeleteFinishedDate.ts`. The old flow
// needed three sequential server calls (delete, re-fetch, conditionally remove from
// the FINISHED library); `finished.remove` now does all of it in one transactional
// mutation.

import { useTrackedMutation } from "@/convex/use/util";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";

interface Props {
    bookId: string;
    id: Id<"finished">;
    userId: string;
}

export const useDeleteFinishedDate = () => {
    const remove = useMutation(api.finished.remove).withOptimisticUpdate((localStore, { id, userId, bookId }) => {
        const current = localStore.getQuery(api.finished.getForBook, { userId, bookId });
        if (current === undefined) return;

        localStore.setQuery(
            api.finished.getForBook,
            { userId, bookId },
            current.filter((finished) => finished.id !== id),
        );
    });

    return useTrackedMutation(({ id, bookId, userId }: Props) => remove({ id, userId, bookId }));
};
