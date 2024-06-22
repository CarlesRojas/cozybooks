"use server";

import { InferResultType, db } from "@/server/database";
import { finished } from "@/server/schema";
import { Finished, FinishedSchema } from "@/type/Finished";
import { eq } from "drizzle-orm";

type InsertFinished = typeof finished.$inferInsert;
type SelectFinished = InferResultType<"finished">;

export const addFinished = async (insertFinished: InsertFinished) => {
    await db.insert(finished).values(insertFinished);
};

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

export const updateFinished = async (updateFinished: WithRequired<InsertFinished, "id">) => {
    await db.update(finished).set(updateFinished).where(eq(finished.id, updateFinished.id));
};

export const deleteFinished = async (id: number) => {
    await db.delete(finished).where(eq(finished.id, id));
};

export const getFinished = async (userId: number, bookId: string) => {
    const result = await db.query.finished.findMany({
        where: (finished, { eq, and }) => and(eq(finished.userId, userId), eq(finished.bookId, bookId)),
        orderBy: (finished, { asc }) => asc(finished.timestamp),
    });

    return !!result ? result.map((elem) => toDomainFinished(elem)) : null;
};

const toDomainFinished = (finished: SelectFinished) => {
    return FinishedSchema.parse(finished) as Finished;
};
