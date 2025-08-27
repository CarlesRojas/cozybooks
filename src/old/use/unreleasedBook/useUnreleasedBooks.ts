import { getUnreleasedBooks } from "@/server/action/unreleasedBook";
import { getClientSide } from "@/server/use/useUser";
import { UnreleasedBook } from "@/type/UnreleasedBook";
import { useQuery } from "@tanstack/react-query";

const getUserUnreleasedBooks = async (): Promise<UnreleasedBook[]> => {
    const user = await getClientSide();
    if (!user) return [];

    return await getUnreleasedBooks(user.id);
};

export const useUnreleasedBooks = () => {
    return useQuery({
        queryKey: ["unreleasedBooks"],
        queryFn: () => getUserUnreleasedBooks(),
    });
};
