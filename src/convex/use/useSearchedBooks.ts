// The Google Books search runs in a Convex action, so it can't use Convex's reactive
// `usePaginatedQuery` (database queries only). Pages are accumulated with
// `useInfiniteActionQuery` for infinite scrolling instead; a new query reports no
// results until its first page arrives, so the previous query's books are never
// shown under a new search. It searches the public catalogue, so it needs no
// Google token.

import { fromWireBook } from "@/convex/map";
import type { Book, VolumesResult } from "@/type/Book";
import { useInfiniteActionQuery } from "@/convex/use/util";
import { api } from "@convex/_generated/api";
import { useMemo } from "react";

interface Props {
    query: string;
    // Whose own books to search alongside the catalogue. They come back ahead of the
    // Google results, in the same paginated list.
    userId?: string;
    booksPerPage?: number;
}

export const useSearchedBooks = ({ query, userId, booksPerPage }: Props) => {
    const result = useInfiniteActionQuery(api.googleBooks.search, query.trim() ? { query, userId } : "skip", booksPerPage ?? 8);

    const data: VolumesResult | undefined = useMemo(() => {
        if (!query.trim()) return { totalItems: 0, items: [] };
        if (result.pages.length === 0) return undefined;

        // Google Books pagination can repeat volumes across pages; dedupe so ids stay
        // unique in the accumulated list.
        const seen = new Set<string>();
        const items: Array<Book> = [];
        for (const page of result.pages)
            for (const wireBook of page.items) {
                const book = fromWireBook(wireBook);
                if (seen.has(book.id)) continue;
                seen.add(book.id);
                items.push(book);
            }

        return { totalItems: result.pages[0].totalItems, items };
    }, [query, result.pages]);

    return {
        data,
        isLoading: query.trim() ? result.isLoading : false,
        isError: result.isError,
        hasNextPage: result.hasNextPage,
        isFetchingNextPage: result.isFetchingNextPage,
        fetchNextPage: result.fetchNextPage,
    };
};
