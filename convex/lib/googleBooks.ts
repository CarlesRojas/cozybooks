// Google Books API helpers shared by the actions in `googleBooks.ts` and `books.ts`.
// Counterpart of the parsing logic in `src/server/repo/book.ts` / `src/lib/util.tsx`.

export const GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1";

// Google Books answers 503 when it can't geolocate the caller, which is every
// request from a datacenter IP — so every request from a Convex action, where these
// calls now run (they used to go out from the app server on the developer's own
// machine). Sending an explicit `country` is the documented way around it.
// Override per deployment with `npx convex env set GOOGLE_BOOKS_COUNTRY ES`.
export const googleBooksCountry = () => process.env.GOOGLE_BOOKS_COUNTRY ?? "US";

// Google puts the actual reason in the response body; a bare status code can't tell
// a geo rejection from an expired token, so keep the body in the error.
export const googleBooksFetch = async (url: URL, init?: RequestInit) => {
    const response = await fetch(url.toString(), init);

    if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`Google Books request to ${url.pathname} failed with status ${response.status}: ${body.slice(0, 300)}`);
    }

    return response.json();
};

// Google bookshelf ids (see `src/type/BookShelf.ts`).
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
