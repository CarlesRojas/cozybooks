// Books to show under the one being viewed. The Google Books API has no notion of a
// series, so the action behind this ranks the author's other books by how much of
// this one's title they repeat — see `convex/googleBooks.ts`.

import { fromWireBook } from "@/convex/map";
import type { VolumesResult } from "@/type/Book";
import { useActionQuery } from "@/convex/use/util";
import { api } from "@convex/_generated/api";
import { useMemo } from "react";

interface Props {
    bookId: string;
    title: string;
    author?: string;
    maxResults?: number;
}

export const useRelatedBooks = ({ bookId, title, author, maxResults }: Props) => {
    const result = useActionQuery(api.googleBooks.related, { bookId, title, author, maxResults });

    const data: VolumesResult | undefined = useMemo(() => {
        if (!result.data) return undefined;
        return { totalItems: result.data.totalItems, items: result.data.items.map(fromWireBook) };
    }, [result.data]);

    return { data, isLoading: result.isLoading, isError: result.isError };
};
