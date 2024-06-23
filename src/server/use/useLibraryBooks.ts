import { getLibraryBooks } from "@/server/action/library";
import { getClientSide } from "@/server/use/useUser";
import { VolumesResult, VolumesResultSchema } from "@/type/Book";
import { LibraryType } from "@/type/Library";
import { useQuery } from "@tanstack/react-query";

interface Props {
    type: LibraryType;
    maxResults?: number;
    startIndex?: number;
}

const getLibrary = async ({ type, maxResults, startIndex }: Props): Promise<VolumesResult> => {
    const user = await getClientSide();
    if (!user) return VolumesResultSchema.parse({ items: [], totalItems: 0 }) as VolumesResult;

    // TODO setquerydata for ratings and finished

    return await getLibraryBooks({ type, maxResults, startIndex, userId: user.id });
};

export const useLibraryBooks = ({ type, maxResults, startIndex }: Props) => {
    const key: any[] = ["libraryBooks", type];
    if (maxResults) key.push(maxResults);
    if (startIndex) key.push(startIndex);

    return useQuery({
        queryKey: key,
        queryFn: () => getLibrary({ type, maxResults, startIndex }),
    });
};
