// Counterpart of `src/server/use/useLibraryBooks.ts`. One reactive query returns the
// library page with each book's finished dates and rating joined in; ratings, book
// statuses and finished dates no longer need to be pre-seeded into a query cache
// because their own reactive queries stay live everywhere.

import { fromWireVolumesResult } from "@/convex/map";
import type { VolumesResult } from "@/type/Book";
import { LibraryType } from "@/type/Library";
import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { useMemo } from "react";

interface Props {
    userId: string;
    type: LibraryType;
    maxResults?: number;
    startIndex?: number;
}

const WIRE_LIBRARY_TYPE = {
    [LibraryType.READING]: "READING",
    [LibraryType.TO_READ]: "TO_READ",
    [LibraryType.FINISHED]: "FINISHED",
} as const;

export const useLibraryBooks = ({
    userId,
    type,
    maxResults,
    startIndex,
}: Props): { data: VolumesResult | undefined; isLoading: boolean } => {
    const result = useQuery(api.library.getBooks, { userId, type: WIRE_LIBRARY_TYPE[type], maxResults, startIndex });
    const data = useMemo(() => (result ? fromWireVolumesResult(result) : undefined), [result]);

    return { data, isLoading: result === undefined };
};
