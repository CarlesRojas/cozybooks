"use client";

import { Button } from "@/component/ui/button";
import { Combobox, ComboboxItem } from "@/component/ui/combobox";
import { Popover, PopoverContent, PopoverTrigger } from "@/component/ui/popover";
import { useDeleteFinishedDate } from "@/server/use/finished/useDeleteFinishedDate";
import { useFinishedDates } from "@/server/use/finished/useFinishedDates";
import { useUpdateFinishedDate } from "@/server/use/finished/useUpdateFinishedDate";
import { useRemoveBookFromFinished } from "@/server/use/status/useRemoveBookFromFinished";
import { Book } from "@/type/Book";
import { useState } from "react";
import { LuCheck, LuTrash2, LuX } from "react-icons/lu";

interface Props {
    book: Book;
}

const months: Record<number, string> = {
    0: "January",
    1: "February",
    2: "March",
    3: "April",
    4: "May",
    5: "June",
    6: "July",
    7: "August",
    8: "September",
    9: "October",
    10: "November",
    11: "December",
};

const FinishedOn = ({ book }: Props) => {
    const finishedDates = useFinishedDates({ bookId: book.id });
    const removeBookFromFinished = useRemoveBookFromFinished();

    const updateFinishedDate = useUpdateFinishedDate();
    const deleteFinishedDate = useDeleteFinishedDate();

    const [selectedYear, setSelectedYear] = useState<string>();
    const [selectedMonth, setSelectedMonth] = useState<string>();

    const [editPopoverOpen, setEditPopoverOpen] = useState<number>();
    const [deletePopoverOpen, setDeletePopoverOpen] = useState<number>();

    if (!finishedDates.data || finishedDates.data.length === 0) return null;

    const currentYear = new Date().getFullYear();
    const monthOptions: ComboboxItem[] = Array.from({ length: 12 }, (_, i) => ({
        id: i.toString(),
        label: months[i],
    }));
    const yearOptions: ComboboxItem[] = Array.from({ length: 150 }, (_, i) => ({
        id: (currentYear - i).toString(),
        label: (currentYear - i).toString(),
    }));

    return (
        <div className="flex w-full flex-col items-center justify-center gap-3">
            <p className="font-medium tracking-wide opacity-60">You finished this book on:</p>

            <div className="flex w-full flex-wrap items-center justify-center gap-3">
                {finishedDates.data.map((finishedDate) => (
                    <div key={finishedDate.id} className="relative flex rounded-xl bg-neutral-300/70 dark:bg-neutral-700/60">
                        <Popover
                            open={editPopoverOpen === finishedDate.id}
                            onOpenChange={(open) => {
                                open && setSelectedYear(finishedDate.timestamp.getFullYear().toString());
                                open && setSelectedMonth(finishedDate.timestamp.getMonth().toString());
                                setEditPopoverOpen(open ? finishedDate.id : undefined);
                            }}
                        >
                            <PopoverTrigger className="focus-scale h-full rounded-xl p-2 mouse:hover:bg-neutral-400/20 mouse:hover:dark:bg-neutral-500/30">
                                <p className="text-sm font-semibold tracking-wide">
                                    {finishedDate.timestamp.toLocaleDateString("en", {
                                        year: "numeric",
                                        month: "long",
                                    })}
                                </p>
                            </PopoverTrigger>

                            <PopoverContent className="flex w-96 flex-col gap-4">
                                <div className="grid w-full grid-cols-2 gap-4">
                                    <Combobox
                                        value={selectedMonth ? { id: selectedMonth, label: months[parseInt(selectedMonth)] } : null}
                                        setValue={(value) => setSelectedMonth(value ? value.id : undefined)}
                                        options={monthOptions}
                                        text={{ filter: "Filter...", select: "Select...", noResults: "No results" }}
                                        showDropdownIcon
                                        triggerClassName="w-full flex justify-center"
                                    />

                                    <Combobox
                                        value={selectedYear ? { id: selectedYear, label: selectedYear } : null}
                                        setValue={(value) => setSelectedYear(value ? value.id : undefined)}
                                        options={yearOptions}
                                        text={{ filter: "Filter...", select: "Select...", noResults: "No results" }}
                                        showDropdownIcon
                                        triggerClassName="w-full flex justify-center"
                                    />
                                </div>

                                <div className="flex w-full justify-center">
                                    <Button
                                        disabled={
                                            selectedYear === finishedDate.timestamp.getFullYear().toString() &&
                                            selectedMonth === finishedDate.timestamp.getMonth().toString()
                                        }
                                        onClick={() => {
                                            if (selectedYear === undefined || selectedMonth === undefined) return;
                                            const newTimestamp = new Date();
                                            newTimestamp.setFullYear(parseInt(selectedYear));
                                            newTimestamp.setMonth(parseInt(selectedMonth));
                                            updateFinishedDate.mutate({ id: finishedDate.id, bookId: book.id, timestamp: newTimestamp });
                                            setEditPopoverOpen(undefined);
                                        }}
                                    >
                                        <LuCheck className="icon mr-3" />
                                        <p>Update</p>
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>

                        <Popover
                            open={deletePopoverOpen === finishedDate.id}
                            onOpenChange={(open) => setDeletePopoverOpen(open ? finishedDate.id : undefined)}
                        >
                            <PopoverTrigger className="focus-scale h-full rounded-xl p-2 mouse:hover:bg-neutral-400/20 mouse:hover:dark:bg-neutral-500/30">
                                <LuX className="icon opacity-80" />
                            </PopoverTrigger>

                            <PopoverContent className="flex w-full flex-col items-center gap-4">
                                <p className="font-medium">Do you want to delete this entry?</p>

                                <Button
                                    variant="destructive"
                                    onClick={() => {
                                        deleteFinishedDate.mutate({ id: finishedDate.id, bookId: book.id });
                                        if (finishedDates.data!.length === 1) removeBookFromFinished.mutate({ book });
                                        setDeletePopoverOpen(undefined);
                                    }}
                                >
                                    <LuTrash2 className="icon mr-3 stroke-2" />
                                    <p>Delete</p>
                                </Button>
                            </PopoverContent>
                        </Popover>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FinishedOn;
