import Welcome from "@/component/Welcome";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
    component: App,
    beforeLoad: ({ context }) => {
        // TEMPORARY DIAGNOSTICS.
        console.log(`[auth:welcome] isAuthenticated=${context.isAuthenticated}`);
        if (context.isAuthenticated) throw redirect({ to: `/reading` });
    },
});

function App() {
    return <Welcome />;
}
