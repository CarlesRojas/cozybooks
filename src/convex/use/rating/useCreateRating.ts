// Counterpart of `src/server/use/rating/useCreateRating.ts`.

import { useTrackedMutation } from "@/convex/use/util";
import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";

interface Props {
    bookId: string;
    rating: number;
    userId: string;
}

export const useCreateRating = () => {
    const set = useMutation(api.ratings.set).withOptimisticUpdate((localStore, { userId, bookId, rating }) => {
        if (localStore.getQuery(api.ratings.get, { userId, bookId }) === undefined) return;
        localStore.setQuery(api.ratings.get, { userId, bookId }, rating);
    });

    return useTrackedMutation(({ bookId, rating, userId }: Props) => set({ userId, bookId, rating }));
};
