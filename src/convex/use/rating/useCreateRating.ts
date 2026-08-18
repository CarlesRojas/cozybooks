// Counterpart of `src/server/use/rating/useCreateRating.ts`.

import { useTrackedMutation } from "@/convex/use/util";
import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";

interface Props {
    bookId: string;
    rating: number;
}

export const useCreateRating = () => {
    const set = useMutation(api.ratings.set).withOptimisticUpdate((localStore, { bookId, rating }) => {
        if (localStore.getQuery(api.ratings.get, { bookId }) === undefined) return;
        localStore.setQuery(api.ratings.get, { bookId }, rating);
    });

    return useTrackedMutation(({ bookId, rating }: Props) => set({ bookId, rating }));
};
