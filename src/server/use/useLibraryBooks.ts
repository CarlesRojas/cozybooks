import { getLibraryBooks } from "@/server/repo/library";
import type { VolumesResult } from "@/type/Book";
import { BookStatus } from "@/type/Book";
import { LibraryType } from "@/type/Library";
import type { QueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

interface Props {
    userId: string;
    type: LibraryType;
    maxResults?: number;
    startIndex?: number;
    queryClient: QueryClient;
}

const getLibrary = async ({ userId, type, maxResults, startIndex, queryClient }: Props): Promise<VolumesResult> => {
    const result = await getLibraryBooks({ data: { type, maxResults, startIndex, userId } });

    result.items.forEach((book) => {
        const rating = (book.rating && book.rating.length > 0 ? book.rating[0].rating : null) ?? null;
        queryClient.setQueryData(["rating", book.id], rating);

        const status =
            type === LibraryType.READING ? BookStatus.READING_NOW : LibraryType.TO_READ ? BookStatus.WANT_TO_READ : BookStatus.NONE;
        queryClient.setQueryData(["bookStatus", book.id], status);

        queryClient.setQueryData(["finishedDates", book.id], book.finished ?? null);
    });

    return result;
};

export const useLibraryBooks = ({ userId, type, maxResults, startIndex, queryClient }: Props) => {
    const key: Array<any> = ["libraryBooks", type];
    if (maxResults) key.push(maxResults);
    if (startIndex) key.push(startIndex);

    return useQuery({ queryKey: key, queryFn: () => getLibrary({ userId, type, maxResults, startIndex, queryClient }) });
};
