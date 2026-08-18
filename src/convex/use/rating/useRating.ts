// Counterpart of `src/server/use/rating/useRating.ts`. Reactive, so the old trick of
// pre-seeding the rating cache from the library query is no longer needed.

import { api } from "@convex/_generated/api";
import { useQuery } from "convex-helpers/react/cache";

interface Props {
    bookId: string;
}

export const useRating = ({ bookId }: Props): { data: number | null | undefined; isLoading: boolean } => {
    const rating = useQuery(api.ratings.get, { bookId });

    return { data: rating, isLoading: rating === undefined };
};
