import Welcome from "@/component/Welcome";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
    component: App,
    beforeLoad: ({ context }) => {
        if (context.user) throw redirect({ to: `/reading` as any });
    },
});

function App() {
    return <Welcome />;
}
