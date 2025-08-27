import { db, InferResultType, WithRequired } from "@/server/db";
import { finished, finishedInsertSchema, finishedUpdateSchema } from "@/server/db/schema";
import { Finished, FinishedSchema } from "@/type/Finished";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import z from "zod";

type InsertFinished = typeof finished.$inferInsert;
type SelectFinished = InferResultType<"finished">;

export const addFinished = createServerFn({ method: "POST" })
    .validator((finished: InsertFinished) => {
        return finishedInsertSchema.parse(finished);
    })
    .handler(async ({ data: insertFinished }) => {
        await db.insert(finished).values(insertFinished);
    });

export const updateFinished = createServerFn({ method: "POST" })
    .validator((finished: WithRequired<InsertFinished, "id">) => {
        return finishedUpdateSchema.parse(finished);
    })
    .handler(async ({ data: updateFinished }) => {
        await db.update(finished).set(updateFinished).where(eq(finished.id, updateFinished.id));
    });

export const deleteFinished = createServerFn({ method: "POST" })
    .validator((id: number) => {
        return z.number().parse(id);
    })
    .handler(async ({ data: id }) => {
        await db.delete(finished).where(eq(finished.id, id));
    });

export const getFinished = createServerFn({ method: "GET" })
    .validator((data: { userId: string; bookId: string }) => {
        return z.object({ userId: z.string(), bookId: z.string() }).parse(data);
    })
    .handler(async ({ data: { userId, bookId } }) => {
        const result = await db.query.finished.findMany({
            where: (finished, { eq, and }) => and(eq(finished.userId, userId), eq(finished.bookId, bookId)),
            orderBy: (finished, { asc }) => asc(finished.timestamp),
        });

        return !!result ? result.map((elem) => toDomainFinished(elem)) : null;
    });

const toDomainFinished = (finished: SelectFinished) => {
    return FinishedSchema.parse(finished) as Finished;
};
