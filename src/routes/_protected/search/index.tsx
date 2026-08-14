import BookCarousel from "@/component/BookCarousel";
import { Input } from "@/component/ui/input";
import { PAGE_SIZE, SEARCH_DEBOUNCE_MS } from "@/const";
import { cn } from "@/lib/cn";
import { useSearchedBooks } from "@/convex/use/useSearchedBooks";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { isIOS } from "react-device-detect";
import { useDebounceCallback } from "usehooks-ts";
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

    // The field takes whatever the url carried in — the unreleased book list links
    // here with a book name — and owns the value from then on. Nothing mirrors the
    // url back into it: navigation commits inside a transition, well after the
    // debounce fired, so writing that value back deleted whatever had been typed in
    // the meantime.
    const [internalQuery, setInternalQuery] = useState(query);

    // Search as you type, and only then write to the url. The debounced callback
    // keeps its timer across renders — an effect-based debounce restarts whenever a
    // dependency identity changes, which kept pushing the search back for as long as
    // the page re-rendered. `replace` keeps every keystroke out of the history stack.
    const search = (value: string) => navigate({ to: "/search", search: { query: value }, replace: true });
    const debouncedSearch = useDebounceCallback(search, SEARCH_DEBOUNCE_MS);

    const onChange = (value: string) => {
        setInternalQuery(value);
        debouncedSearch(value);
    };

    // Clearing drops the pending call and searches right away.
    const searchNow = (value: string) => {
        debouncedSearch.cancel();
        setInternalQuery(value);
        search(value);
    };

    const searchedBooks = useSearchedBooks({ query, booksPerPage: PAGE_SIZE });

    const wantToRead = { userId: context.user!.id };

    // Everything on screen keys off the input rather than the url. Router navigation
    // runs inside a transition, so `query` lands a moment after the field changes —
    // driving the layout from one and the results from the other made clearing the
    // field re-center the page while the old results were still up.
    const isEmpty = internalQuery.length === 0;

    // The field has moved on from what was last searched. Books already on screen
    // stay — they are the closest thing to an answer until the new search runs, and
    // pulling them out from under the reader mid-word is worse than leaving them.
    // With nothing to keep, though, the section waits: an empty heading or covers
    // shimmering for a query still being typed are just noise. Either way the switch
    // to loading covers happens when the debounce fires, not before.
    const isSearchPending = internalQuery.trim() !== query.trim();
    const hasResults = (searchedBooks.data?.items.length ?? 0) > 0;

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
                    "relative sticky top-0 z-30 h-fit w-full pt-6 pb-3 lg:top-25",
                    !isEmpty && "bg-neutral-50 dark:bg-neutral-950",
                    isEmpty && "lg:relative lg:pt-0",
                )}
            >
                {/* The same wash that sits behind the welcome card, for the same reason:
                    an empty search page is one field on a blank screen. It belongs to the
                    bar rather than to the page, so it travels with it — on a desktop the
                    field starts centred and jumps to the top once there is something to
                    show, and a wash anchored to the page would have been left behind.
                    Painted over the bar's own opaque background, which is what hides the
                    results scrolling underneath, so it has to sit above it to be seen at
                    all. Flattened and softened once there are results: at full size what
                    spills below the bar washes over the first row of covers, and the
                    covers are what the page is about by then. Sized against the bar
                    rather than fixed, so it can never widen the page — `overflow-hidden`
                    would be the other way to contain it, and that would break the sticky
                    bar it lives in. */}
                <div
                    aria-hidden
                    className={cn(
                        "pointer-events-none absolute top-1/2 left-1/2 w-128 max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-linear-45 blur-[100px]",
                        isEmpty
                            ? "from-brand/40 to-brand-warm/40 dark:from-brand/25 dark:to-brand-warm/25 h-128"
                            : "from-brand/30 to-brand-warm/30 dark:from-brand/20 dark:to-brand-warm/20 h-40",
                    )}
                />

                {/* Searching is automatic, so Enter has nothing to submit — without this
                    the browser submits the form itself and reloads the page. */}
                <form
                    className="relative mx-auto flex h-fit w-full px-6 lg:max-w-xl"
                    autoComplete="off"
                    onSubmit={(event) => event.preventDefault()}
                >
                    {/* Declared a search field down to the last attribute. Android's
                        autofill offers its password bar to anything it can't rule out,
                        and `autocomplete="off"` alone does not rule it out — the type,
                        the name and the mode together do. The data attributes are what
                        the password managers themselves read. */}
                    <Input
                        placeholder="Search Books"
                        type="search"
                        name="search"
                        inputMode="search"
                        enterKeyHint="search"
                        autoFocus
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        data-1p-ignore
                        data-lpignore="true"
                        data-form-type="other"
                        value={internalQuery}
                        onChange={(event) => onChange(event.target.value)}
                        icon={
                            <FontAwesomeIcon
                                icon={faMagnifyingGlass}
                                className="icon stroke-2 text-neutral-500 transition-colors group-focus-within:text-neutral-950 group-focus-within:dark:text-neutral-50"
                            />
                        }
                        onClear={internalQuery.length > 0 ? () => searchNow("") : undefined}
                    />
                </form>
            </section>

            <div className="flex h-fit w-full flex-col gap-12">
                {!isEmpty && (hasResults || !isSearchPending) && (
                    <BookCarousel
                        title="Results"
                        books={searchedBooks.data?.items ?? []}
                        isLoading={searchedBooks.isLoading}
                        noBooksChildren={<p className="font-medium tracking-wide opacity-80">No results found</p>}
                        wantToRead={wantToRead}
                        centerIfShort
                        hasNextPage={searchedBooks.hasNextPage}
                        isFetchingNextPage={searchedBooks.isFetchingNextPage}
                        onLoadMore={searchedBooks.fetchNextPage}
                    />
                )}
            </div>
        </main>
    );
}
