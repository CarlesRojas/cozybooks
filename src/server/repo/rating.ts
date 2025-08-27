import { db } from "@/server/db";
import { rating, ratingInsertSchema } from "@/server/db/schema";
import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";

type InsertRating = typeof rating.$inferInsert;
type RatingPk = Omit<InsertRating, "rating">;

export const createRating = createServerFn({ method: "POST" })
    .validator((rating: InsertRating) => {
        return ratingInsertSchema.parse(rating);
    })
    .handler(async ({ data: insertRating }) => {
        await db.insert(rating).values(insertRating);
    });

export const updateRating = createServerFn({ method: "POST" })
    .validator((rating: InsertRating) => {
        return ratingInsertSchema.parse(rating);
    })
    .handler(async ({ data: insertRating }) => {
        await db
            .update(rating)
            .set({ rating: insertRating.rating })
            .where(and(eq(rating.bookId, insertRating.bookId), eq(rating.userId, insertRating.userId)));
    });

export const deleteRating = createServerFn({ method: "POST" })
    .validator((rating: RatingPk) => {
        return ratingInsertSchema.parse(rating);
    })
    .handler(async ({ data: ratingPk }) => {
        await db.delete(rating).where(and(eq(rating.bookId, ratingPk.bookId), eq(rating.userId, ratingPk.userId)));
    });

export const existsRating = createServerFn({ method: "POST" })
    .validator((rating: RatingPk) => {
        return ratingInsertSchema.parse(rating);
    })
    .handler(async ({ data: ratingPk }) => {
        const result = await db.query.rating.findFirst({
            where: (rating, { eq, and }) => and(eq(rating.bookId, ratingPk.bookId), eq(rating.userId, ratingPk.userId)),
        });

        return !!result;
    });

export const getRating = createServerFn({ method: "POST" })
    .validator((rating: RatingPk) => {
        return ratingInsertSchema.parse(rating);
    })
    .handler(async ({ data: ratingPk }) => {
        const result = await db.query.rating.findFirst({
            where: (rating, { eq, and }) => and(eq(rating.bookId, ratingPk.bookId), eq(rating.userId, ratingPk.userId)),
        });

        return result?.rating ?? null;
    });
