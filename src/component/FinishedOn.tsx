"use client";

import { Button } from "@/component/ui/button";
import { Combobox, ComboboxItem } from "@/component/ui/combobox";
import { Popover, PopoverContent, PopoverTrigger } from "@/component/ui/popover";
import { useCreateFinishedDate } from "@/server/use/finished/useCreateFinishedDate";
import { useDeleteFinishedDate } from "@/server/use/finished/useDeleteFinishedDate";
import { useFinishedDates } from "@/server/use/finished/useFinishedDates";
import { useUpdateFinishedDate } from "@/server/use/finished/useUpdateFinishedDate";
import { useRemoveBookFromFinished } from "@/server/use/status/useRemoveBookFromFinished";
import { Book } from "@/type/Book";
import { ReactElement, useState } from "react";
import { LuPlus, LuTrash2, LuUpload } from "react-icons/lu";

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
    const createFinishedDate = useCreateFinishedDate();

    const isPending =
        finishedDates.isPending ||
        finishedDates.isFetching ||
        finishedDates.isLoading ||
        updateFinishedDate.isPending ||
        createFinishedDate.isPending ||
        deleteFinishedDate.isPending;

    const [selectedYear, setSelectedYear] = useState<string>();
    const [selectedMonth, setSelectedMonth] = useState<string>();

    const [editPopoverOpen, setEditPopoverOpen] = useState<number>();
    const [newDatePopoverOpen, setNewDatePopoverOpen] = useState(false);

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

    const updateForm = ({
        date,
        onUpdate,
        submit,
        disableIfSame,
    }: {
        date: Date;
        onUpdate: (newTimestamp: Date) => void;
        submit: ReactElement;
        disableIfSame: boolean;
    }) => (
        <>
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

            <Button
                disabled={disableIfSame && selectedYear === date.getFullYear().toString() && selectedMonth === date.getMonth().toString()}
                onClick={() => {
                    if (selectedYear === undefined || selectedMonth === undefined) return;
                    const newTimestamp = new Date();
                    newTimestamp.setFullYear(parseInt(selectedYear));
                    newTimestamp.setMonth(parseInt(selectedMonth));
                    onUpdate(newTimestamp);
                }}
            >
                {submit}
            </Button>
        </>
    );

    return (
        <div className="flex w-full flex-col items-center justify-center gap-3">
            <p className="font-medium tracking-wide opacity-60">You finished this book on:</p>

            <div className="flex w-full flex-wrap items-center justify-center gap-3">
                {finishedDates.data.map((finishedDate) => (
                    <Popover
                        key={finishedDate.id}
                        open={editPopoverOpen === finishedDate.id}
                        onOpenChange={(open) => {
                            open && setSelectedYear(finishedDate.timestamp.getFullYear().toString());
                            open && setSelectedMonth(finishedDate.timestamp.getMonth().toString());
                            setEditPopoverOpen(open ? finishedDate.id : undefined);
                        }}
                    >
                        <PopoverTrigger asChild>
                            <Button variant="input" disabled={isPending}>
                                <p className="text-sm font-semibold tracking-wide">
                                    {finishedDate.timestamp.toLocaleDateString("en", {
                                        year: "numeric",
                                        month: "long",
                                    })}
                                </p>
                            </Button>
                        </PopoverTrigger>

                        <PopoverContent className="flex w-96 flex-col items-center justify-center gap-4">
                            {updateForm({
                                date: finishedDate.timestamp,
                                onUpdate: (newDate) => {
                                    updateFinishedDate.mutate({ id: finishedDate.id, bookId: book.id, timestamp: newDate });
                                    setEditPopoverOpen(undefined);
                                },
                                submit: (
                                    <>
                                        <LuUpload className="icon mr-3" />
                                        <p>Update</p>
                                    </>
                                ),
                                disableIfSame: true,
                            })}

                            <p className="text-sm font-semibold tracking-wide opacity-50">OR</p>

                            <Button
                                variant="destructive"
                                onClick={() => {
                                    deleteFinishedDate.mutate({ id: finishedDate.id, bookId: book.id });
                                    if (finishedDates.data!.length === 1) removeBookFromFinished.mutate({ book });
                                    setEditPopoverOpen(undefined);
                                }}
                            >
                                <LuTrash2 className="icon mr-3 stroke-2" />
                                <p>Delete</p>
                            </Button>
                        </PopoverContent>
                    </Popover>
                ))}

                <Popover
                    open={newDatePopoverOpen}
                    onOpenChange={(open) => {
                        const now = new Date();
                        open && setSelectedYear(now.getFullYear().toString());
                        open && setSelectedMonth(now.getMonth().toString());
                        setNewDatePopoverOpen(open);
                    }}
                >
                    <PopoverTrigger asChild>
                        <Button variant="input" size="icon" disabled={isPending}>
                            <LuPlus className="icon" />
                        </Button>
                    </PopoverTrigger>

                    <PopoverContent className="flex w-96 flex-col items-center justify-center gap-4">
                        {updateForm({
                            date: new Date(),
                            onUpdate: (newDate) => {
                                createFinishedDate.mutate({ bookId: book.id, timestamp: newDate });
                                setNewDatePopoverOpen(false);
                            },
                            submit: (
                                <>
                                    <LuPlus className="icon mr-3" />
                                    <p>Add entry</p>
                                </>
                            ),
                            disableIfSame: false,
                        })}
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
};

export default FinishedOn;
