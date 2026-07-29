// Counterpart of `src/server/use/unreleasedBook/useUnreleasedBooks.ts`. Reactive and
// server-sorted by name through the `by_user_name` index.

import type { UnreleasedBook } from "@/convex/type";
import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";

export const useUnreleasedBooks = (userId: string): { data: Array<UnreleasedBook> | undefined; isLoading: boolean } => {
    const unreleasedBooks = useQuery(api.unreleasedBooks.list, { userId });

    return { data: unreleasedBooks, isLoading: unreleasedBooks === undefined };
};
