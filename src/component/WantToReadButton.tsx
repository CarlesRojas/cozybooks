import { Button } from "@/component/ui/button";
import { useAddToWantToRead } from "@/convex/use/status/useAddToWantToRead";
import { useRemoveFromWantToRead } from "@/convex/use/status/useRemoveFromWantToRead";
import { useBookStatus } from "@/convex/use/useBookStatus";
import { cn } from "@/lib/cn";
import type { Book } from "@/type/Book";
import { BookStatus } from "@/type/Book";
import { Bookmark, Loader } from "lucide-react";
import type { MouseEvent } from "react";

interface Props {
    book: Book;
    userId: string;
    googleToken: string;
}

const WantToReadButton = ({ book, userId, googleToken }: Props) => {
    const bookStatus = useBookStatus({ bookId: book.id, userId });

    const addToWantToRead = useAddToWantToRead();
    const removeFromWantToRead = useRemoveFromWantToRead();

    const isLoading = addToWantToRead.isPending || removeFromWantToRead.isPending;

    if (!bookStatus.data || bookStatus.data === BookStatus.READING_NOW) return null;
    const isAdded = bookStatus.data === BookStatus.WANT_TO_READ;

    const onClick = (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();

        if (isAdded) removeFromWantToRead.mutate({ book, userId, googleToken });
        else addToWantToRead.mutate({ book, userId, googleToken });
    };

    return (
        <Button
            variant="frost"
            size="iconSmall"
            className="absolute top-1.5 right-1.5 z-10 disabled:opacity-100"
            data-checked={!isLoading && isAdded}
            title={isAdded ? "Remove from want to read" : "Add to want to read"}
            disabled={isLoading}
            onClick={onClick}
        >
            {isLoading ? <Loader className="icon animate-spin" /> : <Bookmark className={cn("icon", isAdded && "fill-current")} />}
        </Button>
    );
};

export default WantToReadButton;
