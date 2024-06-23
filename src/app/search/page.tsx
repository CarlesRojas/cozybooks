"use client";

import BookList from "@/component/BookList";
import { Button } from "@/component/ui/button";
import { Input } from "@/component/ui/input";
import { PAGE_SIZE } from "@/const";
import { useUrlState } from "@/hook/useUrlState";
import { useBookShelf } from "@/server/use/useBookShelf";
import { useSearchedBooks } from "@/server/use/useSearchedBooks";
import { BookShelfType } from "@/type/BookShelf";
import { cn } from "@/util";
import { useEffect, useState } from "react";
import { isIOS } from "react-device-detect";
import { LuArrowRight, LuLoader, LuSearch } from "react-icons/lu";
import { z } from "zod";

const Search = () => {
    const searchPageState = useUrlState("search-page", 1, z.coerce.number());
    const recommendedPageState = useUrlState("recommended-page", 1, z.coerce.number());

    const [query, setQuery] = useUrlState("query", "", z.string());
    const [internalQuery, setInternalQuery] = useState(query);

    useEffect(() => setInternalQuery(query), [query]);

    const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setQuery(internalQuery);
    };

    const searchedBooks = useSearchedBooks({ query, booksPerPage: PAGE_SIZE, offset: (searchPageState[0] - 1) * PAGE_SIZE });
    const recommendedBooks = useBookShelf({
        type: BookShelfType.BOOKS_FOR_YOU,
        booksPerPage: PAGE_SIZE,
        offset: (recommendedPageState[0] - 1) * PAGE_SIZE,
    });

    return (
        <main suppressHydrationWarning className={cn("relative mb-20 flex h-fit w-full flex-col gap-5 pb-6", isIOS && "mb-24")}>
            <section className="sticky top-0 z-40 h-fit w-full bg-neutral-50 pb-3 pt-6 dark:bg-neutral-950">
                <form className="mx-auto flex h-fit w-full max-w-screen-lg px-6" onSubmit={onSubmit}>
                    <Input
                        placeholder="Search"
                        type="text"
                        autoComplete="off"
                        value={internalQuery}
                        onChange={(event) => setInternalQuery(event.target.value)}
                        icon={
                            <LuSearch className="icon stroke-2 text-neutral-500 transition-colors group-focus-within:text-neutral-950 group-focus-within:dark:text-neutral-50" />
                        }
                        onClear={internalQuery.length > 0 ? () => setQuery("") : undefined}
                    />

                    <Button size="icon" variant="input" className="ml-3" type="submit" disabled={internalQuery.length === 0}>
                        <LuArrowRight className="icon" />
                    </Button>
                </form>
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
                {searchedBooks.data && query.length > 0 && (
                    <BookList
                        title="Results"
                        books={searchedBooks.data.items}
                        showPagination
                        pageState={searchPageState}
                        totalItems={searchedBooks.data.totalItems}
                        stickyClassName="top-[5rem] pt-2"
                        pageSize={PAGE_SIZE}
                        isLoading={searchedBooks.isPlaceholderData}
                        noBooksChildren={<p className="font-medium tracking-wide opacity-80">No results found</p>}
                    />
                )}

                {recommendedBooks.data && recommendedBooks.data.items.length > 0 && (
                    <BookList
                        title="Recommended for you"
                        books={recommendedBooks.data.items}
                        showPagination
                        pageState={recommendedPageState}
                        totalItems={recommendedBooks.data.totalItems}
                        stickyClassName="top-[5rem] pt-2"
                        pageSize={PAGE_SIZE}
                        isLoading={recommendedBooks.isLoading || recommendedBooks.isPending}
                    />
                )}
            </div>
        </main>
    );
};

export default Search;
