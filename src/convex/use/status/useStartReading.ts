// Counterpart of `src/server/use/status/useStartReading.ts`. Leaving WANT_TO_READ
// and entering READING is now a single transaction instead of two chained flows.

import { toWireBook } from "@/convex/map";
import type { Book } from "@/convex/type";
import { setOptimisticBookStatus } from "@/convex/use/status/optimistic";
import { useTrackedMutation } from "@/convex/use/util";
import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";

interface Props {
    book: Book;
    userId: string;
    googleToken: string;
}

export const useStartReading = () => {
    const startReading = useMutation(api.status.startReading).withOptimisticUpdate((localStore, { book, userId }) => {
        setOptimisticBookStatus(localStore, { bookId: book.id, userId, status: "READING_NOW" });
    });

    return useTrackedMutation(({ book, userId, googleToken }: Props) => startReading({ book: toWireBook(book), userId, googleToken }));
};
