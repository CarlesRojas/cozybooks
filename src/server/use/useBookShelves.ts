import { GOOGLE_BOOKS_URL } from "@/const";
import { User } from "@/type/User";
import { TokenProps, withToken } from "@/util";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const getBookShelves = withToken(async ({ token }: TokenProps) => {
    const response = await axios.get(`${GOOGLE_BOOKS_URL}/mylibrary/bookshelves?access_token=${token}`);

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
