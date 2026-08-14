// Cover images for user-created books, stored in Vercel Blob.
//
// Uploads go straight from the browser to the Blob store, never through this app's
// server: a serverless function body is capped at 4.5 MB and a phone camera photo
// clears that on its own. The server's only part is issuing a short-lived token for
// one specific path (`src/routes/api/blob/upload.ts`), which is also where the
// upload is authorised.

// Every cover a user uploads lives under their own prefix. That is what makes
// deletion checkable later: a request to delete a blob is honoured only if the blob
// sits under the requester's prefix, so the path is the permission.
export const coverPrefix = (userId: string) => `custom-book-cover/${userId}/`;

export const UPLOAD_URL = "/api/blob/upload";
export const DELETE_URL = "/api/blob/delete";

export const MAX_COVER_BYTES = 8 * 1024 * 1024;

export const ALLOWED_COVER_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

// The pathname a blob URL points at, or null if it isn't a URL at all. Blob URLs are
// `https://<store>.public.blob.vercel-storage.com/<pathname>`.
export const blobPathname = (url: string) => {
    try {
        return new URL(url).pathname.replace(/^\//, "");
    } catch {
        return null;
    }
};

// Keeps the extension — Vercel Blob derives the content type from it — and throws
// away everything else about the original name, which is the user's filesystem and
// none of the store's business.
const coverFileName = (file: File) => {
    const extension = file.name.includes(".") ? file.name.split(".").pop() : undefined;
    return extension ? `cover.${extension.toLowerCase()}` : "cover";
};

export const uploadCover = async (file: File, userId: string) => {
    // Imported here rather than at module scope so the Blob client, which is only
    // ever needed once somebody picks a file, stays out of the initial bundle.
    const { upload } = await import("@vercel/blob/client");

    const blob = await upload(`${coverPrefix(userId)}${coverFileName(file)}`, file, {
        access: "public",
        handleUploadUrl: UPLOAD_URL,
        contentType: file.type || undefined,
    });

    return blob.url;
};

// Best-effort: a cover that outlives its book is a stray file, not a broken app, so
// a failure here never fails the delete or the save that triggered it.
export const deleteCover = async (url: string) => {
    try {
        await fetch(DELETE_URL, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ url }),
        });
    } catch (error) {
        console.error("Deleting the cover blob failed", error);
    }
};
