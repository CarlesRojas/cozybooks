import { v } from "convex/values";
import { bookFields } from "../schema";

// Public argument shape for a book: same fields as the `books` table but keyed by
// `id` (the Google Books volume id), matching the frontend `Book` type.
const { googleId: _googleId, ...bookFieldsWithoutGoogleId } = bookFields;

export const bookArgs = {
    id: v.string(),
    ...bookFieldsWithoutGoogleId,
};

export const bookValidator = v.object(bookArgs);
