"use client";

import BookList from "@/component/BookList";
import { Button } from "@/component/ui/button";
import { useUrlState } from "@/hook/useUrlState";
import { useBookShelf } from "@/server/use/useBookShelf";
import { BookShelfType } from "@/type/BookShelf";
import { Route } from "@/type/Route";
import { cn } from "@/util";
import Link from "next/link";
import { isIOS } from "react-device-detect";
import { LuBook } from "react-icons/lu";
import { z } from "zod";

const PAGE_SIZE = 8;

const Reading = () => {
    const readingPageState = useUrlState("reading-page", 1, z.coerce.number());
    const toReadPageState = useUrlState("to-read-page", 1, z.coerce.number());

    const readingBooks = useBookShelf({
        type: BookShelfType.READING_NOW,
        booksPerPage: PAGE_SIZE,
        offset: (readingPageState[0] - 1) * PAGE_SIZE,
    });

    const toReadBooks = useBookShelf({
        type: BookShelfType.TO_READ,
        booksPerPage: PAGE_SIZE,
        offset: (toReadPageState[0] - 1) * PAGE_SIZE,
    });

    return (
        <main
            suppressHydrationWarning
            className={cn("relative mb-20 flex h-fit min-h-[calc(100vh_-_5rem)] w-full flex-col gap-5 pb-6", isIOS && "mb-24")}
        >
            <div className="flex h-fit w-full grow flex-col gap-8">
                {readingBooks.data && (
                    <BookList
                        title="Reading"
                        books={readingBooks.data.items}
                        pageState={readingPageState}
                        totalItems={readingBooks.data.totalItems}
                        stickyClassName="top-0 pt-6"
                        pageSize={PAGE_SIZE}
                        noBooksChildren={
                            <div className="flex flex-col gap-2">
                                <p className="text-neutral-500 dark:text-neutral-400">
                                    This is a little empty. You can start by searching for books.
                                </p>
                                <Button variant="glass" asChild>
                                    <Link href={Route.SEARCH}>
                                        <LuBook className="icon mr-3" />
                                        <p>Search for books</p>
                                    </Link>
                                </Button>
                            </div>
                        }
                    />
                )}

                {toReadBooks.data && toReadBooks.data.items.length > 0 && (
                    <BookList
                        title="Want to read"
                        books={toReadBooks.data.items}
                        pageState={toReadPageState}
                        totalItems={toReadBooks.data.totalItems}
                        stickyClassName="top-0 pt-6"
                        pageSize={PAGE_SIZE}
                    />
                )}
            </div>

            <div className="sticky bottom-20 flex w-full flex-wrap justify-center gap-x-4">
                <Button className="text-sm opacity-40" variant="link" asChild>
                    <Link href={Route.PRIVACY_POLICY}>Privacy Policy</Link>
                </Button>
            </div>
        </main>
    );
};

export default Reading;
