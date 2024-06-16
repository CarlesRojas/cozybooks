import { useQuery } from "@tanstack/react-query";
import { Session } from "next-auth";
import { getSession } from "next-auth/react";

export const getUserFromSession = async (session: Session | null) => {
    if (!session?.user || !session.user.email) return null;

    const email = session.user.email;
    const name = session.user.name ?? email;
    const image = session.user.image ?? undefined;

    // TODO Get user from database and create a new user if not found
    // const user = await getUser(email, name, image);
    // return user;

    return { email, name, image };
};

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
