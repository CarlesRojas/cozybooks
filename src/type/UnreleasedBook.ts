import { z } from "zod";

export const UnreleasedBookSchema = z.object({
    id: z.number(),
    userId: z.number(),
    name: z.string(),
});

export type UnreleasedBook = z.infer<typeof UnreleasedBookSchema>;
