"use client";

import { Button } from "@/component/ui/button";
import { useAddToWantToRead } from "@/server/use/status/useAddToWantToRead";
import { useFinishBook } from "@/server/use/status/useFinishBook";
import { useRemoveFromWantToRead } from "@/server/use/status/useRemoveFromWantToRead";
import { useStartReading } from "@/server/use/status/useStartReading";
import { useStopReading } from "@/server/use/status/useStopReading";
import { BookStatus, useBookStatus } from "@/server/use/useBookStatus";
import { Book } from "@/type/Book";
import { ReactNode } from "react";
import { LuBookMarked, LuBookOpen, LuLoader, LuPlus, LuX } from "react-icons/lu";

interface Props {
    book: Book;
}

const LibraryButton = ({ book }: Props) => {
    const bookStatus = useBookStatus({ bookId: book.id });

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
                <p className="max-w-[30rem] text-pretty text-center text-sm font-semibold tracking-wide text-red-500">
                    There was an error.
                </p>
            )}
        </div>
    );

    if (!bookStatus.data)
        return container(
            <Button disabled>
                <LuLoader className="icon animate-spin" />
            </Button>,
        );

    const map: Record<BookStatus, ReactNode> = {
        [BookStatus.NONE]: (
            <Button disabled={isLoading} onClick={() => addToWantToRead.mutate({ book })}>
                {addToWantToRead.isPending ? <LuLoader className="icon animate-spin" /> : <LuPlus className="icon mr-3" />}
                <p>I want to read this</p>
            </Button>
        ),

        [BookStatus.WANT_TO_READ]: (
            <>
                <Button disabled={isLoading} onClick={() => startReading.mutate({ book })}>
                    {startReading.isPending ? <LuLoader className="icon animate-spin" /> : <LuBookOpen className="icon mr-3" />}
                    <p>Start reading</p>
                </Button>

                <Button disabled={isLoading} variant="glass" onClick={() => removeFromWantToRead.mutate({ book })}>
                    {removeFromWantToRead.isPending ? <LuLoader className="icon animate-spin" /> : <LuX className="icon mr-3" />}
                    <p>I no longer want to read this</p>
                </Button>
            </>
        ),

        [BookStatus.READING_NOW]: (
            <>
                <Button disabled={isLoading} onClick={() => finishBook.mutate({ book })}>
                    {finishBook.isPending ? <LuLoader className="icon animate-spin" /> : <LuBookMarked className="icon mr-3" />}
                    <p>Finish book</p>
                </Button>

                <Button disabled={isLoading} variant="glass" onClick={() => stopReading.mutate({ book })}>
                    {stopReading.isPending ? <LuLoader className="icon animate-spin" /> : <LuX className="icon mr-3" />}
                    <p>Stop reading</p>
                </Button>
            </>
        ),
    };

    return container(map[bookStatus.data]);
};

export default LibraryButton;
