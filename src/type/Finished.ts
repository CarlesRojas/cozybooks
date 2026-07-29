import { z } from "zod";

// `id` is a Convex document id (the old Postgres serial ids were dropped in the migration).
export const FinishedSchema = z.object({ id: z.string(), userId: z.string(), bookId: z.string(), timestamp: z.date() });

export type Finished = z.infer<typeof FinishedSchema>;
