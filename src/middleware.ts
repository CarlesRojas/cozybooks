import { auth } from "@/auth";
import { pathnameToRoute } from "@/hook/useRoute";
import { PRIVATE_ROUTES, Route } from "@/type/Route";
import { NextResponse } from "next/server";

const excludedPaths = [
    "api",
    "_next/static",
    "_next/image",
    "favicon.ico",
    "sw.js",
    "swe-worker",
    "workbox",
    ".json",
    ".png",
    ".webp",
    ".ico",
];

export default auth((request) => {
    const path = request.nextUrl.pathname;
    if (excludedPaths.some((excludedPath) => path.includes(excludedPath))) return NextResponse.next();

    const route = pathnameToRoute(path || "/");
    console.log(path, route, request.auth);

    if (!request.auth && PRIVATE_ROUTES.includes(route))
        return NextResponse.redirect(new URL(`${Route.AUTH_SIGN_IN}?callbackUrl=${encodeURIComponent(path)}`, request.url));

    if (!!request.auth && !PRIVATE_ROUTES.includes(route)) return NextResponse.redirect(new URL(Route.READING, request.url));
});
