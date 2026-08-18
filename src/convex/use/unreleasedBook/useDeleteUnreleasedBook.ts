// Counterpart of `src/server/use/unreleasedBook/useDeleteUnreleasedBook.ts`.

import { useTrackedMutation } from "@/convex/use/util";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";

interface Props {
    unreleasedBookId: string;
}

export const useDeleteUnreleasedBook = () => {
    const remove = useMutation(api.unreleasedBooks.remove).withOptimisticUpdate((localStore, { id }) => {
        const current = localStore.getQuery(api.unreleasedBooks.list, {});
        if (current === undefined) return;

        localStore.setQuery(
            api.unreleasedBooks.list,
            {},
            current.filter((unreleasedBook) => unreleasedBook.id !== id),
        );
    });

    return useTrackedMutation(({ unreleasedBookId }: Props) => remove({ id: unreleasedBookId as Id<"unreleasedBooks"> }));
};
