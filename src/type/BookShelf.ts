import { z } from "zod";

export enum BookShelfAccess {
    PUBLIC = "PUBLIC",
    PRIVATE = "PRIVATE",
}

export enum BookShelfType {
    FAVORITES = 0,
    PURCHASED = 1,
    TO_READ = 2,
    READING_NOW = 0, // I'm using the Favorites (0) instad of the ReadingNow (3) because that one always throws a 503
    HAVE_READ = 4,
    REVIEWED = 5,
    RECENTLY_VIEWED = 6,
    MY_EBOOKS = 7,
    BOOKS_FOR_YOU = 8,
    BROWSING_HISTORY = 9,
}

export const BookShelfSchema = z.object({
    id: z.nativeEnum(BookShelfType),
    title: z.string(),
    description: z.string().optional(),
    access: z.nativeEnum(BookShelfAccess),
    volumeCount: z.number(),
});

export type BookShelf = z.infer<typeof BookShelfSchema>;
