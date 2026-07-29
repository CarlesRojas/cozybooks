// Counterpart of `src/server/use/book/useBook.ts`.
//
// The book is served from the reactive `books.get` query (the Convex cache). On a
// cache miss the `getWithGoogleFallback` action fetches the volume from the Google
// Books API and stores it, which makes the reactive query emit the book — no
// client-side cache management needed.

import { fromWireBook } from "@/convex/map";
import type { Book } from "@/type/Book";
import { api } from "@convex/_generated/api";
import { useAction, useQuery } from "convex/react";
import { useEffect, useMemo, useState } from "react";

interface Props {
    bookId: string;
}

export const useBook = ({ bookId }: Props): { data: Book | null | undefined; isLoading: boolean } => {
    const cached = useQuery(api.books.get, { bookId });
    const getWithGoogleFallback = useAction(api.books.getWithGoogleFallback);
    const [missingBookId, setMissingBookId] = useState<string | null>(null);

    useEffect(() => {
        if (cached !== null) return;

        let cancelled = false;

        getWithGoogleFallback({ bookId })
            .then((book) => {
                if (!cancelled && book === null) setMissingBookId(bookId);
            })
            .catch(() => {
                if (!cancelled) setMissingBookId(bookId);
            });

        return () => {
            cancelled = true;
        };
    }, [cached, bookId, getWithGoogleFallback]);

    const data = useMemo(() => {
        if (cached) return fromWireBook(cached);
        return missingBookId === bookId ? null : undefined;
    }, [cached, missingBookId, bookId]);

    return { data, isLoading: data === undefined };
};
