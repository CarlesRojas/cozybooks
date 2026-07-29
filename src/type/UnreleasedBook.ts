import { z } from "zod";

// `id` is a Convex document id (the old Postgres serial ids were dropped in the migration).
export const UnreleasedBookSchema = z.object({ id: z.string(), userId: z.string(), name: z.string() });

export type UnreleasedBook = z.infer<typeof UnreleasedBookSchema>;
