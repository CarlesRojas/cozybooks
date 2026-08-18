// Counterpart of `src/server/use/unreleasedBook/useAddUnreleasedBook.ts`.

import { optimisticId, useTrackedMutation } from "@/convex/use/util";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";

interface Props {
    name: string;
}

export const useAddUnreleasedBook = () => {
    const add = useMutation(api.unreleasedBooks.add).withOptimisticUpdate((localStore, { name }) => {
        const current = localStore.getQuery(api.unreleasedBooks.list, {});
        if (current === undefined) return;

        // `userId` is on the wire row because the query returns what the table holds;
        // the optimistic stand-in copies it off a row already on screen, or is empty
        // when this is the first one.
        const optimistic = { id: optimisticId<Id<"unreleasedBooks">>(), userId: current[0]?.userId ?? "", name };
        localStore.setQuery(
            api.unreleasedBooks.list,
            {},
            [...current, optimistic].sort((a, b) => a.name.localeCompare(b.name)),
        );
    });

    return useTrackedMutation(({ name }: Props) => add({ name }));
};
