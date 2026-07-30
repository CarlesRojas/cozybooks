import BookCarousel from "@/component/BookCarousel";
import { Button } from "@/component/ui/button";
import { Input } from "@/component/ui/input";
import { PAGE_SIZE } from "@/const";
import { cn } from "@/lib/cn";
import { useSearchedBooks } from "@/convex/use/useSearchedBooks";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Loader, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { isIOS } from "react-device-detect";
import { z } from "zod";

const searchSearchParamsSchema = z.object({
    query: z.string().default(""),
});

export const Route = createFileRoute("/_protected/search/")({
    component: RouteComponent,
    validateSearch: searchSearchParamsSchema,
});

function RouteComponent() {
    const { query } = Route.useSearch();
    const context = Route.useRouteContext();
    const navigate = useNavigate();

    const [internalQuery, setInternalQuery] = useState(query);
    useEffect(() => setInternalQuery(query), [query]);

    const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        navigate({ to: "/search", search: { query: internalQuery } });
    };

    const searchedBooks = useSearchedBooks({ query, booksPerPage: PAGE_SIZE });

    const wantToRead = { userId: context.user!.id };

    return (
        <main suppressHydrationWarning className={cn("relative mb-20 flex h-fit w-full flex-col gap-5 pb-12 lg:pt-25", isIOS && "mb-24")}>
            <section className="sticky top-0 z-30 h-fit w-full bg-neutral-50 pt-6 pb-3 lg:top-25 dark:bg-neutral-950">
                <form className="mx-auto flex h-fit w-full max-w-screen-lg px-6" onSubmit={onSubmit}>
                    <Input
                        placeholder="Search"
                        type="text"
                        autoFocus
                        autoComplete="off"
                        value={internalQuery}
                        onChange={(event) => setInternalQuery(event.target.value)}
                        icon={
                            <Search className="icon stroke-2 text-neutral-500 transition-colors group-focus-within:text-neutral-950 group-focus-within:dark:text-neutral-50" />
                        }
                        onClear={internalQuery.length > 0 ? () => navigate({ to: "/search", search: { query: "" } }) : undefined}
                    />

                    <Button size="icon" variant="input" className="ml-3" type="submit" disabled={internalQuery.length === 0}>
                        <ArrowRight className="icon" />
                    </Button>
                </form>
            </section>

            <div
                className={cn(
                    "-mt-14 flex h-10 max-h-10 w-full items-center justify-center px-6 pb-2 transition-all",
                    searchedBooks.isLoading && "-mt-0",
                )}
            >
                <Loader className="size-8 min-h-8 min-w-8 animate-spin stroke-[3] opacity-50 duration-2000" />
            </div>

            <div className="flex h-fit w-full flex-col gap-12">
                {query.length > 0 && (
                    <BookCarousel
                        title="Results"
                        books={searchedBooks.data?.items ?? []}
                        isLoading={searchedBooks.isLoading}
                        noBooksChildren={<p className="font-medium tracking-wide opacity-80">No results found</p>}
                        wantToRead={wantToRead}
                        hasNextPage={searchedBooks.hasNextPage}
                        isFetchingNextPage={searchedBooks.isFetchingNextPage}
                        onLoadMore={searchedBooks.fetchNextPage}
                    />
                )}
            </div>
        </main>
    );
}
