// Google Books API helpers shared by the actions in `googleBooks.ts` and `books.ts`.
//
// The Books API is at v1 — there is no newer version. Only the public catalogue
// endpoints (`/volumes`, `/volumes/{id}`) are used: the authenticated `mylibrary`
// surface is deprecated on Google's side and was dropped from the app, so no request
// here ever carries a user OAuth token.

export const GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1";

// Google Books answers 503 when it can't geolocate the caller by IP, which is every
// request from a datacenter — so every request from a Convex action, where these calls
// now run (they used to go out from the app server on the developer's own machine).
// An explicit ISO 3166-1 alpha-2 `country` replaces that geolocation.
// Override per deployment with `npx convex env set GOOGLE_BOOKS_COUNTRY ES`.
export const googleBooksCountry = () => process.env.GOOGLE_BOOKS_COUNTRY ?? "US";

// Params every catalogue read (`/volumes`, `/volumes/{id}`) needs. Spread this into
// the per-endpoint params.
//
// The API key is required: Google throttles keyless callers against a shared global
// quota that is routinely exhausted (every request then answers 429), so running
// without a key just fails slowly. Failing fast here turns a misconfigured deployment
// into one clear error instead of intermittent empty search results.
export const catalogueParams = () => {
    const key = process.env.GOOGLE_BOOKS_API_KEY;
    if (!key)
        throw new Error(
            "GOOGLE_BOOKS_API_KEY is not set on the Convex deployment — set it with `npx convex env set GOOGLE_BOOKS_API_KEY <key>` (add --prod for production)",
        );
    return { key, country: googleBooksCountry() };
};

// Google caps `maxResults` at 40 and rejects anything larger with a 400.
export const MAX_RESULTS = 40;

export const clampMaxResults = (maxResults: number | undefined) => Math.min(Math.max(maxResults ?? 8, 1), MAX_RESULTS);

interface RequestOptions {
    path: string;
    params?: Record<string, string>;
    method?: "GET" | "POST";
}

// Google Books returns a genuine, well-formed request to 503 `backendFailed` ("Service
// temporarily unavailable") a good fraction of the time when called from a datacenter IP,
// which is every call from a Convex action. Measured from this deployment with the exact
// same URL that answers 200 from a residential IP: roughly one in three failed. Retrying
// with backoff is Google's own prescription for 5xx, and it's what makes search usable
// here — a single attempt is a coin flip.
//
// 429 is included because the per-key daily quota also recovers.
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const RETRY_BACKOFF_MS = [250, 750, 2000];

// Single entry point for the Books API, so auth, retries, error reporting and response
// handling can't drift between call sites.
export const googleBooksRequest = async ({ path, params = {}, method = "GET" }: RequestOptions) => {
    const url = new URL(`${GOOGLE_BOOKS_URL}${path}`);
    url.search = new URLSearchParams(params).toString();

    for (let attempt = 0; ; attempt++) {
        const response = await fetch(url.toString(), { method });

        if (response.ok) {
            const body = await response.text();
            return body ? JSON.parse(body) : {};
        }

        if (RETRYABLE_STATUS.has(response.status) && attempt < RETRY_BACKOFF_MS.length) {
            await new Promise((resolve) => setTimeout(resolve, RETRY_BACKOFF_MS[attempt]));
            continue;
        }

        // Google puts the actual reason in the body; a bare status code can't tell a geo
        // rejection from a quota problem, so keep the body in the error. The params go in
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

// Completes a query that matched nothing, so half-typed searches ("har pot") can be
// retried as what the user meant ("harry potter"). The Books API itself has no
// wildcard, prefix or spelling-correction support — its `q` is whole-word only — so
// this uses the suggestion service behind the search box on books.google.com.
//
// That service is not part of the documented API and carries no compatibility
// promise, which is why every failure path here returns null: the caller then keeps
// the original (empty) result and the search behaves exactly as it did before.
export const suggestSearchQuery = async (query: string): Promise<string | null> => {
    try {
        const url = new URL("https://books.google.com/complete/search");
        url.search = new URLSearchParams({ q: query, client: "books", hl: "en", ds: "bo" }).toString();

        const response = await fetch(url.toString());
        if (!response.ok) return null;

        const suggestion = parseSuggestion(await response.text());
        if (!suggestion) return null;

        // A suggestion identical to what was searched would just repeat the same
        // empty request.
        return suggestion.toLowerCase() === query.toLowerCase() ? null : suggestion;
    } catch {
        return null;
    }
};

// The endpoint answers in one of two shapes depending on the client parameter, and
// which one is served has changed before; accept either.
const parseSuggestion = (body: string): string | null => {
    // XML: <CompleteSuggestion><suggestion data="harry potter"/></CompleteSuggestion>
    const xml = body.match(/data="([^"]*)"/);
    if (xml?.[1]) return decodeEntities(xml[1]);

    // JSONP: window.google.ac.h(["har pot",[["harry potter",0],…]])
    const open = body.indexOf("(");
    const close = body.lastIndexOf(")");
    if (open === -1 || close <= open) return null;

    try {
        const payload = JSON.parse(body.slice(open + 1, close));
        const first = Array.isArray(payload) && Array.isArray(payload[1]) ? payload[1][0] : null;
        const text = Array.isArray(first) ? first[0] : first;
        if (typeof text !== "string") return null;

        // Suggestions can carry <b> markup around the completed part.
        const clean = decodeEntities(text.replace(/<[^>]*>/g, "")).trim();
        return clean || null;
    } catch {
        return null;
    }
};

const decodeEntities = (value: string) =>
    value
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&");

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
