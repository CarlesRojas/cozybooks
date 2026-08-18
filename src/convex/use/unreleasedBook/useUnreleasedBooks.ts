// Counterpart of `src/server/use/unreleasedBook/useUnreleasedBooks.ts`. Reactive and
// server-sorted by name through the `by_user_name` index.

import type { UnreleasedBook } from "@/type/UnreleasedBook";
import { api } from "@convex/_generated/api";
import { useQuery } from "convex-helpers/react/cache";

export const useUnreleasedBooks = (): { data: Array<UnreleasedBook> | undefined; isLoading: boolean } => {
    const unreleasedBooks = useQuery(api.unreleasedBooks.list, {});

    return { data: unreleasedBooks, isLoading: unreleasedBooks === undefined };
};
