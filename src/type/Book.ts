import { coercedArray } from "@/util";
import { z } from "zod";

export const BookSchema = z.object({
    id: z.string(),

    title: z.string(),
    authors: z.array(z.string()).optional(),
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

    smallThumbnail: z.string().optional(),
    thumbnail: z.string().optional(),
    small: z.string().optional(),
    medium: z.string().optional(),
    large: z.string().optional(),
    extraLarge: z.string().optional(),
});

export type Book = z.infer<typeof BookSchema>;

export const VolumesResultSchema = z.object({
    totalItems: z.number(),
    items: coercedArray(BookSchema),
});

export type VolumesResult = z.infer<typeof VolumesResultSchema>;
