// Counterpart of `src/server/use/unreleasedBook/useDeleteUnreleasedBook.ts`.

import { useTrackedMutation } from "@/convex/use/util";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";

interface Props {
    unreleasedBookId: string;
    userId: string;
}

export const useDeleteUnreleasedBook = () => {
    const remove = useMutation(api.unreleasedBooks.remove).withOptimisticUpdate((localStore, { id, userId }) => {
        const current = localStore.getQuery(api.unreleasedBooks.list, { userId });
        if (current === undefined) return;

        localStore.setQuery(
            api.unreleasedBooks.list,
            { userId },
            current.filter((unreleasedBook) => unreleasedBook.id !== id),
        );
    });

    return useTrackedMutation(({ unreleasedBookId, userId }: Props) => remove({ id: unreleasedBookId as Id<"unreleasedBooks">, userId }));
};
