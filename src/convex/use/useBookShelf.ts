// Lists one of the user's Google "My Library" bookshelves through a Convex action.
// This is per-user data, so it needs the Google OAuth token. Like `useSearchedBooks`
// it paginates with `useInfiniteActionQuery`, since actions can't use Convex's
// reactive `usePaginatedQuery`.

import { fromWireBook } from "@/convex/map";
import type { Book, VolumesResult } from "@/type/Book";
import { useInfiniteActionQuery } from "@/convex/use/util";
import { api } from "@convex/_generated/api";
import type { BookShelfType } from "@/type/BookShelf";
import { useMemo } from "react";

interface Props {
    type: BookShelfType;
    booksPerPage?: number;
    googleToken: string;
}

export const useBookShelf = ({ type, booksPerPage, googleToken }: Props) => {
    const result = useInfiniteActionQuery(api.googleBooks.getBookShelf, { googleToken, bookshelf: type }, booksPerPage ?? 8);

    const data: VolumesResult | undefined = useMemo(() => {
        if (result.pages.length === 0) return undefined;

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
    }, [result.pages]);

    return {
        data,
        isLoading: result.isLoading,
        isError: result.isError,
        hasNextPage: result.hasNextPage,
        isFetchingNextPage: result.isFetchingNextPage,
        fetchNextPage: result.fetchNextPage,
    };
};
