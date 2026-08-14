// The books this user wrote themselves, newest first. Reactive, so creating or
// deleting one updates the Custom books page without a refetch.

import { fromWireBook } from "@/convex/map";
import type { Book } from "@/type/Book";
import { api } from "@convex/_generated/api";
import { useQuery } from "convex-helpers/react/cache";
import { useMemo } from "react";

export const useCustomBooks = (userId: string): { data: Array<Book> | undefined; isLoading: boolean } => {
    const books = useQuery(api.customBooks.list, { userId });
    const data = useMemo(() => books?.map(fromWireBook), [books]);

    return { data, isLoading: books === undefined };
};
