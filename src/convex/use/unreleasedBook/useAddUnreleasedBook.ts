// Counterpart of `src/server/use/unreleasedBook/useAddUnreleasedBook.ts`.

import { optimisticId, useTrackedMutation } from "@/convex/use/util";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";

interface Props {
    name: string;
    userId: string;
}

export const useAddUnreleasedBook = () => {
    const add = useMutation(api.unreleasedBooks.add).withOptimisticUpdate((localStore, { name, userId }) => {
        const current = localStore.getQuery(api.unreleasedBooks.list, { userId });
        if (current === undefined) return;

        const optimistic = { id: optimisticId<Id<"unreleasedBooks">>(), userId, name };
        localStore.setQuery(
            api.unreleasedBooks.list,
            { userId },
            [...current, optimistic].sort((a, b) => a.name.localeCompare(b.name)),
        );
    });

    return useTrackedMutation(({ name, userId }: Props) => add({ name, userId }));
};
