"use client";

import { Button } from "@/component/ui/button";
import { useAddToWantToRead } from "@/server/use/status/useAddToWantToRead";
import { useFinishBook } from "@/server/use/status/useFinishBook";
import { useRemoveFromWantToRead } from "@/server/use/status/useRemoveFromWantToRead";
import { useStartReading } from "@/server/use/status/useStartReading";
import { useStopReading } from "@/server/use/status/useStopReading";
import { BookStatus, useBookStatus } from "@/server/use/useBookStatus";
import { ReactNode } from "react";
import { LuBookMarked, LuBookOpen, LuLoader, LuPlus, LuX } from "react-icons/lu";

interface Props {
    bookId: string;
}

const LibraryButton = ({ bookId }: Props) => {
    const bookStatus = useBookStatus({ bookId });

    const addToWantToRead = useAddToWantToRead();
    const removeFromWantToRead = useRemoveFromWantToRead();
    const startReading = useStartReading();
    const finishBook = useFinishBook();
    const stopReading = useStopReading();

    const container = (children: ReactNode) => (
        <div className="flex w-full flex-col items-center justify-center gap-4">
            <div className="flex w-full flex-wrap items-center justify-center gap-3">{children}</div>

            {addToWantToRead.isError && (
                <p className="max-w-[30rem] text-pretty text-center text-sm font-semibold tracking-wide text-red-500">
                    There was an error while adding this book to your library
                </p>
            )}

            {removeFromWantToRead.isError && (
                <p className="max-w-[30rem] text-pretty text-center text-sm font-semibold tracking-wide text-red-500">
                    There was an error while removing this book from your library
                </p>
            )}

            {startReading.isError && (
                <p className="max-w-[30rem] text-pretty text-center text-sm font-semibold tracking-wide text-red-500">
                    There was an error while adding this book to your reading list
                </p>
            )}

            {stopReading.isError && (
                <p className="max-w-[30rem] text-pretty text-center text-sm font-semibold tracking-wide text-red-500">
                    There was an error while removing this book from your reading list
                </p>
            )}

            {finishBook.isError && (
                <p className="max-w-[30rem] text-pretty text-center text-sm font-semibold tracking-wide text-red-500">
                    There was an error while finishing this book
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
            <Button onClick={() => addToWantToRead.mutate({ bookId })}>
                <LuPlus className="icon mr-3" />
                <p>Add to your library</p>
            </Button>
        ),

        [BookStatus.WANT_TO_READ]: (
            <>
                <Button onClick={() => startReading.mutate({ bookId })}>
                    <LuBookOpen className="icon mr-3" />
                    <p>Start reading</p>
                </Button>

                <Button variant="glass" onClick={() => removeFromWantToRead.mutate({ bookId })}>
                    <LuX className="icon mr-3" />
                    <p>Remove from your library</p>
                </Button>
            </>
        ),

        [BookStatus.READING_NOW]: (
            <>
                <Button onClick={() => finishBook.mutate({ bookId })}>
                    <LuBookMarked className="icon mr-3" />
                    <p>Finish book</p>
                </Button>

                <Button variant="glass" onClick={() => stopReading.mutate({ bookId })}>
                    <LuX className="icon mr-3" />
                    <p>Stop reading</p>
                </Button>
            </>
        ),
    };

    return container(map[bookStatus.data]);
};

export default LibraryButton;
