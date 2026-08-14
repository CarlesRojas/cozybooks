// Counterpart of `src/server/use/book/useBook.ts`.
//
// The book is served from the reactive `books.get` query (the Convex cache). On a
// cache miss the `getWithGoogleFallback` action fetches the volume from the Google
// Books API and stores it, which makes the reactive query emit the book — no
// client-side cache management needed.

import { fromWireBook } from "@/convex/map";
import type { Book } from "@/type/Book";
import { api } from "@convex/_generated/api";
import { useQuery } from "convex-helpers/react/cache";
import { useAction } from "convex/react";
import { useEffect, useMemo, useState } from "react";

interface Props {
    bookId: string;
    // Books the user wrote themselves are only readable by them, so the reader is
    // part of the read.
    userId?: string;
}

export const useBook = ({ bookId, userId }: Props): { data: Book | null | undefined; isLoading: boolean } => {
    const cached = useQuery(api.books.get, { bookId, userId });
    const getWithGoogleFallback = useAction(api.books.getWithGoogleFallback);
    const [missingBookId, setMissingBookId] = useState<string | null>(null);

    useEffect(() => {
        if (cached !== null) return;

        let cancelled = false;

        getWithGoogleFallback({ bookId, userId })
            .then((book) => {
                if (!cancelled && book === null) setMissingBookId(bookId);
            })
            .catch(() => {
                if (!cancelled) setMissingBookId(bookId);
            });

        return () => {
            cancelled = true;
        };
    }, [cached, bookId, userId, getWithGoogleFallback]);

    const data = useMemo(() => {
        if (cached) return fromWireBook(cached);
        return missingBookId === bookId ? null : undefined;
    }, [cached, missingBookId, bookId]);

    return { data, isLoading: data === undefined };
};
