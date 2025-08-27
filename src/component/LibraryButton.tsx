import { Button } from "@/component/ui/button";
import { useFinishedDates } from "@/server/old/use/finished/useFinishedDates";
import { useAddToWantToRead } from "@/server/old/use/status/useAddToWantToRead";
import { useFinishBook } from "@/server/old/use/status/useFinishBook";
import { useRemoveFromWantToRead } from "@/server/old/use/status/useRemoveFromWantToRead";
import { useStartReading } from "@/server/old/use/status/useStartReading";
import { useStopReading } from "@/server/old/use/status/useStopReading";
import { BookStatus, useBookStatus } from "@/server/old/use/useBookStatus";
import { Book } from "@/type/Book";
import { LuBookMarked, LuBookOpen, LuLoader, LuPlus, LuX } from "lucide-react";
import { ReactNode } from "react";

interface Props {
    book: Book;
}

const LibraryButton = ({ book }: Props) => {
    const bookStatus = useBookStatus({ bookId: book.id });
    const finishedDates = useFinishedDates({ bookId: book.id });

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
                <LuLoader className="icon animate-spin" />
            </Button>,
        );

    const map: Record<BookStatus, ReactNode> = {
        [BookStatus.NONE]: (
            <Button disabled={isLoading} onClick={() => addToWantToRead.mutate({ book })}>
                {addToWantToRead.isPending ? <LuLoader className="icon mr-3 animate-spin" /> : <LuPlus className="icon mr-3" />}
                <p>{finishedDates.data.length > 0 ? "I want to read this again" : "I want to read this"}</p>
            </Button>
        ),

        [BookStatus.WANT_TO_READ]: (
            <>
                <Button disabled={isLoading} onClick={() => startReading.mutate({ book })}>
                    {startReading.isPending ? <LuLoader className="icon mr-3 animate-spin" /> : <LuBookOpen className="icon mr-3" />}
                    <p>Start reading</p>
                </Button>

                <Button disabled={isLoading} variant="glass" onClick={() => removeFromWantToRead.mutate({ book })}>
                    {removeFromWantToRead.isPending ? <LuLoader className="icon mr-3 animate-spin" /> : <LuX className="icon mr-3" />}
                    <p>{finishedDates.data.length > 0 ? "I no longer want to read this again" : "I no longer want to read this"}</p>
                </Button>
            </>
        ),

        [BookStatus.READING_NOW]: (
            <>
                <Button disabled={isLoading} onClick={() => finishBook.mutate({ book })}>
                    {finishBook.isPending ? <LuLoader className="icon mr-3 animate-spin" /> : <LuBookMarked className="icon mr-3" />}
                    <p>Finish book</p>
                </Button>

                <Button disabled={isLoading} variant="glass" onClick={() => stopReading.mutate({ book })}>
                    {stopReading.isPending ? <LuLoader className="icon mr-3 animate-spin" /> : <LuX className="icon mr-3" />}
                    <p>Stop reading</p>
                </Button>
            </>
        ),
    };

    return container(map[bookStatus.data]);
};

export default LibraryButton;
