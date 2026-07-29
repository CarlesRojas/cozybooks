import { useDailyGoogleSync } from "@/convex/use/useDailyGoogleSync";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected")({
    beforeLoad: ({ context }) => {
        if (!context.user) throw redirect({ to: `/` });
    },
    component: ProtectedLayout,
});

function ProtectedLayout() {
    const { user, googleToken } = Route.useRouteContext();
    useDailyGoogleSync({ userId: user?.id, googleToken });

    return <Outlet />;
}
