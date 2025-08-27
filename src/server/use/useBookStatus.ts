import { isBookInLibrary } from "@/server/repo/library";
import { BookStatus } from "@/type/Book";
import { LibraryType } from "@/type/Library";
import { useQuery } from "@tanstack/react-query";

interface Props {
    bookId: string;
    userId: string;
}

export const getBookStatus = async ({ bookId, userId }: Props) => {
    if (await isBookInLibrary({ data: { bookId, userId, type: LibraryType.READING } })) return BookStatus.READING_NOW;
    if (await isBookInLibrary({ data: { bookId, userId, type: LibraryType.TO_READ } })) return BookStatus.WANT_TO_READ;

    return BookStatus.NONE;
};

export const useBookStatus = ({ bookId, userId }: Props) => {
    return useQuery({
        queryKey: ["bookStatus", bookId],
        queryFn: () => getBookStatus({ bookId, userId }),
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
    });
};
