"use client";

import { Button } from "@/component/ui/button";
import { useUrlState } from "@/hook/useUrlState";
import { Book } from "@/type/Book";
import { cn } from "@/util";
import { z } from "zod";

interface Props {
    books: Book[];
    stickyClassName?: string;
}

enum StatType {
    BOOKS = "BOOKS",
    PAGES = "PAGES",
}

const Stats = ({ books, stickyClassName }: Props) => {
    const [statType, setStatType] = useUrlState("stat", StatType.BOOKS, z.nativeEnum(StatType));

    //  TODO calculate stats

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

            <p className="text-center text-4xl font-bold leading-tight tracking-wide text-white sm:text-6xl">{value}</p>

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
                    {tile("Read", 345, "books in total", "from-blue-900/70 to-blue-400/90")}
                    {tile("Finished", 13, "books this year", "from-red-900/70 to-red-400/90")}
                    {tile("Average", 18, "books per year", "from-green-900/70 to-green-400/90")}

                    <div className="relative col-span-3 row-span-1 rounded-2xl bg-gradient-to-t from-purple-900/70 to-purple-400/90 p-3 sm:rounded-3xl">
                        {/* TODO show yearly books / pages */}
                    </div>
                </div>

                <div className="relative flex flex-wrap gap-2">
                    <Button variant="glass" onClick={() => setStatType(statType === StatType.BOOKS ? StatType.PAGES : StatType.BOOKS)}>
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
