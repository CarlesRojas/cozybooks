// Lists one of the user's Google "My Library" bookshelves through a Convex action. This
// is per-user data, so it needs the Google OAuth token.

import { fromWireBook } from "@/convex/map";
import type { VolumesResult } from "@/type/Book";
import { useActionQuery } from "@/convex/use/util";
import { api } from "@convex/_generated/api";
import type { BookShelfType } from "@/type/BookShelf";
import { useMemo } from "react";

interface Props {
    type: BookShelfType;
    booksPerPage?: number;
    offset?: number;
    googleToken: string;
}

export const useBookShelf = ({ type, booksPerPage, offset, googleToken }: Props) => {
    const result = useActionQuery(api.googleBooks.getBookShelf, {
        googleToken,
        bookshelf: type,
        maxResults: booksPerPage ?? 8,
        startIndex: offset ?? 0,
    });

    const data: VolumesResult | undefined = useMemo(() => {
        if (!result.data) return undefined;
        return { totalItems: result.data.totalItems, items: result.data.items.map(fromWireBook) };
    }, [result.data]);

    return { data, isLoading: result.isLoading, isError: result.isError };
};
