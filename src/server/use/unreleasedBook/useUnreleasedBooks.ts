import { getUnreleasedBooks } from "@/server/repo/unreleasedBook";
import { UnreleasedBook } from "@/type/UnreleasedBook";
import { useQuery } from "@tanstack/react-query";

const getUserUnreleasedBooks = async (userId: string): Promise<UnreleasedBook[]> => {
    return await getUnreleasedBooks({ data: userId });
};

export const useUnreleasedBooks = (userId: string) => {
    return useQuery({
        queryKey: ["unreleasedBooks"],
        queryFn: () => getUserUnreleasedBooks(userId),
    });
};
