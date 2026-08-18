// Creating and editing a user's own book. Both do the same two things in the same
// order — put the cover in the Blob store, then write the book — so they share one
// hook and one piece of pending/error state.
//
// The cover goes first on purpose. If the upload fails there is no book yet (or the
// old one is untouched), which is a state the user can simply retry; the other order
// would leave a saved book pointing at a cover that never arrived.

import { deleteCover, uploadCover } from "@/lib/blob";
import type { CustomBookInput } from "@/type/CustomBook";
import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { useCallback, useState } from "react";

interface Props extends CustomBookInput {
    // Only to name the cover's path in the blob store, which is checked against the
    // session server-side (`src/routes/api/blob/upload.ts`). The book itself is written
    // against the identity Convex verified.
    userId: string;
    // Absent when creating.
    bookId?: string;
}

export const useSaveCustomBook = () => {
    const create = useMutation(api.customBooks.create);
    const update = useMutation(api.customBooks.update);

    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const save = useCallback(
        async ({ userId, bookId, coverFile, coverUrl, ...fields }: Props): Promise<string | null> => {
            setIsPending(true);
            setError(null);

            try {
                const cover = coverFile ? await uploadCover(coverFile, userId) : coverUrl;

                if (!bookId) return await create({ coverUrl: cover, ...fields });

                const { discardedCoverUrl } = await update({ bookId, coverUrl: cover, ...fields });
                if (discardedCoverUrl) void deleteCover(discardedCoverUrl);

                return bookId;
            } catch (caught) {
                setError(caught instanceof Error ? caught.message : "Saving the book failed");
                return null;
            } finally {
                setIsPending(false);
            }
        },
        [create, update],
    );

    return { save, isPending, error };
};
