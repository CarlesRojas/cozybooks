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
    id: string;
}

export const useDeleteFinishedDate = () => {
    const remove = useMutation(api.finished.remove).withOptimisticUpdate((localStore, { id, bookId }) => {
        const current = localStore.getQuery(api.finished.getForBook, { bookId });
        if (current === undefined) return;

        localStore.setQuery(
            api.finished.getForBook,
            { bookId },
            current.filter((finished) => finished.id !== id),
        );
    });

    return useTrackedMutation(({ id, bookId }: Props) => remove({ id: id as Id<"finished">, bookId }));
};
