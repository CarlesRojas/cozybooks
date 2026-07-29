// Counterpart of `src/server/use/useBookStatus.ts`. One reactive query (two indexed
// point reads server-side) instead of two sequential server calls, and the status
// updates live when any status mutation lands.

import { BookStatus } from "@/type/Book";
import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";

interface Props {
    bookId: string;
    userId: string;
}

export const useBookStatus = ({ bookId, userId }: Props): { data: BookStatus | undefined; isLoading: boolean } => {
    const status = useQuery(api.status.getBookStatus, { bookId, userId });

    return { data: status !== undefined ? BookStatus[status] : undefined, isLoading: status === undefined };
};
