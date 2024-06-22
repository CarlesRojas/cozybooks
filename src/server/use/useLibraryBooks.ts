import { getLibraryBooks } from "@/server/action/library";
import { getClientSide } from "@/server/use/useUser";
import { VolumesResult } from "@/type/Book";
import { LibraryType } from "@/type/Library";
import { useQuery } from "@tanstack/react-query";

interface Props {
    type: LibraryType;
    maxResults: number;
    startIndex: number;
}

const getLibrary = async ({ type, maxResults, startIndex }: Props): Promise<VolumesResult> => {
    const user = await getClientSide();
    if (!user) return { items: [], totalItems: 0 };

    return await getLibraryBooks({ type, maxResults, startIndex, userId: user.id });
};

export const useLibraryBooks = ({ type, maxResults, startIndex }: Props) => {
    return useQuery({
        queryKey: ["libraryBooks", type, maxResults, startIndex],
        queryFn: () => getLibrary({ type, maxResults, startIndex }),
    });
};
