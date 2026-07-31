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
import { faFlag, faPause, faPlay, faPlus, faRepeat, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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

    // Short imperative labels, with playback icons to match: reading is something you
    // start, pause and finish. The one to keep honest is the reading state's secondary
    // action — it returns the book to the want-to-read shelf rather than removing it,
    // which "Stop reading" hid and "Pause reading" doesn't.
    const map: Record<BookStatus, ReactNode> = {
        [BookStatus.NONE]: (
            <Button disabled={isLoading} onClick={() => addToWantToRead.mutate({ book, userId })}>
                {finishedDates.data.length > 0 ? (
                    <FontAwesomeIcon icon={faRepeat} className="icon mr-3" />
                ) : (
                    <FontAwesomeIcon icon={faPlus} className="icon mr-3" />
                )}
                <p>{finishedDates.data.length > 0 ? "Read again" : "Want to read"}</p>
            </Button>
        ),

        [BookStatus.WANT_TO_READ]: (
            <>
                <Button disabled={isLoading} onClick={() => startReading.mutate({ book, userId })}>
                    <FontAwesomeIcon icon={faPlay} className="icon mr-3" />
                    <p>Start reading</p>
                </Button>

                <Button disabled={isLoading} variant="glass" onClick={() => removeFromWantToRead.mutate({ book, userId })}>
                    <FontAwesomeIcon icon={faXmark} className="icon mr-3" />
                    <p>Remove</p>
                </Button>
            </>
        ),

        [BookStatus.READING_NOW]: (
            <>
                <Button disabled={isLoading} onClick={() => finishBook.mutate({ book, userId })}>
                    <FontAwesomeIcon icon={faFlag} className="icon mr-3" />
                    <p>Finished</p>
                </Button>

                <Button disabled={isLoading} variant="glass" onClick={() => stopReading.mutate({ book, userId })}>
                    <FontAwesomeIcon icon={faPause} className="icon mr-3" />
                    <p>Pause reading</p>
                </Button>
            </>
        ),
    };

    return container(map[bookStatus.data]);
};

export default LibraryButton;
