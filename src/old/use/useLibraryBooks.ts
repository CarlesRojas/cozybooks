import { getLibraryBooks } from "@/server/action/library";
import { BookStatus } from "@/server/use/useBookStatus";
import { getClientSide } from "@/server/use/useUser";
import { VolumesResult, VolumesResultSchema } from "@/type/Book";
import { LibraryType } from "@/type/Library";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Props {
    type: LibraryType;
    maxResults?: number;
    startIndex?: number;
}

interface PropsWithQueryClient extends Props {
    queryClient: ReturnType<typeof useQueryClient>;
}

const getLibrary = async ({ type, maxResults, startIndex, queryClient }: PropsWithQueryClient): Promise<VolumesResult> => {
    const user = await getClientSide();
    if (!user) return VolumesResultSchema.parse({ items: [], totalItems: 0 }) as VolumesResult;

    const result = await getLibraryBooks({ type, maxResults, startIndex, userId: user.id });

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

export const useLibraryBooks = ({ type, maxResults, startIndex }: Props) => {
    const queryClient = useQueryClient();

    const key: any[] = ["libraryBooks", type];
    if (maxResults) key.push(maxResults);
    if (startIndex) key.push(startIndex);

    return useQuery({
        queryKey: key,
        queryFn: () => getLibrary({ type, maxResults, startIndex, queryClient }),
    });
};
