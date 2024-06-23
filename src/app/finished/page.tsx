"use client";

import BookList from "@/component/BookList";
import { Sort } from "@/component/SortMenu";
import { useUrlState } from "@/hook/useUrlState";
import { useLibraryBooks } from "@/server/use/useLibraryBooks";
import { Book } from "@/type/Book";
import { LibraryType } from "@/type/Library";
import { cn } from "@/util";
import { useMemo } from "react";
import { isIOS } from "react-device-detect";
import { LuLoader } from "react-icons/lu";
import { z } from "zod";

interface Group {
    key: string;
    books: Book[];
}

const Finished = () => {
    const [sort] = useUrlState("sort", Sort.BOOK, z.nativeEnum(Sort));
    const finishedBooks = useLibraryBooks({ type: LibraryType.FINISHED });

    const sortedBooks = useMemo(
        () =>
            finishedBooks.data?.items.sort((a, b) => {
                if (sort === Sort.BOOK) return a.title.localeCompare(b.title);
                if (sort === Sort.DATE) {
                    const aFinishedDate = a.finished?.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())[0].timestamp;
                    const bFinishedDate = b.finished?.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())[0].timestamp;
                    if (!aFinishedDate) return 1;
                    if (!bFinishedDate) return -1;
                    return bFinishedDate.getTime() - aFinishedDate.getTime();
                }
                if (sort === Sort.RATING) {
                    const aRating = a.rating && a.rating?.length > 0 ? a.rating[0].rating : null;
                    const bRating = b.rating && b.rating?.length > 0 ? b.rating[0].rating : null;
                    if (!aRating) return 1;
                    if (!bRating) return -1;
                    return bRating - aRating;
                }
                return 0;
            }),
        [sort, finishedBooks.data],
    );

    const groups: Group[] = useMemo(() => {
        if (!sortedBooks) return [];

        const result: Group[] = [];
        sortedBooks.forEach((book) => {
            const keyMap: Record<Sort, string> = {
                // Check if the first letter is alphabetic
                [Sort.BOOK]: book.title.length > 0 && /^[a-zA-Z]/.test(book.title[0]) ? book.title[0].toUpperCase() : "#",
                [Sort.DATE]:
                    book.finished
                        ?.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())[0]
                        .timestamp.toLocaleDateString("en", { year: "numeric" }) ?? "Unknown",
                [Sort.RATING]: (book.rating?.[0]?.rating ?? "Unrated").toString(),
            };

            const key = keyMap[sort];
            const keyIndex = result.findIndex((group) => group.key === key);

            if (keyIndex === -1) result.push({ key, books: [book] });
            else result[keyIndex].books.push(book);
        });

        return result;
    }, [sort, sortedBooks]);

    // TODO each title could be a menu with links
    // TODO add stats
    return (
        <main
            suppressHydrationWarning
            className={cn("relative mb-20 flex h-fit min-h-[calc(100vh_-_5rem)] w-full flex-col gap-5 pb-6", isIOS && "mb-24")}
        >
            {finishedBooks.isPending && (
                <div className="flex w-full grow items-center justify-center px-6 transition-all">
                    <LuLoader className="size-8 min-h-8 min-w-8 animate-spin stroke-[3] opacity-50 duration-2000" />
                </div>
            )}

            <div className="flex h-fit w-full grow flex-col gap-6 py-4">
                {groups.map(({ key, books }) => (
                    <BookList
                        key={key}
                        title={sort === Sort.RATING ? key : key}
                        books={books}
                        showPagination={false}
                        stickyClassName="top-0 pt-3"
                    />
                ))}
            </div>
        </main>
    );
};

export default Finished;
