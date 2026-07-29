// Counterpart of `src/server/use/status/useAddToWantToRead.ts`. The old flow was
// three client-orchestrated server calls (cache book, add library row, sync Google
// bookshelf); now it's one transactional mutation that schedules the Google sync
// server-side, off the critical path.

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

export const useAddToWantToRead = () => {
    const addToWantToRead = useMutation(api.status.addToWantToRead).withOptimisticUpdate((localStore, { book, userId }) => {
        setOptimisticBookStatus(localStore, { bookId: book.id, userId, status: "WANT_TO_READ" });
    });

    return useTrackedMutation(({ book, userId, googleToken }: Props) => addToWantToRead({ book: toWireBook(book), userId, googleToken }));
};
