import { auth } from "@/lib/auth";
import { createFileRoute } from "@tanstack/react-router";

// TEMPORARY DIAGNOSTICS — what better-auth's own endpoints answer, and with which
// cookies. The Google callback is the one that matters: it should answer 302 and set
// `better-auth.session_token`, and delete `better-auth.state`.
const handle = async (request: Request) => {
    const { pathname } = new URL(request.url);

    const sent = (request.headers.get("cookie") ?? "")
        .split(";")
        .map((part) => part.split("=")[0].trim())
        .filter((name) => name.startsWith("better-auth"));

    const response = await auth.handler(request);

    const setCookies = response.headers.getSetCookie();
    const described = setCookies.map((cookie) => {
        const [pair, ...attributes] = cookie.split(";").map((part) => part.trim());
        const [name, value] = pair.split("=");
        const maxAge = attributes.find((attribute) => attribute.toLowerCase().startsWith("max-age="));
        return `${name}(len=${value.length}${maxAge ? ` ${maxAge}` : ""})`;
    });

    console.log(
        `[auth:handler] ${request.method} ${pathname} → ${response.status}` +
            ` sentCookies=${sent.join(",") || "none"}` +
            ` setCookie=${described.join(" ") || "none"}` +
            ` location=${response.headers.get("location") ?? "none"}`,
    );

    return response;
};

export const Route = createFileRoute("/api/auth/$")({
    server: {
        handlers: {
            GET: ({ request }) => handle(request),
            POST: ({ request }) => handle(request),
        },
    },
});
