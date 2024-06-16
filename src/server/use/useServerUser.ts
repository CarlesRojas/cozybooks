"use server";

import { auth } from "@/auth";
import { getUserFromSession } from "@/server/action/user";

export const getServerUser = async () => {
    const session = await auth();
    return await getUserFromSession(session);
};
