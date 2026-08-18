import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected")({
    beforeLoad: ({ context }) => {
        // TEMPORARY DIAGNOSTICS.
        console.log(`[auth:protected] isAuthenticated=${context.isAuthenticated}`);
        if (!context.isAuthenticated) throw redirect({ to: `/` });
    },
    component: ProtectedLayout,
});

function ProtectedLayout() {
    return <Outlet />;
}
