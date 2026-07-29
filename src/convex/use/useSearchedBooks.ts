// The Google Books search runs in a Convex action; previous results stay visible while
// the next page loads. It searches the public catalogue, so unlike `useBookShelf` it
// needs no Google token.

import { fromWireBook } from "@/convex/map";
import type { VolumesResult } from "@/type/Book";
import { useActionQuery } from "@/convex/use/util";
import { api } from "@convex/_generated/api";
import { useMemo } from "react";

interface Props {
    query: string;
    booksPerPage?: number;
    offset?: number;
}

export const useSearchedBooks = ({ query, booksPerPage, offset }: Props) => {
    const result = useActionQuery(
        api.googleBooks.search,
        query.trim() ? { query, maxResults: booksPerPage ?? 8, startIndex: offset ?? 0 } : "skip",
    );

    const data: VolumesResult | undefined = useMemo(() => {
        if (!query.trim()) return { totalItems: 0, items: [] };
        if (!result.data) return undefined;
        return { totalItems: result.data.totalItems, items: result.data.items.map(fromWireBook) };
    }, [query, result.data]);

    return { data, isLoading: query.trim() ? result.isLoading : false, isError: result.isError };
};
