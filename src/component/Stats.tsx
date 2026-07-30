import { Button } from "@/component/ui/button";
import { cn } from "@/lib/cn";
import type { Book } from "@/type/Book";
import { BookOpen, GalleryHorizontalEnd } from "lucide-react";
import { millify } from "millify";
import { useMemo, useState } from "react";

interface Props {
    books: Array<Book>;
    stickyClassName?: string;
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

const Stats = ({ books, stickyClassName }: Props) => {
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

    const tile = (value: number, name: string, colorClassName: string, className?: string) => (
        <div
            className={cn(
                "bg-neutral-150 dark:bg-neutral-850 flex flex-col gap-2 rounded-[22px] border border-neutral-500/25 p-4 sm:p-6 dark:border-neutral-500/40",
                className,
            )}
        >
            <div className="relative isolate h-fit w-fit">
                <span aria-hidden className={cn("absolute inset-0 text-3xl font-bold opacity-90 blur-lg sm:text-4xl", colorClassName)}>
                    {formatStat(value)}
                </span>
                <span className={cn("relative z-10 text-3xl font-bold sm:text-4xl", colorClassName)}>{formatStat(value)}</span>
            </div>

            <span className="text-xs font-medium text-neutral-500 sm:text-sm dark:text-neutral-400">{name}</span>
        </div>
    );

    return (
        <section className="flex h-fit w-full flex-col gap-4">
            <div className={cn("sticky top-0 z-30 bg-neutral-50 pb-2 dark:bg-neutral-950", stickyClassName)}>
                <h2 className="mx-auto max-w-screen-lg px-6 text-2xl leading-5 font-bold text-neutral-950/90 dark:text-neutral-50/90">
                    Stats
                </h2>
            </div>

            <div className="mx-auto flex w-full max-w-screen-lg flex-col gap-3 px-6 sm:gap-4">
                <div className="grid w-full grid-cols-3 gap-3 sm:gap-4">
                    {tile(
                        statType === StatType.BOOKS ? totalBooks : totalPages,
                        statType === StatType.BOOKS ? "Books Read" : "Pages Read",
                        "text-sky-500",
                    )}

                    {tile(
                        statType === StatType.BOOKS ? thisYearBooks : thisYearPages,
                        statType === StatType.BOOKS ? "Books This Year" : "Pages This Year",
                        "text-lime-500",
                    )}

                    {tile(
                        statType === StatType.BOOKS ? averageBooksPerYear : averagePagesPerYear,
                        statType === StatType.BOOKS ? "Books Per Year" : "Pages Per Year",
                        "text-amber-500",
                    )}

                    <div className="bg-neutral-150 dark:bg-neutral-850 relative col-span-3 overflow-x-auto overflow-y-hidden rounded-[22px] border border-neutral-500/25 p-6 dark:border-neutral-500/40">
                        <div className="flex h-40 w-fit flex-row gap-1.5">
                            <div className="items-left mr-8 flex h-full w-fit flex-col justify-end">
                                <p className="min-w-fit text-xl leading-tight font-bold text-nowrap text-neutral-950/90 dark:text-neutral-50/90">
                                    {statType === StatType.BOOKS ? "Books" : "Pages"}
                                </p>

                                <p className="min-w-fit text-xl leading-tight font-bold text-nowrap text-neutral-500 dark:text-neutral-400">
                                    Per Year
                                </p>
                            </div>

                            {sortedGroups.map((group) => (
                                <div key={group.year} className="flex h-full w-fit flex-col items-center gap-1">
                                    <p className="text-center text-xs leading-tight font-semibold tracking-wide text-neutral-500 dark:text-neutral-400">
                                        {formatStat(statType === StatType.BOOKS ? group.books : group.pages)}
                                    </p>

                                    <div className="relative flex w-2.5 grow items-end">
                                        <div
                                            className="w-full rounded-[3px] bg-purple-500"
                                            style={{
                                                height: `${(100 * (statType === StatType.BOOKS ? group.books : group.pages)) / (statType === StatType.BOOKS ? maxBooksPerYear : maxPagesPerYear)}%`,
                                            }}
                                        />
                                    </div>

                                    <p className="text-center text-xs leading-tight font-semibold tracking-wide text-neutral-500 dark:text-neutral-400">
                                        {group.year}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="relative flex flex-wrap gap-2">
                    <Button variant="glass" onClick={() => setStatType(statType === StatType.BOOKS ? StatType.PAGES : StatType.BOOKS)}>
                        {statType === StatType.BOOKS ? <GalleryHorizontalEnd className="icon mr-3" /> : <BookOpen className="icon mr-3" />}

                        <p className="text-lg font-bold tracking-wide">
                            {statType === StatType.BOOKS ? "View page stats" : "View book stats"}
                        </p>
                    </Button>
                </div>
            </div>
        </section>
    );
};

export default Stats;
