"use client";

import { Button } from "@/component/ui/button";
import { useUrlState } from "@/hook/useUrlState";
import { Book } from "@/type/Book";
import { cn } from "@/util";
import millify from "millify";
import { useMemo } from "react";
import { LuBookOpen, LuGalleryHorizontalEnd } from "react-icons/lu";
import { z } from "zod";

interface Props {
    books: Book[];
    stickyClassName?: string;
}

enum StatType {
    BOOKS = "BOOKS",
    PAGES = "PAGES",
}

const AVERAGE_YEARS = 5;
const DEFAULT_PAGES_PER_BOOK = 250;

interface Group {
    year: number;
    books: number;
    pages: number;
}

const Stats = ({ books, stickyClassName }: Props) => {
    const [statType, setStatType] = useUrlState("stat", StatType.BOOKS, z.nativeEnum(StatType));

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

    const groups: Group[] = useMemo(() => {
        const result: Group[] = [];
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

    const tile = (title: string, value: number, subtitle?: string, className?: string) => (
        <div
            className={cn(
                "flex aspect-square flex-col items-center justify-around rounded-2xl bg-gradient-to-t p-3 sm:rounded-3xl sm:p-4",
                className,
            )}
        >
            <p className="text-center text-sm font-semibold leading-tight tracking-wide text-white opacity-80 sm:text-base md:text-lg">
                {title}
            </p>

            <p className="text-center text-4xl font-bold leading-tight tracking-wide text-white sm:text-6xl">{millify(value)}</p>

            <p className="text-balance text-center text-sm font-semibold leading-tight tracking-wide text-white opacity-80 sm:text-base md:text-lg">
                {subtitle}
            </p>
        </div>
    );

    return (
        <section className="flex h-fit w-full flex-col gap-4">
            <div className={cn("sticky top-0 z-30 bg-neutral-50 pb-2 dark:bg-neutral-950", stickyClassName)}>
                <h2 className="mx-auto max-w-screen-lg px-6 text-2xl font-bold leading-5 text-neutral-950/90 dark:text-neutral-50/90">
                    Stats
                </h2>
            </div>

            <div className="mx-auto flex w-full max-w-screen-lg flex-col gap-3 px-6 sm:gap-4">
                <div className="grid w-full max-w-screen-sm auto-rows-min grid-cols-3 grid-rows-2 gap-3 sm:gap-4">
                    {tile(
                        "Read",
                        statType === StatType.BOOKS ? totalBooks : totalPages,
                        statType === StatType.BOOKS ? "books in total" : "pages in total",
                        "from-blue-900/80 to-blue-400",
                    )}

                    {tile(
                        "Finished",
                        statType === StatType.BOOKS ? thisYearBooks : thisYearPages,
                        statType === StatType.BOOKS ? "books this year" : "pages this year",
                        "from-red-900/80 to-red-400",
                    )}

                    {tile(
                        "Average",
                        statType === StatType.BOOKS ? averageBooksPerYear : averagePagesPerYear,
                        statType === StatType.BOOKS ? "books per year" : "pages per year",
                        "from-green-900/80 to-green-400",
                    )}

                    <div className="relative col-span-3 row-span-1 overflow-x-auto overflow-y-hidden rounded-2xl bg-gradient-to-t from-purple-900/80 to-purple-400 p-3 sm:rounded-3xl sm:p-4">
                        <div className="flex h-full w-fit flex-row gap-1.5">
                            <div className="items-left mr-8 flex h-full w-fit flex-col justify-end">
                                <p className="min-w-fit text-nowrap text-xl font-semibold leading-tight text-white sm:text-2xl md:text-2xl">
                                    {statType === StatType.BOOKS ? "Books" : "Pages"}
                                </p>

                                <p className="min-w-fit text-nowrap text-xl font-semibold leading-tight text-white opacity-60 sm:text-2xl md:text-2xl">
                                    Per Year
                                </p>
                            </div>

                            {sortedGroups.map((group) => (
                                <div key={group.year} className="flex h-full w-fit flex-col items-center gap-1">
                                    <p className="text-center text-xs font-semibold leading-tight tracking-wide text-white opacity-80">
                                        {millify(statType === StatType.BOOKS ? group.books : group.pages)}
                                    </p>

                                    <div className="relative flex w-2.5 grow items-end">
                                        <div
                                            className="w-full rounded-[3px] bg-white"
                                            style={{
                                                height: `${(100 * (statType === StatType.BOOKS ? group.books : group.pages)) / (statType === StatType.BOOKS ? maxBooksPerYear : maxPagesPerYear)}%`,
                                            }}
                                        />
                                    </div>

                                    <p className="text-center text-xs font-semibold leading-tight tracking-wide text-white opacity-80">
                                        {group.year}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="relative flex flex-wrap gap-2">
                    <Button variant="glass" onClick={() => setStatType(statType === StatType.BOOKS ? StatType.PAGES : StatType.BOOKS)}>
                        {statType === StatType.BOOKS ? (
                            <LuGalleryHorizontalEnd className="icon mr-3" />
                        ) : (
                            <LuBookOpen className="icon mr-3" />
                        )}

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
