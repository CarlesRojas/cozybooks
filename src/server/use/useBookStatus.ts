import { isBookInLibrary } from "@/server/action/library";
import { getClientSide } from "@/server/use/useUser";
import { LibraryType } from "@/type/Library";
import { useQuery } from "@tanstack/react-query";

interface Props {
    bookId: string;
    userId?: number;
}

export enum BookStatus {
    NONE = "NONE",
    READING_NOW = "READING_NOW",
    WANT_TO_READ = "WANT_TO_READ",
}

export const getBookStatus = async ({ bookId }: Props) => {
    const user = await getClientSide();
    if (!user) return BookStatus.NONE;

    if (await isBookInLibrary({ bookId, userId: user.id, type: LibraryType.READING })) return BookStatus.READING_NOW;
    if (await isBookInLibrary({ bookId, userId: user.id, type: LibraryType.TO_READ })) return BookStatus.WANT_TO_READ;

    return BookStatus.NONE;
};

export const useBookStatus = ({ bookId }: Props) => {
    return useQuery({
        queryKey: ["bookStatus", bookId],
        queryFn: () => getBookStatus({ bookId }),
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
    });
};
