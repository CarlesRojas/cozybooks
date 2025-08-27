import { getBookWithGoogleFallback } from "@/server/repo/book";
import { useQuery } from "@tanstack/react-query";

interface Props {
    bookId: string;
}

export const useBook = ({ bookId }: Props) => {
    return useQuery({
        queryKey: ["book", bookId],
        queryFn: () => getBookWithGoogleFallback({ data: bookId }),
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
    });
};
