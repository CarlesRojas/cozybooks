import { z } from "zod";

export const BookSchema = z.object({
    id: z.string(),

    title: z.string(),
    authors: z.array(z.string()).optional().nullable(),
    publisher: z.string().optional().nullable(),
    publishedDate: z.coerce.date().optional().nullable(),
    description: z.string().optional().nullable(),
    pageCount: z.number().optional().nullable(),
    categories: z.array(z.string()).optional().nullable(),
    mainCategory: z.string().optional().nullable(),
    averageRating: z.number().optional().nullable(),
    ratingsCount: z.number().optional().nullable(),
    language: z.string().optional().nullable(),
    previewLink: z.string().optional().nullable(),

    smallThumbnail: z.string().optional().nullable(),
    thumbnail: z.string().optional().nullable(),
    small: z.string().optional().nullable(),
    medium: z.string().optional().nullable(),
    large: z.string().optional().nullable(),
    extraLarge: z.string().optional().nullable(),

    finished: z
        .array(z.object({ timestamp: z.date() }))
        .optional()
        .nullable(),
    rating: z
        .array(z.object({ rating: z.number().nullable() }))
        .optional()
        .nullable(),
});

export type Book = z.infer<typeof BookSchema>;

export const coercedArray = <T extends z.ZodTypeAny>(arg: T) => {
    return z
        .array(arg)
        .optional()
        .transform((val) => val ?? []);
};

export const VolumesResultSchema = z.object({
    totalItems: z.number(),
    items: coercedArray(BookSchema),
});

export type VolumesResult = z.infer<typeof VolumesResultSchema>;
