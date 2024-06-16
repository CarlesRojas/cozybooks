"use client";

import { Input } from "@/component/ui/input";
import { useUrlState } from "@/hook/useUrlState";
import { useSearchedBooks } from "@/server/use/useSearchedBooks";
import { cn, getBiggestBookImage } from "@/util";
import Image from "next/image";
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

    // "http://books.google.com/books/content?id=zl13g5uRM4EC&printsec=frontcover&img=1&zoom=5&edge=curl&source=gbs_api"
    // https://books.google.com/books/publisher/content/images/frontcover/zl13g5uRM4EC?fife=w400-h600&source=gbs_api

    return (
        <main className={cn("max-w-screen-l relative mb-20 flex h-fit w-full flex-col gap-8 p-6", isIOS && "mb-24")}>
            <section className="flex h-fit w-full flex-col">
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

            {searchedBooks.data && (
                <section className="flex h-fit min-h-[30vh] w-full flex-col">
                    <h2 className="sticky top-6 text-3xl font-bold opacity-90">Results</h2>

                    <div className="grid w-full">
                        {searchedBooks.data.items.map((book) => {
                            const bookImage = book.volumeInfo.imageLinks && getBiggestBookImage(book.volumeInfo.imageLinks);
                            if (!bookImage) return null;

                            return (
                                <Image key={book.id} className="" width={256} height={256} src={bookImage} alt={book.volumeInfo.title} />
                            );
                        })}
                    </div>
                </section>
            )}

            <section className="flex h-fit min-h-[30vh] w-full flex-col">
                <h2 className="sticky top-6 text-3xl font-bold opacity-90">Recommended for you</h2>
            </section>
        </main>
    );
};

export default Search;
