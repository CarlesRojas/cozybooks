import BookCarousel from "@/component/BookCarousel";
import { DEFAULT_REPEATS, DEFAULT_SORT, Sort } from "@/component/SortMenu";
import Star from "@/component/Star";
import Stats from "@/component/Stats";
import { REPEATS_STORAGE_KEY, SORT_STORAGE_KEY } from "@/const";
import { cn } from "@/lib/cn";
import { useLibraryBooks } from "@/convex/use/useLibraryBooks";
import type { Book } from "@/type/Book";
import { LibraryType } from "@/type/Library";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef } from "react";
import { isIOS } from "react-device-detect";

export const Route = createFileRoute("/_protected/finished/")({
    component: RouteComponent,
});

interface Group {
    key: string;
    books: Array<Book>;
}

// Read straight from storage rather than through a hook: the value is needed on the
// first effect pass, and a storage hook still holds its initial value that early
// under SSR, which restored the defaults instead of the last view used. Anything
// unparseable or unrecognised counts as absent, so the schema default applies.
const readStored = <T,>(key: string, isValid: (value: unknown) => value is T): T | null => {
    try {
        const raw = window.localStorage.getItem(key);
        if (raw === null) return null;

        const value: unknown = JSON.parse(raw);
        return isValid(value) ? value : null;
    } catch {
        return null;
    }
};

const write = (key: string, value: unknown) => {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Private mode and full quotas are not worth failing a render over.
    }
};

const isSort = (value: unknown): value is Sort => Object.values(Sort).includes(value as Sort);
const isBoolean = (value: unknown): value is boolean => typeof value === "boolean";

function RouteComponent() {
    const context = Route.useRouteContext();
    const { sort: urlSort, repeats: urlRepeats } = Route.useSearch();
    const navigate = useNavigate();

    // url, then storage, then the default. The url decides what is rendered — it is
    // what the sort menu writes and what a shared link carries — and storage only
    // fills in what it left out, which is why the options carry no schema default:
    // an absent param has to stay distinguishable from a chosen one.
    const sort = urlSort ?? DEFAULT_SORT;
    const repeats = urlRepeats ?? DEFAULT_REPEATS;
    const hasRestored = useRef(false);

    useEffect(() => {
        if (!hasRestored.current) {
            hasRestored.current = true;

            const storedSort = urlSort === undefined ? readStored(SORT_STORAGE_KEY, isSort) : null;
            const storedRepeats = urlRepeats === undefined ? readStored(REPEATS_STORAGE_KEY, isBoolean) : null;

            if (storedSort !== null || storedRepeats !== null) {
                // Storing is skipped this pass: the url is about to change, and this
                // effect runs again with the restored values.
                navigate({
                    to: "/finished",
                    search: { sort: storedSort ?? urlSort, repeats: storedRepeats ?? urlRepeats },
                    replace: true,
                });
                return;
            }
        }

        write(SORT_STORAGE_KEY, sort);
        write(REPEATS_STORAGE_KEY, repeats);
    }, [urlSort, urlRepeats, sort, repeats, navigate]);

    const finishedBooks = useLibraryBooks({ userId: context.user!.id, type: LibraryType.FINISHED });

    const sortedBooks = useMemo(
        () =>
            finishedBooks.data?.items.sort((a, b) => {
                if (sort === Sort.BOOK) return a.title.localeCompare(b.title);
                else if (sort === Sort.DATE) {
                    const aFinishedDate = a.finished?.sort((newA, newB) => newA.timestamp.getTime() - newB.timestamp.getTime())[0]
                        .timestamp;
                    const bFinishedDate = b.finished?.sort((newA, newB) => newA.timestamp.getTime() - newB.timestamp.getTime())[0]
                        .timestamp;
                    if (!aFinishedDate) return 1;
                    if (!bFinishedDate) return -1;
                    return bFinishedDate.getTime() - aFinishedDate.getTime();
                } else {
                    const aRating = a.rating && a.rating.length > 0 ? a.rating[0].rating : null;
                    const bRating = b.rating && b.rating.length > 0 ? b.rating[0].rating : null;
                    if (!aRating) return 1;
                    if (!bRating) return -1;
                    return bRating - aRating;
                }
            }),
        [sort, finishedBooks.data],
    );

    const groups: Array<Group> = useMemo(() => {
        if (!sortedBooks) return [];

        const result: Array<Group> = [];
        const addToGroup = (key: string, book: Book) => {
            const keyIndex = result.findIndex((group) => group.key === key);

            if (keyIndex === -1) result.push({ key, books: [book] });
            else if (!result[keyIndex].books.some((existing) => existing.id === book.id)) result[keyIndex].books.push(book);
        };

        sortedBooks.forEach((book) => {
            // With repeats on, a book shows in every year it was finished (once per
            // year); otherwise only in the year of its first read.
            if (sort === Sort.DATE && repeats && book.finished && book.finished.length > 0) {
                book.finished.forEach((finished) => addToGroup(finished.timestamp.toLocaleDateString("en", { year: "numeric" }), book));
                return;
            }

            const keyMap: Record<Sort, string> = {
                [Sort.BOOK]: book.title.length > 0 && /^[a-zA-Z]/.test(book.title[0]) ? book.title[0].toUpperCase() : "#",
                [Sort.DATE]:
                    book.finished
                        ?.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())[0]
                        .timestamp.toLocaleDateString("en", { year: "numeric" }) ?? "Unknown",
                [Sort.RATING]: (book.rating?.[0]?.rating ?? "Unrated").toString(),
            };

            addToGroup(keyMap[sort], book);
        });

        if (sort === Sort.DATE)
            result.sort((a, b) => (b.key === "Unknown" ? -1 : a.key === "Unknown" ? 1 : parseInt(b.key) - parseInt(a.key)));

        return result;
    }, [sort, sortedBooks, repeats]);

    const ratingTitle = (rating: number) => (
        <div className="relative flex w-fit items-center justify-center">
            {Array.from({ length: 10 }, (_, i) => (
                <Star key={i} left={i % 2 === 0} full={i < rating} rating={i + 1} disabled />
            ))}
        </div>
    );

    return (
        <main
            suppressHydrationWarning
            className={cn("relative mb-20 flex h-fit min-h-[calc(100vh_-_5rem)] w-full flex-col gap-5 pb-12 lg:pt-25", isIOS && "mb-24")}
        >
            <div className="flex h-fit w-full grow flex-col gap-6 py-4">
                {finishedBooks.data && <Stats books={finishedBooks.data.items} />}

                {groups.map(({ key, books }) => (
                    <BookCarousel
                        key={key}
                        title={sort === Sort.RATING ? (key === "Unrated" ? key : ratingTitle(parseInt(key))) : key}
                        books={books}
                    />
                ))}
            </div>
        </main>
    );
}
