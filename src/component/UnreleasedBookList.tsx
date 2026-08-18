import { Button } from "@/component/ui/button";
import { Input } from "@/component/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/component/ui/popover";
import UnreleasedBookItem from "@/component/UnreleasedBookItem";
import { cn } from "@/lib/cn";
import { useAddUnreleasedBook } from "@/convex/use/unreleasedBook/useAddUnreleasedBook";
import type { UnreleasedBook } from "@/type/UnreleasedBook";
import { faBook, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

interface Props {
    stickyClassName?: string;
    unreleasedBooks: Array<UnreleasedBook>;
}

const UnreleasedBookList = ({ stickyClassName, unreleasedBooks }: Props) => {
    const addUnreleasedBook = useAddUnreleasedBook();

    const [popoverOpen, setPopoverOpen] = useState(false);
    const [newBookName, setNewBookName] = useState("");

    const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        addUnreleasedBook.mutate({ name: newBookName });
        setPopoverOpen(false);
    };

    return (
        <section className="flex h-fit w-full flex-col gap-4">
            <div className={cn("sticky top-0 z-30 bg-neutral-50 pb-2 dark:bg-neutral-950", stickyClassName)}>
                <h2 className="px-6 text-2xl leading-5 font-bold text-neutral-950/90 dark:text-neutral-50/90">Unreleased Books</h2>
            </div>

            {unreleasedBooks.length <= 0 && (
                <p className="w-full px-6 opacity-50">
                    {"Some books will not show on search results until they are released. You can add them here as a reminder."}
                </p>
            )}

            {unreleasedBooks.length > 0 && (
                <div className="flex w-full flex-wrap gap-3 px-6">
                    {unreleasedBooks.map((unreleasedBook) => (
                        <UnreleasedBookItem
                            key={unreleasedBook.id}
                            unreleasedBook={unreleasedBook}
                            isLoading={addUnreleasedBook.isPending}
                        />
                    ))}

                    <Popover
                        open={popoverOpen}
                        onOpenChange={(newOpen) => {
                            if (newOpen) setNewBookName("");
                            setPopoverOpen(newOpen);
                        }}
                    >
                        <PopoverTrigger asChild>
                            <Button variant="input" size="icon" disabled={addUnreleasedBook.isPending}>
                                <FontAwesomeIcon icon={faPlus} className="icon" />
                            </Button>
                        </PopoverTrigger>

                        <PopoverContent className="relative flex w-96">
                            <form className="flex h-fit w-full flex-col items-end justify-center gap-4" onSubmit={onSubmit}>
                                <Input
                                    type="text"
                                    autoComplete="off"
                                    value={newBookName}
                                    placeholder="Book name"
                                    onChange={(event) => setNewBookName(event.target.value)}
                                    onClear={newBookName.length > 0 ? () => setNewBookName("") : undefined}
                                    icon={
                                        <FontAwesomeIcon
                                            icon={faBook}
                                            className="icon stroke-2 text-neutral-500 transition-colors group-focus-within:text-neutral-950 group-focus-within:dark:text-neutral-50"
                                        />
                                    }
                                />

                                <Button type="submit">
                                    <FontAwesomeIcon icon={faPlus} className="icon mr-3" />
                                    <p>Add</p>
                                </Button>
                            </form>
                        </PopoverContent>
                    </Popover>
                </div>
            )}
        </section>
    );
};

export default UnreleasedBookList;
