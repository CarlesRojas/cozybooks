"use client";

import { Button } from "@/component/ui/button";
import { Combobox, ComboboxItem } from "@/component/ui/combobox";
import { Popover, PopoverContent, PopoverTrigger } from "@/component/ui/popover";
import { useFinishedDates } from "@/server/use/finished/useFinishedDates";
import { Book } from "@/type/Book";
import { LuCheck, LuTrash2 } from "react-icons/lu";

interface Props {
    book: Book;
}

const FinishedOn = ({ book }: Props) => {
    const finishedDates = useFinishedDates({ bookId: book.id });

    console.log(finishedDates.data);
    console.log(finishedDates.error?.message);
    if (!finishedDates.data) return null;

    const currentYear = new Date().getFullYear();
    const yearOptions: ComboboxItem[] = Array.from({ length: 150 }, (_, i) => ({
        id: (currentYear - i).toString(),
        label: (currentYear - i).toString(),
    }));
    const monthOptions: ComboboxItem[] = Array.from({ length: 12 }, (_, i) => ({
        id: (i + 1).toString(),
        label: (i + 1).toString(),
    }));

    return (
        <div className="flex w-full flex-col items-center justify-center gap-3">
            <p className="font-medium tracking-wide opacity-60">You finished this book on:</p>

            <div className="flex w-full flex-wrap items-center justify-center gap-3">
                {finishedDates.data.map((finishedDate) => (
                    <Popover key={finishedDate.id}>
                        <PopoverTrigger>
                            <Button variant="glass" size="small" asChild>
                                <p className="text-sm font-semibold tracking-wide">
                                    {finishedDate.timestamp.toLocaleDateString("en", {
                                        year: "numeric",
                                        month: "long",
                                    })}
                                </p>
                            </Button>
                        </PopoverTrigger>

                        <PopoverContent className="flex w-full flex-col gap-4">
                            {/* <div className="flex w-full flex-row gap-2">
                                <Button size="icon" variant="glass" onClick={() => console.log("prev")}>
                                    <LuChevronLeft className="icon" />
                                </Button>

                                <Input type="number" className="grow text-center" />

                                <Button size="icon" variant="glass" onClick={() => console.log("next")}>
                                    <LuChevronRight className="icon" />
                                </Button>
                            </div> */}

                            <Combobox
                                value={yearOptions.find(({ id }) => id === finishedDate.timestamp.getFullYear().toString()) ?? null}
                                setValue={(value) => console.log("newYear: ", value)}
                                options={yearOptions}
                                text={{ filter: "Filter...", select: "Select...", noResults: "No results" }}
                                // triggerClassName="h-fit p-0"
                                showDropdownIcon
                                showInput
                            />

                            <div className="flex flex-wrap gap-2">
                                <Button variant="glass" className="grow" onClick={() => console.log("delete")}>
                                    <LuTrash2 className="icon mr-3 stroke-2" />
                                    <p>Delete</p>
                                </Button>

                                <Button className="grow" onClick={() => console.log("update")}>
                                    <LuCheck className="icon mr-3" />
                                    <p>Update</p>
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                ))}
            </div>
        </div>
    );
};

export default FinishedOn;
