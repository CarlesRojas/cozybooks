import { Button } from "@/component/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/component/ui/popover";
import { useDeleteUnreleasedBook } from "@/convex/use/unreleasedBook/useDeleteUnreleasedBook";
import type { UnreleasedBook } from "@/type/UnreleasedBook";
import { useNavigate } from "@tanstack/react-router";
import { faBook, faMagnifyingGlass, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

interface Props {
    unreleasedBook: UnreleasedBook;
    userId: string;
    isLoading?: boolean;
}

const UnreleasedBookItem = ({ unreleasedBook, userId, isLoading }: Props) => {
    const navigate = useNavigate();

    const { id, name } = unreleasedBook;

    const deleteUnreleasedBook = useDeleteUnreleasedBook();
    const [popoverOpen, setPopoverOpen] = useState(false);

    return (
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
                <Button variant="input" disabled={isLoading}>
                    <FontAwesomeIcon icon={faBook} className="icon mr-3" />
                    <p className="text-sm font-semibold tracking-wide">{name}</p>
                </Button>
            </PopoverTrigger>

            <PopoverContent className="flex w-fit items-center justify-center gap-4">
                <Button
                    variant="glass"
                    onClick={() => {
                        navigate({ to: "/search", search: { query: name } });
                        setPopoverOpen(false);
                    }}
                >
                    <FontAwesomeIcon icon={faMagnifyingGlass} className="icon mr-3 stroke-2" />
                    <p>Search</p>
                </Button>

                <Button
                    variant="destructive"
                    onClick={() => {
                        deleteUnreleasedBook.mutate({ unreleasedBookId: id, userId });
                        setPopoverOpen(false);
                    }}
                >
                    <FontAwesomeIcon icon={faTrash} className="icon mr-3 stroke-2" />
                    <p>Delete</p>
                </Button>
            </PopoverContent>
        </Popover>
    );
};

export default UnreleasedBookItem;
