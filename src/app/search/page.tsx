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
        <main className={cn("relative mb-20 flex h-fit w-full flex-col gap-5 pb-6", isIOS && "mb-24")}>
            <section className="sticky top-0 z-40 h-fit w-full bg-neutral-50 pb-3 pt-6 dark:bg-neutral-950">
                <div className="mx-auto flex h-fit w-full max-w-screen-lg px-6">
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
                </div>
            </section>

            <div className="flex h-fit w-full flex-col gap-16">
                {searchedBooks.data && (
                    <section className="flex h-fit min-h-[30vh] w-full flex-col gap-7">
                        <div className="sticky top-[5rem] z-30 bg-neutral-50 pb-2 dark:bg-neutral-950">
                            <h2 className="h2 mx-auto max-w-screen-lg px-6">Results</h2>
                        </div>

                        <div className="mx-auto grid w-full max-w-screen-lg grid-cols-2 gap-5 px-6 sm:grid-cols-3 md:grid-cols-4">
                            {searchedBooks.data.items.map((book) => (
                                <BookCover key={book.id} book={book} isInteractive />
                            ))}
                        </div>
                    </section>
                )}

                <section className="flex h-fit min-h-[30vh] w-full flex-col gap-8">
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
