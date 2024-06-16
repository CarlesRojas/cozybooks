"use client";

import BookCover from "@/component/BookCover";
import { Input } from "@/component/ui/input";
import { useUrlState } from "@/hook/useUrlState";
import { useSearchedBooks } from "@/server/use/useSearchedBooks";
import { cn } from "@/util";
import { useState } from "react";
import { isIOS } from "react-device-detect";
import { LuSearch } from "react-icons/lu";
import { useDebouncedCallback } from "use-debounce";
import { z } from "zod";

const Search = () => {
    const [query, setQuery] = useUrlState("query", "", z.string());
    const [internalQuery, setInternalQuery] = useState(query);
    const setQueryDebounced = useDebouncedCallback((value) => {
        setQuery(value);
    }, 300);

    const searchedBooks = useSearchedBooks({ query });

    return (
        <main className={cn("relative mx-auto mb-20 flex h-fit w-full max-w-screen-lg flex-col gap-5 px-6 pb-6", isIOS && "mb-24")}>
            <section className="sticky top-0 z-40 flex h-fit w-full flex-col bg-neutral-50 pb-3 pt-6 dark:bg-neutral-950">
                <Input
                    placeholder="Search"
                    type="text"
                    autoComplete="off"
                    value={internalQuery}
                    onChange={(event) => {
                        setInternalQuery(event.target.value);
                        setQueryDebounced(event.target.value);
                    }}
                    icon={
                        <LuSearch className="icon stroke-2 text-neutral-500 transition-colors group-focus-within:text-neutral-950 group-focus-within:dark:text-neutral-50" />
                    }
                />
            </section>

            <div className="flex h-fit w-full flex-col gap-16">
                {searchedBooks.data && (
                    <section className="flex h-fit min-h-[30vh] w-full flex-col gap-2">
                        <h2 className="h2 sticky top-[5rem] bg-neutral-50 pb-3 dark:bg-neutral-950">Results</h2>

                        <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                            {searchedBooks.data.items.map((book) => (
                                <BookCover key={book.id} book={book} />
                            ))}
                        </div>
                    </section>
                )}

                <section className="flex h-fit min-h-[30vh] w-full flex-col">
                    <h2 className="h2 sticky top-[5rem] bg-neutral-50 pb-3 dark:bg-neutral-950">Recommended for you</h2>
                </section>
            </div>
        </main>
    );
};

export default Search;
