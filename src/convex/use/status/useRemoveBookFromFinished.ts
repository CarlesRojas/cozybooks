// Counterpart of `src/server/use/status/useRemoveBookFromFinished.ts`.

import type { Book } from "@/type/Book";
import { useTrackedMutation } from "@/convex/use/util";
import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";

interface Props {
    book: Book;
}

export const useRemoveBookFromFinished = () => {
    const removeFromFinished = useMutation(api.status.removeFromFinished);

    return useTrackedMutation(({ book }: Props) => removeFromFinished({ bookId: book.id }));
};
