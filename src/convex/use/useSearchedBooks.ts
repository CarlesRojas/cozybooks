// Counterpart of `src/server/use/useSearchedBooks.ts`. The Google Books search runs
// in a Convex action; previous results stay visible while the next page loads
// (the old `keepPreviousData` behavior).

import { fromWireBook } from "@/convex/map";
import type { VolumesResult } from "@/convex/type";
import { useActionQuery } from "@/convex/use/util";
import { api } from "@convex/_generated/api";
import { useMemo } from "react";

interface Props {
    query: string;
    booksPerPage?: number;
    offset?: number;
    googleToken: string;
}

export const useSearchedBooks = ({ query, booksPerPage, offset, googleToken }: Props) => {
    const result = useActionQuery(
        api.googleBooks.search,
        query.trim() ? { googleToken, query, maxResults: booksPerPage ?? 8, startIndex: offset ?? 0 } : "skip",
    );

    const data: VolumesResult | undefined = useMemo(() => {
        if (!query.trim()) return { totalItems: 0, items: [] };
        if (!result.data) return undefined;
        return { totalItems: result.data.totalItems, items: result.data.items.map(fromWireBook) };
    }, [query, result.data]);

    return { data, isLoading: query.trim() ? result.isLoading : false, isError: result.isError };
};
