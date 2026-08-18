// Counterpart of `src/server/use/rating/useDeleteRating.ts`.

import { useTrackedMutation } from "@/convex/use/util";
import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";

interface Props {
    bookId: string;
}

export const useDeleteRating = () => {
    const remove = useMutation(api.ratings.remove).withOptimisticUpdate((localStore, { bookId }) => {
        if (localStore.getQuery(api.ratings.get, { bookId }) === undefined) return;
        localStore.setQuery(api.ratings.get, { bookId }, null);
    });

    return useTrackedMutation(({ bookId }: Props) => remove({ bookId }));
};
