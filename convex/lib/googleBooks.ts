// Google Books API helpers shared by the actions in `googleBooks.ts` and `books.ts`.
//
// The Books API is at v1 — there is no newer version — so "latest" here means using it
// the way it is currently documented: the OAuth token in the `Authorization` header
// rather than the deprecated `access_token` query parameter, and an explicit `country`
// on catalogue reads.

export const GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1";

// Google Books answers 503 when it can't geolocate the caller by IP, which is every
// request from a datacenter — so every request from a Convex action, where these calls
// now run (they used to go out from the app server on the developer's own machine).
// An explicit ISO 3166-1 alpha-2 `country` replaces that geolocation.
// Override per deployment with `npx convex env set GOOGLE_BOOKS_COUNTRY ES`.
export const googleBooksCountry = () => process.env.GOOGLE_BOOKS_COUNTRY ?? "US";

// Params every catalogue read (`/volumes`, `/volumes/{id}`, `/mylibrary/.../volumes`)
// needs. Spread this into the per-endpoint params.
//
// The API key is omitted rather than sent empty when it isn't configured: `volumes.list`
// and `volumes.get` serve anonymous callers (on a lower quota), whereas `key=` is a
// malformed key and gets rejected outright.
export const catalogueParams = () => {
    const key = process.env.GOOGLE_BOOKS_API_KEY;
    return { ...(key && { key }), country: googleBooksCountry() };
};

// Google caps `maxResults` at 40 and rejects anything larger with a 400.
export const MAX_RESULTS = 40;

export const clampMaxResults = (maxResults: number | undefined) => Math.min(Math.max(maxResults ?? 8, 1), MAX_RESULTS);

interface RequestOptions {
    path: string;
    params?: Record<string, string>;
    method?: "GET" | "POST";
    // Required by every `mylibrary` endpoint (scope `.../auth/books`). The public
    // `/volumes` endpoints take the API key instead, so browsing the catalogue keeps
    // working when a user's Google token has expired.
    googleToken?: string;
}

// Google Books returns a genuine, well-formed request to 503 `backendFailed` ("Service
// temporarily unavailable") a good fraction of the time when called from a datacenter IP,
// which is every call from a Convex action. Measured from this deployment with the exact
// same URL that answers 200 from a residential IP: roughly one in three failed. Retrying
// with backoff is Google's own prescription for 5xx, and it's what makes search usable
// here — a single attempt is a coin flip.
//
// 429 is included because the anonymous/keyless quota is shared and also recovers.
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const RETRY_BACKOFF_MS = [250, 750, 2000];

// Single entry point for the Books API, so auth, retries, error reporting and response
// handling can't drift between call sites.
export const googleBooksRequest = async ({ path, params = {}, method = "GET", googleToken }: RequestOptions) => {
    const url = new URL(`${GOOGLE_BOOKS_URL}${path}`);
    url.search = new URLSearchParams(params).toString();

    for (let attempt = 0; ; attempt++) {
        const response = await fetch(url.toString(), {
            method,
            ...(googleToken && { headers: { Authorization: `Bearer ${googleToken}` } }),
        });

        if (response.ok) {
            // addVolume/removeVolume answer 204 with an empty body.
            const body = await response.text();
            return body ? JSON.parse(body) : {};
        }

        if (RETRYABLE_STATUS.has(response.status) && attempt < RETRY_BACKOFF_MS.length) {
            await new Promise((resolve) => setTimeout(resolve, RETRY_BACKOFF_MS[attempt]));
            continue;
        }

        // Google puts the actual reason in the body; a bare status code can't tell a geo
        // rejection from an expired token, so keep the body in the error. The params go in
        // too (minus the API key) because several distinct failures share one reason code —
        // `backendFailed`, for one, is also what a request missing `country` comes back as.
        const body = await response.text().catch(() => "");
        const safeParams = new URLSearchParams(url.search);
        safeParams.delete("key");
        throw new Error(
            `Google Books ${method} ${path}?${safeParams.toString()} failed with status ${response.status} after ${attempt + 1} attempt(s): ${body.slice(0, 300)}`,
        );
    }
};

// Google bookshelf ids (see `src/type/BookShelf.ts`). These three are the writable
// shelves `mylibrary.bookshelves.addVolume`/`removeVolume` accept.
export const BOOKSHELF = {
    TO_READ: 2,
    READING_NOW: 3,
    HAVE_READ: 4,
} as const;

const optionalString = (value: unknown) => (typeof value === "string" ? value : undefined);
const optionalNumber = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : undefined);

const optionalStringArray = (value: unknown) => {
    if (!Array.isArray(value)) return undefined;
    const strings = value.filter((item): item is string => typeof item === "string");
    return strings.length > 0 ? strings : undefined;
};

const optionalDateMs = (value: unknown) => {
    if (typeof value !== "string" || !value) return undefined;
    const ms = Date.parse(value);
    return Number.isNaN(ms) ? undefined : ms;
};

// Parses a Google Books volume into the `books` table shape. Returns null for
// volumes that don't have the minimum required fields (id + title).
export const parseGoogleVolume = (volume: any) => {
    const id = volume?.id;
    const info = volume?.volumeInfo ?? {};
    const images = info.imageLinks ?? {};

    if (typeof id !== "string" || typeof info.title !== "string") return null;

    return {
        googleId: id,

        title: info.title,
        authors: optionalStringArray(info.authors),
        publisher: optionalString(info.publisher),
        publishedDate: optionalDateMs(info.publishedDate),
        description: optionalString(info.description),
        pageCount: optionalNumber(info.pageCount),
        categories: optionalStringArray(info.categories),
        mainCategory: optionalString(info.mainCategory),
        averageRating: optionalNumber(info.averageRating),
        ratingsCount: optionalNumber(info.ratingsCount),
        language: optionalString(info.language),
        previewLink: optionalString(info.previewLink),

        smallThumbnail: optionalString(images.smallThumbnail),
        thumbnail: optionalString(images.thumbnail),
        small: optionalString(images.small),
        medium: optionalString(images.medium),
        large: optionalString(images.large),
        extraLarge: optionalString(images.extraLarge),
    };
};

export type ParsedGoogleVolume = NonNullable<ReturnType<typeof parseGoogleVolume>>;
