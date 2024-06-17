"use client";

import BookList from "@/component/BookList";
import { Input } from "@/component/ui/input";
import { useUrlState } from "@/hook/useUrlState";
import { useBookShelves } from "@/server/use/useBookShelves";
import { useSearchedBooks } from "@/server/use/useSearchedBooks";
import { cn } from "@/util";
import { useEffect, useState } from "react";
import { isIOS } from "react-device-detect";
import { LuLoader, LuSearch } from "react-icons/lu";
import { useDebouncedCallback } from "use-debounce";
import { z } from "zod";

const PAGE_SIZE = 8;

const Search = () => {
    const pageState = useUrlState("page", 1, z.coerce.number());

    const [query, setQuery] = useUrlState("query", "", z.string());
    const [internalQuery, setInternalQuery] = useState(query);
    const setQueryDebounced = useDebouncedCallback((value) => {
        setQuery(value, true, [{ key: "page", value: "1" }]);
    }, 400);

    useEffect(() => setInternalQuery(query), [query]);

    const searchedBooks = useSearchedBooks({ query, booksPerPage: PAGE_SIZE, offset: (pageState[0] - 1) * PAGE_SIZE });
    const bookShelves = useBookShelves();
    console.log(bookShelves.data);

    return (
        <main suppressHydrationWarning className={cn("relative mb-20 flex h-fit w-full flex-col gap-5 pb-6", isIOS && "mb-24")}>
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
                    <BookList
                        title="Results"
                        books={searchedBooks.data.items}
                        pageState={pageState}
                        totalItems={searchedBooks.data.totalItems}
                        stickyClassName="top-[5rem]"
                        pageSize={PAGE_SIZE}
                    />
                )}

                <section className="flex h-fit w-full flex-col gap-8"></section>
            </div>
        </main>
    );
};

export default Search;
