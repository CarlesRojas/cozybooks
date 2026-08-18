// The signed-in user, for the parts of the ui that show who that is.
//
// The avatar, name and email come off the better-auth session rather than a Convex read:
// they are what the session already carries, and the client keeps it live, so signing out
// empties this without a reload. Everything that is *about* the user's books goes through
// Convex, where the identity is verified rather than reported.

import { authClient } from "@/lib/auth/client";

export const useUser = () => {
    const session = authClient.useSession();

    return { user: session.data?.user ?? null, isLoading: session.isPending };
};
