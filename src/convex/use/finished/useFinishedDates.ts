// Counterpart of `src/server/use/finished/useFinishedDates.ts`. Reactive: updates
// live when finished dates are created, edited or deleted, with no manual refetching.

import { fromWireFinished } from "@/convex/map";
import type { Finished } from "@/type/Finished";
import { api } from "@convex/_generated/api";
import { useQuery } from "convex-helpers/react/cache";
import { useMemo } from "react";

interface Props {
    bookId: string;
}

export const useFinishedDates = ({ bookId }: Props): { data: Array<Finished> | undefined; isLoading: boolean } => {
    const finished = useQuery(api.finished.getForBook, { bookId });
    const data = useMemo(() => finished?.map(fromWireFinished), [finished]);

    return { data, isLoading: finished === undefined };
};
