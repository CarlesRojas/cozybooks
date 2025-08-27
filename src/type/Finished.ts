import { z } from "zod";

export const FinishedSchema = z.object({ id: z.number(), userId: z.string(), bookId: z.string(), timestamp: z.date() });

export type Finished = z.infer<typeof FinishedSchema>;
