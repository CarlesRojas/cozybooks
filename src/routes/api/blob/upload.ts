// Issues the client tokens that let a browser upload a book cover straight into
// Vercel Blob. The upload itself never touches this server — only its permission
// does, which is the whole reason this route exists.

import { auth } from "@/lib/auth";
import { ALLOWED_COVER_TYPES, MAX_COVER_BYTES, coverPrefix } from "@/lib/blob";
import { handleUpload } from "@vercel/blob/client";
import type { HandleUploadBody } from "@vercel/blob/client";
import { createFileRoute } from "@tanstack/react-router";

const json = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

export const Route = createFileRoute("/api/blob/upload")({
    server: {
        handlers: {
            POST: async ({ request }) => {
                if (!process.env.BLOB_READ_WRITE_TOKEN)
                    return json(
                        {
                            error: "BLOB_READ_WRITE_TOKEN is not set — connect a Vercel Blob store to this project and pull its environment variables",
                        },
                        500,
                    );

                const session = await auth.api.getSession({ headers: request.headers });
                if (!session?.user) return json({ error: "Not signed in" }, 401);

                const body = (await request.json()) as HandleUploadBody;

                try {
                    const result = await handleUpload({
                        request,
                        body,
                        // eslint-disable-next-line @typescript-eslint/require-await -- the SDK's callback signature is async; this one has nothing to await.
                        onBeforeGenerateToken: async (pathname) => {
                            // The token is scoped to a path the client asked for, so the
                            // path is checked before it is granted: a signed-in user can
                            // only ever write under their own prefix. Without this, one
                            // account's token would overwrite another's covers.
                            if (!pathname.startsWith(coverPrefix(session.user.id))) throw new Error("Cover path is not yours to write");

                            return {
                                allowedContentTypes: ALLOWED_COVER_TYPES,
                                maximumSizeInBytes: MAX_COVER_BYTES,
                                // Two books called "cover.jpg" must not become one blob.
                                addRandomSuffix: true,
                            };
                        },
                    });

                    return json(result, 200);
                } catch (error) {
                    // The client shows this text, so it has to be readable: a rejected
                    // content type or an oversized file both land here.
                    return json({ error: error instanceof Error ? error.message : "Cover upload failed" }, 400);
                }
            },
        },
    },
});
