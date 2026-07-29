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
import { BookMarked, BookOpen, Loader, Plus, X } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
    book: Book;
    userId: string;
    googleToken: string;
}

const LibraryButton = ({ book, userId, googleToken }: Props) => {
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

    if (!bookStatus.data || !finishedDates.data)
        return container(
            <Button disabled>
                <Loader className="icon animate-spin" />
            </Button>,
        );

    const map: Record<BookStatus, ReactNode> = {
        [BookStatus.NONE]: (
            <Button disabled={isLoading} onClick={() => addToWantToRead.mutate({ book, userId, googleToken })}>
                {addToWantToRead.isPending ? <Loader className="icon mr-3 animate-spin" /> : <Plus className="icon mr-3" />}
                <p>{finishedDates.data.length > 0 ? "I want to read this again" : "I want to read this"}</p>
            </Button>
        ),

        [BookStatus.WANT_TO_READ]: (
            <>
                <Button disabled={isLoading} onClick={() => startReading.mutate({ book, userId, googleToken })}>
                    {startReading.isPending ? <Loader className="icon mr-3 animate-spin" /> : <BookOpen className="icon mr-3" />}
                    <p>Start reading</p>
                </Button>

                <Button disabled={isLoading} variant="glass" onClick={() => removeFromWantToRead.mutate({ book, userId, googleToken })}>
                    {removeFromWantToRead.isPending ? <Loader className="icon mr-3 animate-spin" /> : <X className="icon mr-3" />}
                    <p>{finishedDates.data.length > 0 ? "I no longer want to read this again" : "I no longer want to read this"}</p>
                </Button>
            </>
        ),

        [BookStatus.READING_NOW]: (
            <>
                <Button disabled={isLoading} onClick={() => finishBook.mutate({ book, userId, googleToken })}>
                    {finishBook.isPending ? <Loader className="icon mr-3 animate-spin" /> : <BookMarked className="icon mr-3" />}
                    <p>Finish book</p>
                </Button>

                <Button disabled={isLoading} variant="glass" onClick={() => stopReading.mutate({ book, userId, googleToken })}>
                    {stopReading.isPending ? <Loader className="icon mr-3 animate-spin" /> : <X className="icon mr-3" />}
                    <p>Stop reading</p>
                </Button>
            </>
        ),
    };

    return container(map[bookStatus.data]);
};

export default LibraryButton;
