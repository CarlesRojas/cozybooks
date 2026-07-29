// Counterpart of `src/server/use/finished/useFinishedDates.ts`. Reactive: updates
// live when finished dates are created, edited or deleted, with no manual refetching.

import { fromWireFinished } from "@/convex/map";
import type { FinishedDate } from "@/convex/type";
import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { useMemo } from "react";

interface Props {
    bookId: string;
    userId: string;
}

export const useFinishedDates = ({ bookId, userId }: Props): { data: Array<FinishedDate> | undefined; isLoading: boolean } => {
    const finished = useQuery(api.finished.getForBook, { userId, bookId });
    const data = useMemo(() => finished?.map(fromWireFinished), [finished]);

    return { data, isLoading: finished === undefined };
};
