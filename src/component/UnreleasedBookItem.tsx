import { Button } from "@/component/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/component/ui/popover";
import { useDeleteUnreleasedBook } from "@/server/old/use/unreleasedBook/useDeleteUnreleasedBook";
import { Route } from "@/type/Route";
import { UnreleasedBook } from "@/type/UnreleasedBook";
import { LuBook, LuSearch, LuTrash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
    unreleasedBook: UnreleasedBook;
    isLoading?: boolean;
}

const UnreleasedBookItem = ({ unreleasedBook, isLoading }: Props) => {
    const { push } = useRouter();

    const { id, name } = unreleasedBook;

    const deleteUnreleasedBook = useDeleteUnreleasedBook();
    const [popoverOpen, setPopoverOpen] = useState(false);

    return (
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
                <Button variant="input" disabled={isLoading}>
                    <LuBook className="icon mr-3" />
                    <p className="text-sm font-semibold tracking-wide">{name}</p>
                </Button>
            </PopoverTrigger>

            <PopoverContent className="flex w-fit items-center justify-center gap-4">
                <Button
                    variant="glass"
                    onClick={() => {
                        push(`${Route.SEARCH}?query=${name}`);
                        setPopoverOpen(false);
                    }}
                >
                    <LuSearch className="icon mr-3 stroke-2" />
                    <p>Search</p>
                </Button>

                <Button
                    variant="destructive"
                    onClick={() => {
                        deleteUnreleasedBook.mutate({ unreleasedBookId: id });
                        setPopoverOpen(false);
                    }}
                >
                    <LuTrash2 className="icon mr-3 stroke-2" />
                    <p>Delete</p>
                </Button>
            </PopoverContent>
        </Popover>
    );
};

export default UnreleasedBookItem;
