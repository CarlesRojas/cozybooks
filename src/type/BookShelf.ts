import { z } from "zod";

export enum BookShelfAccess {
    PUBLIC = "PUBLIC",
    PRIVATE = "PRIVATE",
}

export enum BookShelfType {
    FAVORITES = 0,
    PURCHASED = 1,
    TO_READ = 2,
    READING_NOW = 3,
    HAVE_READ = 4,
    REVIEWED = 5,
    RECENTLY_VIEWED = 6,
    MY_EBOOKS = 7,
    BOOKS_FOR_YOU = 8,
    BROWSING_HISTORY = 9,
}

export const filteredArray = (s: z.ZodTypeAny) => z.array(z.any()).transform((as) => as.filter((a) => s.safeParse(a).success));

export const BookShelfSchema = z.object({
    id: z.nativeEnum(BookShelfType),
    title: z.string(),
    description: z.string().optional(),
    access: z.nativeEnum(BookShelfAccess),
    volumeCount: z.number(),
});

export type BookShelf = z.infer<typeof BookShelfSchema>;
