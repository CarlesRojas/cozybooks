import BookCarousel from "@/component/BookCarousel";
import { Input } from "@/component/ui/input";
import { PAGE_SIZE, SEARCH_DEBOUNCE_MS } from "@/const";
import { cn } from "@/lib/cn";
import { useSearchedBooks } from "@/convex/use/useSearchedBooks";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
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

    // Search as you type: the input drives the url `query` param once typing pauses.
    // `replace` keeps every keystroke out of the history stack.
    useEffect(() => {
        if (internalQuery === query) return;

        const timeout = setTimeout(() => navigate({ to: "/search", search: { query: internalQuery }, replace: true }), SEARCH_DEBOUNCE_MS);

        return () => clearTimeout(timeout);
    }, [internalQuery, query, navigate]);

    // Submitting just skips the debounce — the search itself is already automatic.
    const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        navigate({ to: "/search", search: { query: internalQuery }, replace: true });
    };

    const searchedBooks = useSearchedBooks({ query, booksPerPage: PAGE_SIZE });

    const wantToRead = { userId: context.user!.id };

    // Nothing typed yet: on desktop there are no results to make room for, so the
    // field sits in the middle of the viewport instead of pinned under the
    // navigation. Equal top and bottom padding is what centers it there.
    const isEmpty = internalQuery.length === 0;

    return (
        <main
            suppressHydrationWarning
            className={cn(
                "relative mb-20 flex h-fit w-full flex-col gap-5 pb-12 lg:pt-25",
                isIOS && "mb-24",
                isEmpty && "lg:min-h-dvh lg:justify-center lg:pb-25",
            )}
        >
            <section
                className={cn(
                    "sticky top-0 z-30 h-fit w-full bg-neutral-50 pt-6 pb-3 lg:top-25 dark:bg-neutral-950",
                    isEmpty && "lg:static lg:pt-0",
                )}
            >
                <form className="mx-auto flex h-fit w-full px-6 lg:max-w-xl" onSubmit={onSubmit}>
                    <Input
                        placeholder="Search Books"
                        type="text"
                        autoFocus
                        autoComplete="off"
                        value={internalQuery}
                        onChange={(event) => setInternalQuery(event.target.value)}
                        icon={
                            <Search className="icon stroke-2 text-neutral-500 transition-colors group-focus-within:text-neutral-950 group-focus-within:dark:text-neutral-50" />
                        }
                        onClear={internalQuery.length > 0 ? () => setInternalQuery("") : undefined}
                    />
                </form>
            </section>

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
