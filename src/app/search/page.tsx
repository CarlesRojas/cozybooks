"use client";

import BookCover from "@/component/BookCover";
import Pagination from "@/component/Pagination";
import { Input } from "@/component/ui/input";
import { useUrlState } from "@/hook/useUrlState";
import { useSearchedBooks } from "@/server/use/useSearchedBooks";
import { cn } from "@/util";
import { useState } from "react";
import { isIOS } from "react-device-detect";
import { LuLoader, LuSearch } from "react-icons/lu";
import { useDebouncedCallback } from "use-debounce";
import { z } from "zod";

const PAGE_SIZE = 8;

const Search = () => {
    const [page, setPage] = useUrlState("page", 1, z.coerce.number());

    const [query, setQuery] = useUrlState("query", "", z.string());
    const [internalQuery, setInternalQuery] = useState(query);
    const setQueryDebounced = useDebouncedCallback((value) => {
        setQuery(value, true, [{ key: "page", value: "1" }]);
    }, 400);

    const searchedBooks = useSearchedBooks({ query, booksPerPage: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });

    const numberOfPages = Math.ceil((searchedBooks.data?.totalItems || 1) / PAGE_SIZE);
    const currentPage = Math.max(Math.min(page, numberOfPages), 1);

    return (
        <main className={cn("relative mb-20 flex h-fit w-full flex-col gap-5 pb-6", isIOS && "mb-24")}>
            <section className="sticky top-0 z-40 h-fit w-full bg-neutral-50 pb-3 pt-6 dark:bg-neutral-950">
                <div className="mx-auto flex h-fit w-full max-w-screen-lg px-6">
                    <Input
                        placeholder="Search"
                        type="text"
                        autoComplete="off"
                        autoFocus
                        value={internalQuery}
                        onChange={(event) => {
                            setInternalQuery(event.target.value);
                            setQueryDebounced(event.target.value);
                        }}
                        icon={
                            <LuSearch className="icon stroke-2 text-neutral-500 transition-colors group-focus-within:text-neutral-950 group-focus-within:dark:text-neutral-50" />
                        }
                        onClear={
                            internalQuery.length > 0
                                ? () => {
                                      setInternalQuery("");
                                      setQueryDebounced("");
                                  }
                                : undefined
                        }
                    />
                </div>
            </section>

            <div
                className={cn(
                    "-mt-14 flex h-10 max-h-10 w-full items-center justify-center px-6 pb-2 transition-all",
                    searchedBooks.isPlaceholderData && "-mt-0",
                )}
            >
                <LuLoader className="size-8 min-h-8 min-w-8 animate-spin stroke-[3] opacity-50 duration-2000" />
            </div>

            <div className="flex h-fit w-full flex-col gap-12">
                {searchedBooks.data && searchedBooks.data.items.length > 0 && (
                    <section className="flex h-fit w-full flex-col gap-6">
                        <div className="sticky top-[5rem] z-30 bg-neutral-50 pb-2 dark:bg-neutral-950">
                            <h2 className="h2 mx-auto max-w-screen-lg px-6">Results</h2>
                        </div>

                        <div className="mx-auto grid w-full max-w-screen-lg grid-cols-2 gap-5 px-6 sm:grid-cols-3 md:grid-cols-4">
                            {searchedBooks.data.items.map((book) => (
                                <BookCover key={book.id} book={book} isInteractive />
                            ))}
                        </div>

                        <div className="mx-auto w-full max-w-screen-lg px-6">
                            <Pagination
                                numberOfPages={numberOfPages}
                                currentPage={currentPage - 1}
                                onPageChange={(page) => setPage(page + 1)}
                            />
                        </div>
                    </section>
                )}

                <section className="flex h-fit w-full flex-col gap-8">
                    <div className="sticky top-[5rem] z-30 bg-neutral-50 pb-2 dark:bg-neutral-950">
                        <h2 className="h2 mx-auto max-w-screen-lg px-6">Recommended for you</h2>
                    </div>

                    <div className="mx-auto grid w-full max-w-screen-lg grid-cols-2 gap-5 px-6 sm:grid-cols-3 md:grid-cols-4"></div>
                </section>
            </div>
        </main>
    );
};

export default Search;
