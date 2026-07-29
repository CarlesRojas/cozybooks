// Counterpart of `src/server/use/rating/useRating.ts`. Reactive, so the old trick of
// pre-seeding the rating cache from the library query is no longer needed.

import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";

interface Props {
    bookId: string;
    userId: string;
}

export const useRating = ({ bookId, userId }: Props): { data: number | null | undefined; isLoading: boolean } => {
    const rating = useQuery(api.ratings.get, { userId, bookId });

    return { data: rating, isLoading: rating === undefined };
};
