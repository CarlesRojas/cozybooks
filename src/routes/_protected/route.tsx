import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected")({
    beforeLoad: ({ context }) => {
        if (!context.user) throw redirect({ to: `/` });
    },
    component: ProtectedLayout,
});

function ProtectedLayout() {
    return <Outlet />;
}
