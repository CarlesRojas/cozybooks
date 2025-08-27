import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/book/bookId/")({ component: RouteComponent });

function RouteComponent() {
    return <div>Hello "/_protected/book/bookId/"!</div>;
}
