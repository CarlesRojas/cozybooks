// TEMPORARY DIAGNOSTICS — a route that sets three cookies the way better-auth's Google
// callback does: one expiring, two setting, on a 302. It answers what the auth route
// cannot answer on its own, because better-auth is in the way: does *this* server, on
// *this* machine, put three `Set-Cookie` headers on the wire, or only the last one?
//
//   curl -sD - -o /dev/null 'http://localhost:3000/api/cookietest?redirect=1' | grep -i set-cookie
//
// Three lines means the response path is sound and the cookies are being lost elsewhere.
// One line means it is the server, and better-auth never had a chance.

import { createFileRoute } from "@tanstack/react-router";

const withCookies = (status: number, location?: string) => {
    const headers = new Headers();
    headers.append("set-cookie", "probe-a=1; Path=/; Max-Age=60");
    headers.append("set-cookie", "probe-b=2; Path=/; Max-Age=60");
    headers.append("set-cookie", "probe-c=3; Path=/; Max-Age=60");
    if (location) headers.set("location", location);
    return new Response("probe", { status, headers });
};

export const Route = createFileRoute("/api/cookietest")({
    server: {
        handlers: {
            GET: ({ request }) => {
                const redirect = new URL(request.url).searchParams.get("redirect");
                return redirect ? withCookies(302, "/reading") : withCookies(200);
            },
        },
    },
});
