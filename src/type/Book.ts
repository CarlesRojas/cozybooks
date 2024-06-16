import { z } from "zod";

export const BookImageLinksSchema = z.object({
    smallThumbnail: z.string().optional(),
    thumbnail: z.string().optional(),
    small: z.string().optional(),
    medium: z.string().optional(),
    large: z.string().optional(),
    extraLarge: z.string().optional(),
});

export type BookImageLinks = z.infer<typeof BookImageLinksSchema>;

export const UserInfoSchema = z.object({
    review: z.object({
        // TODO Get user review
    }),
});

export type UserInfo = z.infer<typeof UserInfoSchema>;

export const VolumeInfoSchema = z.object({
    title: z.string(),
    authors: z.array(z.string()),
    publisher: z.string().optional(),
    publishedDate: z.coerce.date().optional(),
    description: z.string().optional(),
    pageCount: z.number().optional(),
    categories: z.array(z.string()).optional(),
    mainCategory: z.string().optional(),
    averageRating: z.number().optional(),
    ratingsCount: z.number().optional(),
    language: z.string().optional(),
    previewLink: z.string().optional(),
    imageLinks: BookImageLinksSchema.optional(),
    userInfo: UserInfoSchema.optional(),
});

export type VolumeInfo = z.infer<typeof VolumeInfoSchema>;

export const BookSchema = z.object({
    id: z.string(),
    volumeInfo: VolumeInfoSchema,
});

export type Book = z.infer<typeof BookSchema>;

export const SearchResultSchema = z.object({
    totalItems: z.number(),
    items: z.array(BookSchema),
});

export type SearchResult = z.infer<typeof SearchResultSchema>;
