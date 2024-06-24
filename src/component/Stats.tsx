"use client";

import { Button } from "@/component/ui/button";
import { useUrlState } from "@/hook/useUrlState";
import { Book } from "@/type/Book";
import { cn } from "@/util";
import "@formatjs/intl-numberformat/locale-data/en";
import "@formatjs/intl-numberformat/polyfill";
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

const Stats = ({ books, stickyClassName }: Props) => {
    const [statType, setStatType] = useUrlState("stat", StatType.BOOKS, z.nativeEnum(StatType));

    let formatter = Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

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

    const tile = (title: string, value: number, subtitle?: string, className?: string) => (
        <div
            className={cn(
                "flex aspect-square flex-col items-center justify-around rounded-2xl bg-gradient-to-t p-3 sm:rounded-3xl",
                className,
            )}
        >
            <p className="text-center text-sm font-semibold leading-tight tracking-wide text-white opacity-80 sm:text-base md:text-lg">
                {title}
            </p>

            <p className="text-center text-4xl font-bold leading-tight tracking-wide text-white sm:text-6xl">{formatter.format(value)}</p>

            <p className="text-center text-sm font-semibold leading-tight tracking-wide text-white opacity-80 sm:text-base md:text-lg">
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

                    <div className="relative col-span-3 row-span-1 rounded-2xl bg-gradient-to-t from-purple-900/80 to-purple-400 p-3 sm:rounded-3xl">
                        {/* TODO show yearly books / pages */}
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
