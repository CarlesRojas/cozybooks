import { Button } from "@/component/ui/button";
import { cn } from "@/lib/cn";
import type { Book } from "@/type/Book";
import { BookOpen, GalleryHorizontalEnd } from "lucide-react";
import { millify } from "millify";
import { Fragment, useMemo, useState } from "react";

interface Props {
    books: Array<Book>;
}

enum StatType {
    BOOKS = "BOOKS",
    PAGES = "PAGES",
}

const AVERAGE_YEARS = 5;
const DEFAULT_PAGES_PER_BOOK = 250;

// Stat values stay at most four characters plus a decimal point ("15.5K" fits,
// "203.5K" doesn't) — drop the decimals instead of letting the number overflow.
const formatStat = (value: number) => {
    const formatted = millify(value, { precision: 1 });
    return formatted.replace(".", "").length > 4 ? formatted.replace(/\.\d+/, "") : formatted;
};

interface Group {
    year: number;
    books: number;
    pages: number;
}

const Stats = ({ books }: Props) => {
    const [statType, setStatType] = useState(StatType.BOOKS);

    const totalBooks = useMemo(() => books.reduce((acc, book) => acc + (book.finished?.length ?? 1), 0), [books]);
    const totalPages = useMemo(
        () => books.reduce((acc, book) => acc + (book.pageCount ?? DEFAULT_PAGES_PER_BOOK) * (book.finished?.length ?? 1), 0),
        [books],
    );

    const thisYearBooks = useMemo(
        () =>
            books.reduce(
                (acc, book) =>
                    acc + (book.finished?.filter((finished) => finished.timestamp.getFullYear() === new Date().getFullYear()).length ?? 0),
                0,
            ),
        [books],
    );
    const thisYearPages = useMemo(
        () =>
            books.reduce(
                (acc, book) =>
                    acc +
                    (book.pageCount ?? DEFAULT_PAGES_PER_BOOK) *
                        (book.finished?.filter((finished) => finished.timestamp.getFullYear() === new Date().getFullYear()).length ?? 0),
                0,
            ),
        [books],
    );

    const averageBooksPerYear = useMemo(
        () =>
            books.reduce(
                (acc, book) =>
                    acc +
                    (book.finished?.filter(
                        (finished) =>
                            finished.timestamp.getFullYear() >= new Date().getFullYear() - AVERAGE_YEARS &&
                            finished.timestamp.getFullYear() < new Date().getFullYear(),
                    ).length ?? 0),
                0,
            ) / AVERAGE_YEARS,
        [books],
    );
    const averagePagesPerYear = useMemo(
        () =>
            books.reduce(
                (acc, book) =>
                    acc +
                    (book.pageCount ?? DEFAULT_PAGES_PER_BOOK) *
                        (book.finished?.filter(
                            (finished) =>
                                finished.timestamp.getFullYear() >= new Date().getFullYear() - AVERAGE_YEARS &&
                                finished.timestamp.getFullYear() < new Date().getFullYear(),
                        ).length ?? 0),
                0,
            ) / AVERAGE_YEARS,
        [books],
    );

    const groups: Array<Group> = useMemo(() => {
        const result: Array<Group> = [];
        books.forEach((book) => {
            book.finished?.forEach((finished) => {
                const year = finished.timestamp.getFullYear();
                const yearIndex = result.findIndex((group) => group.year === year);

                if (yearIndex === -1) result.push({ year, books: 1, pages: book.pageCount ?? DEFAULT_PAGES_PER_BOOK });
                else
                    result[yearIndex] = {
                        ...result[yearIndex],
                        books: result[yearIndex].books + 1,
                        pages: result[yearIndex].pages + (book.pageCount ?? DEFAULT_PAGES_PER_BOOK),
                    };
            });
        });

        return result;
    }, [books]);

    const sortedGroups = useMemo(() => groups.sort((a, b) => b.year - a.year), [groups]);
    const maxBooksPerYear = useMemo(() => sortedGroups.reduce((acc, group) => Math.max(acc, group.books), 0), [sortedGroups]);
    const maxPagesPerYear = useMemo(() => sortedGroups.reduce((acc, group) => Math.max(acc, group.pages), 0), [sortedGroups]);

    const tile = (value: number, namePrimary: string, nameSecondary: string, colorClassName: string, className?: string) => (
        <div
            className={cn(
                // On desktop the row's height (set by the chart) stretches the tiles, and
                // aspect-square turns that height into a minimum width — content can
                // still widen a tile past square.
                "bg-neutral-150 dark:bg-neutral-850 flex flex-col gap-1 rounded-[22px] border border-neutral-500/25 p-4 sm:p-6 lg:aspect-square lg:w-auto lg:shrink-0 dark:border-neutral-500/40",
                className,
            )}
        >
            <div className="flex flex-col">
                <p className="text-base leading-tight font-bold text-neutral-950/90 sm:text-xl dark:text-neutral-50/90">{namePrimary}</p>

                <p className="text-base leading-tight font-bold text-neutral-500 sm:text-xl dark:text-neutral-400">{nameSecondary}</p>
            </div>

            <div className="relative isolate h-fit w-fit">
                <span aria-hidden className={cn("absolute inset-0 text-3xl font-bold opacity-90 blur-lg sm:text-4xl", colorClassName)}>
                    {formatStat(value)}
                </span>
                <span className={cn("relative z-10 text-3xl font-bold sm:text-4xl", colorClassName)}>{formatStat(value)}</span>
            </div>
        </div>
    );

    return (
        <section className="flex h-fit w-full flex-col gap-4">
            <div className="pb-2">
                <div className="flex w-full items-center justify-between gap-4 px-6">
                    <h2 className="text-2xl leading-5 font-bold text-neutral-950/90 dark:text-neutral-50/90">Stats</h2>

                    <Button
                        variant="glass"
                        size="small"
                        className="h-12 min-h-12"
                        onClick={() => setStatType(statType === StatType.BOOKS ? StatType.PAGES : StatType.BOOKS)}
                    >
                        {statType === StatType.BOOKS ? <GalleryHorizontalEnd className="icon mr-2" /> : <BookOpen className="icon mr-2" />}

                        <p className="text-sm font-bold tracking-wide">
                            {statType === StatType.BOOKS ? "View page stats" : "View book stats"}
                        </p>
                    </Button>
                </div>
            </div>

            <div className="flex w-full flex-col gap-3 px-6 sm:gap-4">
                <div className="grid w-full grid-cols-3 gap-3 sm:gap-4 lg:flex">
                    {tile(
                        statType === StatType.BOOKS ? totalBooks : totalPages,
                        statType === StatType.BOOKS ? "Books" : "Pages",
                        "Read",
                        "text-sky-500",
                    )}

                    {tile(
                        statType === StatType.BOOKS ? thisYearBooks : thisYearPages,
                        statType === StatType.BOOKS ? "Books" : "Pages",
                        "This Year",
                        "text-lime-500",
                    )}

                    {tile(
                        statType === StatType.BOOKS ? averageBooksPerYear : averagePagesPerYear,
                        statType === StatType.BOOKS ? "Books" : "Pages",
                        "Per Year",
                        "text-amber-500",
                    )}

                    <div className="bg-neutral-150 dark:bg-neutral-850 relative col-span-3 flex flex-col gap-1 rounded-[22px] border border-neutral-500/25 p-4 sm:p-6 lg:min-w-0 lg:flex-1 dark:border-neutral-500/40">
                        <p className="text-base leading-tight font-bold text-neutral-950/90 sm:text-xl dark:text-neutral-50/90">
                            {statType === StatType.BOOKS ? "Books" : "Pages"}{" "}
                            <span className="text-neutral-500 dark:text-neutral-400">Per Year</span>
                        </p>

                        <div className="max-h-32 [scrollbar-width:none] [scrollbar-color:rgba(115,115,115,0.4)_transparent] overflow-y-auto [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-3">
                                {sortedGroups.map((group) => {
                                    const value = statType === StatType.BOOKS ? group.books : group.pages;
                                    const max = statType === StatType.BOOKS ? maxBooksPerYear : maxPagesPerYear;

                                    return (
                                        <Fragment key={group.year}>
                                            <p className="text-sm font-semibold text-neutral-500 tabular-nums dark:text-neutral-400">
                                                {group.year}
                                            </p>

                                            <div className="h-2.5 overflow-hidden rounded-full bg-neutral-500/15">
                                                <div
                                                    className={cn(
                                                        "h-full rounded-full bg-purple-500",
                                                        group.year === new Date().getFullYear() && "opacity-45",
                                                    )}
                                                    style={{ width: `${Math.max(3, (100 * value) / max)}%` }}
                                                />
                                            </div>

                                            <p className="min-w-10 text-right text-sm font-bold text-neutral-950/90 tabular-nums dark:text-neutral-50/90">
                                                {formatStat(value)}
                                            </p>
                                        </Fragment>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Stats;
