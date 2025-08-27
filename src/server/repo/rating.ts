import { db } from "@/server/db";
import { rating, ratingInsertSchema } from "@/server/db/schema";
import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import z from "zod";

type InsertRating = typeof rating.$inferInsert;
const RatingPkSchema = z.object({
    bookId: z.string(),
    userId: z.string(),
});
type RatingPk = z.infer<typeof RatingPkSchema>;

export const createRating = createServerFn({ method: "POST" })
    .validator((rating: InsertRating) => ratingInsertSchema.parse(rating))
    .handler(async ({ data: insertRating }) => {
        const existsRating = await db.query.rating.findFirst({
            where: (rating, { eq, and }) => and(eq(rating.bookId, insertRating.bookId), eq(rating.userId, insertRating.userId)),
        });

        if (existsRating)
            await db
                .update(rating)
                .set({ rating: insertRating.rating })
                .where(and(eq(rating.bookId, insertRating.bookId), eq(rating.userId, insertRating.userId)));
        else await db.insert(rating).values(insertRating);
    });

export const deleteRating = createServerFn({ method: "POST" })
    .validator((rating: RatingPk) => RatingPkSchema.parse(rating))
    .handler(async ({ data: ratingPk }) => {
        await db.delete(rating).where(and(eq(rating.bookId, ratingPk.bookId), eq(rating.userId, ratingPk.userId)));
    });

export const getRating = createServerFn({ method: "POST" })
    .validator((rating: RatingPk) => RatingPkSchema.parse(rating))
    .handler(async ({ data: ratingPk }) => {
        const result = await db.query.rating.findFirst({
            where: (rating, { eq, and }) => and(eq(rating.bookId, ratingPk.bookId), eq(rating.userId, ratingPk.userId)),
        });

        return result?.rating ?? null;
    });
