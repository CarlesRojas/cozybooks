import { TokenProps, withToken } from "@/server/action/withToken";
import { User } from "@/type/User";
import { GOOGLE_BOOKS_URL } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const getBookShelves = withToken(async ({ token }: TokenProps) => {
    console.log(token);
    const response = await axios.get(`${GOOGLE_BOOKS_URL}/mylibrary/bookshelves`, {
        headers: { Authorization: token },
    });

    console.log(response.data);
    return true;
});

export const useBookShelves = (user?: User) => {
    return useQuery({
        queryKey: ["bookShelves"],
        queryFn: () => getBookShelves({ token: user!.accessToken }),
        enabled: !!user,
    });
};
