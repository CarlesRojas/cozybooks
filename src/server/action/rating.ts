"use server";

import { db } from "@/server/database";
import { rating } from "@/server/schema";
import { and, eq } from "drizzle-orm";

type InsertRating = typeof rating.$inferInsert;
type RatingPk = Omit<InsertRating, "rating">;

export const createRating = async (insertRating: InsertRating) => {
    if (await existsRating(insertRating)) return updateRating(insertRating);

    await db.insert(rating).values(insertRating);
};

export const updateRating = async (insertRating: InsertRating) => {
    await db
        .update(rating)
        .set({ rating: insertRating.rating })
        .where(and(eq(rating.bookId, insertRating.bookId), eq(rating.userId, insertRating.userId)));
};

export const deleteRating = async (ratingPk: RatingPk) => {
    await db.delete(rating).where(and(eq(rating.bookId, ratingPk.bookId), eq(rating.userId, ratingPk.userId)));
};

export const existsRating = async (ratingPk: RatingPk) => {
    const result = await db.query.rating.findFirst({
        where: (rating, { eq, and }) => and(eq(rating.bookId, ratingPk.bookId), eq(rating.userId, ratingPk.userId)),
    });

    return !!result;
};

export const getRating = async (ratingPk: RatingPk) => {
    const result = await db.query.rating.findFirst({
        where: (rating, { eq, and }) => and(eq(rating.bookId, ratingPk.bookId), eq(rating.userId, ratingPk.userId)),
    });

    return result?.rating ?? null;
};
