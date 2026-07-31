export const GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1";

export const REFRESH_TOKEN_ERROR = "RefreshAccessTokenError";

export const PAGE_SIZE = 16;

export const SEARCH_DEBOUNCE_MS = 400;

// The finished page's view options live in the url so they survive a reload and can
// be linked, and in local storage so a cold start reopens the last view used.
export const SORT_STORAGE_KEY = "COZYBOOKS-finished-sort";
export const REPEATS_STORAGE_KEY = "COZYBOOKS-finished-repeats";
