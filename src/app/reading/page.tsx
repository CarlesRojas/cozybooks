"use client";

import BookList from "@/component/BookList";
import { Button } from "@/component/ui/button";
import { useLibraryBooks } from "@/server/use/useLibraryBooks";
import { LibraryType } from "@/type/Library";
import { Route } from "@/type/Route";
import { cn } from "@/util";
import Link from "next/link";
import { isIOS } from "react-device-detect";
import { LuBook, LuLoader } from "react-icons/lu";

const Reading = () => {
    const readingBooks = useLibraryBooks({ type: LibraryType.READING });
    const toReadBooks = useLibraryBooks({ type: LibraryType.TO_READ });

    return (
        <main
            suppressHydrationWarning
            className={cn("relative mb-20 flex h-fit min-h-[calc(100vh_-_5rem)] w-full flex-col gap-5 pb-6", isIOS && "mb-24")}
        >
            {readingBooks.isPending && (
                <div className="flex w-full grow items-center justify-center px-6 transition-all">
                    <LuLoader className="size-8 min-h-8 min-w-8 animate-spin stroke-[3] opacity-50 duration-2000" />
                </div>
            )}

            <div className="flex h-fit w-full grow flex-col gap-6 py-4">
                {readingBooks.data && (
                    <BookList
                        title="Reading"
                        books={readingBooks.data.items}
                        showPagination={false}
                        stickyClassName="top-0 pt-3"
                        noBooksChildren={
                            <div className="flex flex-col gap-4">
                                <p className="font-medium tracking-wide opacity-80">
                                    {toReadBooks.data && toReadBooks.data.items.length
                                        ? "This is a little empty. Select on any of the books below and click 'Start Reading'."
                                        : "This is a little empty. You can start by searching for books."}
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
                    <BookList title="Want to read" books={toReadBooks.data.items} showPagination={false} stickyClassName="top-0 pt-3" />
                )}
            </div>

            <div className="mt-16 flex w-full flex-wrap justify-center gap-x-4">
                <Button className="text-sm opacity-40" variant="link" asChild>
                    <Link href={Route.PRIVACY_POLICY}>Privacy Policy</Link>
                </Button>
            </div>
        </main>
    );
};

export default Reading;
