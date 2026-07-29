// Counterpart of `src/server/use/rating/useDeleteRating.ts`.

import { useTrackedMutation } from "@/convex/use/util";
import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";

interface Props {
    bookId: string;
    userId: string;
}

export const useDeleteRating = () => {
    const remove = useMutation(api.ratings.remove).withOptimisticUpdate((localStore, { userId, bookId }) => {
        if (localStore.getQuery(api.ratings.get, { userId, bookId }) === undefined) return;
        localStore.setQuery(api.ratings.get, { userId, bookId }, null);
    });

    return useTrackedMutation(({ bookId, userId }: Props) => remove({ userId, bookId }));
};
