// Drops a cover blob that nothing points at any more — a replaced cover, or the
// cover of a deleted book. Convex holds the book but has no reach into the Blob
// store, so the cleanup is asked for from the client once the book row is gone.
//
// Leaving it out would not break anything visible, which is exactly why it is worth
// having: orphaned blobs are invisible, permanent and billed.

import { auth } from "@/lib/auth";
import { blobPathname, coverPrefix } from "@/lib/blob";
import { del } from "@vercel/blob";
import { createFileRoute } from "@tanstack/react-router";

const json = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

export const Route = createFileRoute("/api/blob/delete")({
    server: {
        handlers: {
            POST: async ({ request }) => {
                if (!process.env.BLOB_READ_WRITE_TOKEN) return json({ error: "BLOB_READ_WRITE_TOKEN is not set" }, 500);

                const session = await auth.api.getSession({ headers: request.headers });
                if (!session?.user) return json({ error: "Not signed in" }, 401);

                const { url } = (await request.json()) as { url?: string };
                if (!url) return json({ error: "No url given" }, 400);

                // The prefix is the permission: a blob under this user's prefix was
                // uploaded with a token this user was issued, so it is theirs to remove.
                // Anything else is somebody's cover and stays.
                const pathname = blobPathname(url);
                if (!pathname || !pathname.startsWith(coverPrefix(session.user.id))) return json({ error: "Not your blob" }, 403);

                await del(url);
                return json({ ok: true }, 200);
            },
        },
    },
});
