import { z } from "zod";

export enum LibraryType {
    READING = "READING",
    TO_READ = "TO_READ",
    FINISHED = "FINISHED",
}

export const LibraryBookSchema = z.object({
    bookId: z.string(),
    type: z.nativeEnum(LibraryType),
    userId: z.number(),
    createdAt: z.date(),
});

export type LibraryBook = z.infer<typeof LibraryBookSchema>;
