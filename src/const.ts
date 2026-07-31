export const GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1";

export const REFRESH_TOKEN_ERROR = "RefreshAccessTokenError";

export const PAGE_SIZE = 16;

export const SEARCH_DEBOUNCE_MS = 400;

// How long a tab stays unclickable after another one is picked. Long enough to
// swallow a second tap landing on top of the first, short enough that a slow route
// never leaves the navigation feeling dead — the block lifts on this timer or when
// the navigation lands, whichever comes first.
export const NAVIGATION_BLOCK_MS = 250;

// The finished page's view options live in the url so they survive a reload and can
// be linked, and in local storage so a cold start reopens the last view used.
export const SORT_STORAGE_KEY = "COZYBOOKS-finished-sort";
export const REPEATS_STORAGE_KEY = "COZYBOOKS-finished-repeats";
