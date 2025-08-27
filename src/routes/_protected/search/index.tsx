import BookList from "@/component/BookList";
import { Button } from "@/component/ui/button";
import { Input } from "@/component/ui/input";
import { PAGE_SIZE } from "@/const";
import { cn } from "@/lib/cn";
import { useBookShelf } from "@/server/use/useBookShelf";
import { useSearchedBooks } from "@/server/use/useSearchedBooks";
import { BookShelfType } from "@/type/BookShelf";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { ArrowRight, Loader, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { isIOS } from "react-device-detect";
import { z } from "zod";

const searchSearchParamsSchema = z.object({
    query: z.string().default(""),
    searchPage: z.coerce.number().default(1),
    recommendedPage: z.coerce.number().default(1),
});

export const Route = createFileRoute("/_protected/search/")({
    component: RouteComponent,
    validateSearch: zodValidator(searchSearchParamsSchema),
});

function RouteComponent() {
    const { query, searchPage, recommendedPage } = Route.useSearch();
    const context = Route.useRouteContext();
    const navigate = useNavigate();

    const [internalQuery, setInternalQuery] = useState(query);
    useEffect(() => setInternalQuery(query), [query]);

    const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        navigate({ to: "/search", search: { query: internalQuery, searchPage: 1, recommendedPage: 1 } });
    };

    const searchedBooks = useSearchedBooks({
        query,
        booksPerPage: PAGE_SIZE,
        offset: (searchPage - 1) * PAGE_SIZE,
        googleToken: context.googleToken!,
    });
    const recommendedBooks = useBookShelf({
        type: BookShelfType.BOOKS_FOR_YOU,
        booksPerPage: PAGE_SIZE,
        offset: (recommendedPage - 1) * PAGE_SIZE,
        googleToken: context.googleToken!,
    });

    return (
        <main suppressHydrationWarning className={cn("relative mb-20 flex h-fit w-full flex-col gap-5 pb-6", isIOS && "mb-24")}>
            <section className="sticky top-0 z-40 h-fit w-full bg-neutral-50 pt-6 pb-3 dark:bg-neutral-950">
                <form className="mx-auto flex h-fit w-full max-w-screen-lg px-6" onSubmit={onSubmit}>
                    <Input
                        placeholder="Search"
                        type="text"
                        autoComplete="off"
                        value={internalQuery}
                        onChange={(event) => setInternalQuery(event.target.value)}
                        icon={
                            <Search className="icon stroke-2 text-neutral-500 transition-colors group-focus-within:text-neutral-950 group-focus-within:dark:text-neutral-50" />
                        }
                        onClear={
                            internalQuery.length > 0
                                ? () => navigate({ to: "/search", search: { query: "", searchPage: 1, recommendedPage: 1 } })
                                : undefined
                        }
                    />

                    <Button size="icon" variant="input" className="ml-3" type="submit" disabled={internalQuery.length === 0}>
                        <ArrowRight className="icon" />
                    </Button>
                </form>
            </section>

            <div
                className={cn(
                    "-mt-14 flex h-10 max-h-10 w-full items-center justify-center px-6 pb-2 transition-all",
                    searchedBooks.isPlaceholderData && "-mt-0",
                )}
            >
                <Loader className="size-8 min-h-8 min-w-8 animate-spin stroke-[3] opacity-50 duration-2000" />
            </div>

            <div className="flex h-fit w-full flex-col gap-12">
                {searchedBooks.data && query.length > 0 && (
                    <BookList
                        title="Results"
                        books={searchedBooks.data.items}
                        showPagination
                        query={query}
                        searchPage={searchPage}
                        recommendedPage={recommendedPage}
                        totalItems={searchedBooks.data.totalItems}
                        stickyClassName="top-[5rem] pt-2"
                        pageSize={PAGE_SIZE}
                        isLoading={searchedBooks.isPlaceholderData}
                        type="search"
                        noBooksChildren={<p className="font-medium tracking-wide opacity-80">No results found</p>}
                    />
                )}

                {recommendedBooks.data && recommendedBooks.data.items.length > 0 && (
                    <BookList
                        title="Recommended for you"
                        books={recommendedBooks.data.items}
                        showPagination
                        query={query}
                        searchPage={searchPage}
                        recommendedPage={recommendedPage}
                        totalItems={recommendedBooks.data.totalItems}
                        stickyClassName="top-[5rem] pt-2"
                        pageSize={PAGE_SIZE}
                        isLoading={recommendedBooks.isPending}
                        type="recommendedBooks"
                    />
                )}
            </div>
        </main>
    );
}
