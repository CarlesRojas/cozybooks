import { Button } from "@/component/ui/button";
import { useFinishedDates } from "@/convex/use/finished/useFinishedDates";
import { useAddToWantToRead } from "@/convex/use/status/useAddToWantToRead";
import { useFinishBook } from "@/convex/use/status/useFinishBook";
import { useRemoveFromWantToRead } from "@/convex/use/status/useRemoveFromWantToRead";
import { useStartReading } from "@/convex/use/status/useStartReading";
import { useStopReading } from "@/convex/use/status/useStopReading";
import { useBookStatus } from "@/convex/use/useBookStatus";
import type { Book } from "@/type/Book";
import { BookStatus } from "@/type/Book";
import { BookMarked, BookOpen, Plus, Undo2, X } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
    book: Book;
    userId: string;
}

const LibraryButton = ({ book, userId }: Props) => {
    const bookStatus = useBookStatus({ bookId: book.id, userId });
    const finishedDates = useFinishedDates({ bookId: book.id, userId });

    const addToWantToRead = useAddToWantToRead();
    const removeFromWantToRead = useRemoveFromWantToRead();
    const startReading = useStartReading();
    const finishBook = useFinishBook();
    const stopReading = useStopReading();

    const isLoading =
        addToWantToRead.isPending ||
        removeFromWantToRead.isPending ||
        startReading.isPending ||
        finishBook.isPending ||
        stopReading.isPending;

    const isError =
        addToWantToRead.isError || removeFromWantToRead.isError || startReading.isError || finishBook.isError || stopReading.isError;

    const container = (children: ReactNode) => (
        <div className="flex w-full flex-col items-center justify-center gap-4">
            <div className="flex w-full flex-wrap items-center justify-center gap-3">{children}</div>

            {isError && (
                <p className="max-w-[30rem] text-center text-sm font-semibold tracking-wide text-pretty text-red-500">
                    There was an error.
                </p>
            )}
        </div>
    );

    if (!bookStatus.data || !finishedDates.data) return null;

    // Each label names the shelf the book lands on, using the same words as the
    // library sections, so pressing one has no surprise. "Stop reading" used to hide
    // that it puts the book back on the want-to-read shelf rather than removing it.
    const map: Record<BookStatus, ReactNode> = {
        [BookStatus.NONE]: (
            <Button disabled={isLoading} onClick={() => addToWantToRead.mutate({ book, userId })}>
                <Plus className="icon mr-3" />
                <p>{finishedDates.data.length > 0 ? "Read it again" : "Add to want to read"}</p>
            </Button>
        ),

        [BookStatus.WANT_TO_READ]: (
            <>
                <Button disabled={isLoading} onClick={() => startReading.mutate({ book, userId })}>
                    <BookOpen className="icon mr-3" />
                    <p>Start reading</p>
                </Button>

                <Button disabled={isLoading} variant="glass" onClick={() => removeFromWantToRead.mutate({ book, userId })}>
                    <X className="icon mr-3" />
                    <p>Remove from want to read</p>
                </Button>
            </>
        ),

        [BookStatus.READING_NOW]: (
            <>
                <Button disabled={isLoading} onClick={() => finishBook.mutate({ book, userId })}>
                    <BookMarked className="icon mr-3" />
                    <p>Mark as finished</p>
                </Button>

                <Button disabled={isLoading} variant="glass" onClick={() => stopReading.mutate({ book, userId })}>
                    <Undo2 className="icon mr-3" />
                    <p>Back to want to read</p>
                </Button>
            </>
        ),
    };

    return container(map[bookStatus.data]);
};

export default LibraryButton;
