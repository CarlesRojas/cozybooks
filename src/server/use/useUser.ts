import { getUserFromSession } from "@/server/action/user";
import { useQuery } from "@tanstack/react-query";
import { getSession } from "next-auth/react";

const getClientSide = async () => {
    const session = await getSession();
    return getUserFromSession(session);
};

export const useUser = () => {
    return useQuery({
        queryKey: ["user"],
        queryFn: () => getClientSide(),
    });
};
