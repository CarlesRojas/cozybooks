// Maps Convex documents to the public (wire) shapes consumed by the frontend.
// The public book shape mirrors `BookSchema` in `src/type/Book.ts`, with dates as
// ms since epoch (Convex functions can't return Date objects) and `id` being the
// Google Books volume id, exactly like the old Postgres primary key.

import type { Doc } from "../_generated/dataModel";

export const publishBook = (book: Doc<"books">) => {
    const { _id, _creationTime, googleId, ...fields } = book;
    return { id: googleId, ...fields };
};

export const publishFinished = (finished: Doc<"finished">) => ({
    id: finished._id,
    userId: finished.userId,
    bookId: finished.bookId,
    timestamp: finished.timestamp,
});

export const publishUnreleasedBook = (unreleasedBook: Doc<"unreleasedBooks">) => ({
    id: unreleasedBook._id,
    userId: unreleasedBook.userId,
    name: unreleasedBook.name,
});

export type PublishedBook = ReturnType<typeof publishBook>;
export type PublishedFinished = ReturnType<typeof publishFinished>;
export type PublishedUnreleasedBook = ReturnType<typeof publishUnreleasedBook>;
