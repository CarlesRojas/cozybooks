import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/finished/")({ component: RouteComponent });

function RouteComponent() {
    return <div>Hello "/_protected/finished/"!</div>;
}
